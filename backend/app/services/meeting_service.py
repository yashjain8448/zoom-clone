from datetime import datetime

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import Meeting, MeetingInvitee, Participant, User
from app.models.common import utcnow
from app.models.enums import MeetingStatus, MeetingType, ParticipantStatus
from app.services.meeting_code import random_code, random_passcode

MAX_CODE_ATTEMPTS = 10


def generate_unique_code(db: Session) -> str:
    """Best-effort uniqueness check. The UNIQUE constraint is the final guarantee."""
    for _ in range(MAX_CODE_ATTEMPTS):
        code = random_code()
        if db.scalar(select(Meeting.id).where(Meeting.meeting_code == code)) is None:
            return code
    raise RuntimeError("Could not generate a unique meeting code")


def get_meeting_by_code(db: Session, code: str) -> Meeting | None:
    # joinedload: many-to-one, so one JOIN instead of a lazy query per meeting (N+1)
    return db.scalar(
        select(Meeting)
        .options(joinedload(Meeting.host))
        .where(Meeting.meeting_code == code)
    )


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_participant(db: Session, meeting_id: int, participant_id: int) -> Participant | None:
    """Scoped to the meeting, so an id from another meeting can never match."""
    return db.scalar(
        select(Participant).where(
            Participant.id == participant_id,
            Participant.meeting_id == meeting_id,
        )
    )


def create_meeting(
    db: Session,
    *,
    host_id: int,
    title: str,
    type_: MeetingType,
    status: MeetingStatus,
    description: str | None = None,
    scheduled_start: datetime | None = None,
    started_at: datetime | None = None,
    duration_minutes: int = 40,
    timezone: str = "UTC",
    passcode: str | None = None,
    invitee_emails: list[str] | tuple[str, ...] = (),
) -> Meeting:
    """
    Insert a meeting with a fresh code. If two requests pick the same code at the
    same instant, the UNIQUE constraint rejects one insert and we retry with a new code.
    """
    emails = sorted({e.strip().lower() for e in invitee_emails})  # dedupe: unique per meeting

    for _ in range(MAX_CODE_ATTEMPTS):
        meeting = Meeting(
            meeting_code=generate_unique_code(db),
            host_id=host_id,
            title=title,
            description=description,
            type=type_,
            status=status,
            scheduled_start=scheduled_start,
            started_at=started_at,
            duration_minutes=duration_minutes,
            timezone=timezone,
            passcode=passcode or random_passcode(),
            invitees=[MeetingInvitee(email=e) for e in emails],
        )
        db.add(meeting)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            if "meeting_code" not in str(exc.orig):
                raise  # a different constraint failed, so retrying would hide a real bug
            continue
        db.refresh(meeting)
        return meeting

    raise RuntimeError("Could not allocate a unique meeting code")


def start_if_scheduled(meeting: Meeting) -> None:
    """First person in flips a scheduled meeting to live ('join before host')."""
    if meeting.status is MeetingStatus.SCHEDULED:
        meeting.status = MeetingStatus.LIVE
        meeting.started_at = utcnow()


def end_meeting(db: Session, meeting: Meeting) -> None:
    """Mark ended and check out everyone still inside. Caller commits."""
    now = utcnow()
    meeting.status = MeetingStatus.ENDED
    meeting.ended_at = now
    db.execute(
        update(Participant)
        .where(
            Participant.meeting_id == meeting.id,
            Participant.status == ParticipantStatus.JOINED,
        )
        .values(status=ParticipantStatus.LEFT, left_at=now)
    )


def leave_meeting(db: Session, meeting: Meeting, participant: Participant) -> None:
    """Idempotent. Ends the meeting when the last person leaves. Caller commits."""
    if participant.status is not ParticipantStatus.JOINED:
        return
    participant.status = ParticipantStatus.LEFT
    participant.left_at = utcnow()
    db.flush()  # autoflush is off; the count below must see the row we just changed

    remaining = db.scalar(
        select(func.count(Participant.id)).where(
            Participant.meeting_id == meeting.id,
            Participant.status == ParticipantStatus.JOINED,
        )
    )
    if remaining == 0 and meeting.status is MeetingStatus.LIVE:
        end_meeting(db, meeting)