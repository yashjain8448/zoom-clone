from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import Meeting, MeetingInvitee, Participant, User
from app.models.common import utcnow
from app.models.enums import (
    MeetingStatus, MeetingType, ParticipantRole, ParticipantStatus,
)
from app.services.meeting_code import random_passcode
from app.services.meeting_service import generate_unique_code


def _at(days: int, hour: int, minute: int = 0) -> datetime:
    """A UTC datetime `days` from now at hh:mm. Relative, so seed data never goes stale."""
    return (utcnow() + timedelta(days=days)).replace(
        hour=hour, minute=minute, second=0, microsecond=0
    )


def _make_meeting(
    db: Session, host: User, *, title: str, type_: MeetingType, status: MeetingStatus,
    start: datetime | None = None, duration: int = 40, description: str | None = None,
    invitees: tuple[str, ...] = (),
) -> Meeting:
    meeting = Meeting(
        meeting_code=generate_unique_code(db),
        title=title, description=description, host=host,
        type=type_, status=status, scheduled_start=start,
        duration_minutes=duration, passcode=random_passcode(),
    )
    if status is MeetingStatus.ENDED and start:
        meeting.started_at = start
        meeting.ended_at = start + timedelta(minutes=duration)
    for email in invitees:
        meeting.invitees.append(MeetingInvitee(email=email))
    db.add(meeting)
    db.flush()  # autoflush is off; flush so the next uniqueness check sees this code
    return meeting


def _attend(meeting: Meeting, attendees: list[tuple[User | None, str]]) -> None:
    """Record who attended a finished meeting. user=None means a guest."""
    for i, (user, name) in enumerate(attendees):
        meeting.participants.append(Participant(
            user=user,
            display_name=name,
            role=ParticipantRole.HOST if user is meeting.host else ParticipantRole.PARTICIPANT,
            status=ParticipantStatus.LEFT,
            joined_at=meeting.started_at + timedelta(minutes=i),
            left_at=meeting.ended_at,
        ))


def seed_if_empty(db: Session) -> bool:
    """Idempotent: does nothing if any user exists. Returns True if it seeded."""
    if db.scalar(select(User.id).limit(1)) is not None:
        return False

    alex = User(name="Alex Morgan", email=settings.default_user_email)
    priya = User(name="Priya Sharma", email="priya.sharma@example.com")
    sam = User(name="Sam Lee", email="sam.lee@example.com")
    maria = User(name="Maria Garcia", email="maria.garcia@example.com")
    db.add_all([alex, priya, sam, maria])
    db.flush()

    S, T = MeetingStatus.SCHEDULED, MeetingType.SCHEDULED

    # ---- Upcoming ----
    soon = utcnow() + timedelta(hours=2)
    _make_meeting(db, alex, title="Product Roadmap Review", type_=T, status=S,
                  start=soon.replace(minute=0, second=0, microsecond=0),
                  duration=60, description="Quarterly roadmap walkthrough.")
    _make_meeting(db, alex, title="Weekly Team Sync", type_=T, status=S,
                  start=_at(1, 10), duration=30, description="Standing weekly sync.")
    _make_meeting(db, priya, title="Design Critique", type_=T, status=S,
                  start=_at(2, 15, 30), duration=45,
                  description="Review new onboarding flow.", invitees=(alex.email,))
    _make_meeting(db, alex, title="Sprint Planning", type_=T, status=S,
                  start=_at(3, 9), duration=90)
    _make_meeting(db, alex, title="1:1 with Manager", type_=T, status=S,
                  start=_at(5, 14), duration=30)

    # ---- Recent (ended) ----
    m1 = _make_meeting(db, alex, title="Client Kickoff Call", type_=T,
                       status=MeetingStatus.ENDED, start=_at(-1, 11), duration=45)
    _attend(m1, [(alex, alex.name), (priya, priya.name), (sam, sam.name)])

    m2 = _make_meeting(db, alex, title="Interview: Frontend Engineer", type_=T,
                       status=MeetingStatus.ENDED, start=_at(-2, 16), duration=60)
    _attend(m2, [(alex, alex.name), (None, "Jordan Blake (Guest)")])

    m3 = _make_meeting(db, priya, title="Sprint Retrospective", type_=T,
                       status=MeetingStatus.ENDED, start=_at(-3, 13), duration=50)
    _attend(m3, [(priya, priya.name), (alex, alex.name), (maria, maria.name)])

    m4 = _make_meeting(db, alex, title=f"{alex.name}'s Zoom Meeting",
                       type_=MeetingType.INSTANT, status=MeetingStatus.ENDED,
                       start=_at(-4, 17), duration=15)
    _attend(m4, [(alex, alex.name), (sam, sam.name)])

    db.commit()
    return True


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        print("Seeded." if seed_if_empty(session) else "DB already has data, skipping.")