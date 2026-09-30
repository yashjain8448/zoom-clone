from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user, get_meeting_or_404, resolve_meeting
from app.models import Meeting, MeetingInvitee, Participant, User
from app.models.common import utcnow
from app.models.enums import (
    MeetingStatus, MeetingType, ParticipantRole, ParticipantStatus,
)
from app.schemas import (
    InstantMeetingCreate, JoinRequest, JoinResponse, MeetingOut,
    MeetingPublicOut, ParticipantOut, ParticipantRef, ScheduleMeetingCreate,
)
from app.services import meeting_service as svc

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

# A meeting nobody has started stays in "Upcoming" for a while after its start time.
UPCOMING_GRACE = timedelta(minutes=15)


# ---------------------------------------------------------------- create

@router.post("/instant", response_model=MeetingOut, status_code=201)
def create_instant_meeting(
    payload: InstantMeetingCreate | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = (payload.title if payload else None) or f"{user.name}'s Zoom Meeting"
    return svc.create_meeting(
        db,
        host_id=user.id,
        title=title,
        type_=MeetingType.INSTANT,
        status=MeetingStatus.LIVE,
        started_at=utcnow(),
    )


@router.post("/schedule", response_model=MeetingOut, status_code=201)
def schedule_meeting(
    payload: ScheduleMeetingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return svc.create_meeting(
        db,
        host_id=user.id,
        title=payload.title,
        description=payload.description,
        type_=MeetingType.SCHEDULED,
        status=MeetingStatus.SCHEDULED,
        scheduled_start=payload.scheduled_start,
        duration_minutes=payload.duration_minutes,
        timezone=payload.timezone,
        passcode=payload.passcode,
        invitee_emails=payload.invitees,
    )


# ------------------------------------------------- lists (declare BEFORE /{code})

@router.get("/upcoming", response_model=list[MeetingOut])
def list_upcoming(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invited = select(MeetingInvitee.meeting_id).where(MeetingInvitee.email == user.email)
    stmt = (
        select(Meeting)
        .options(joinedload(Meeting.host))
        .where(
            Meeting.status == MeetingStatus.SCHEDULED,
            Meeting.scheduled_start >= utcnow() - UPCOMING_GRACE,
            or_(Meeting.host_id == user.id, Meeting.id.in_(invited)),
        )
        .order_by(Meeting.scheduled_start)
    )
    return db.scalars(stmt).all()


@router.get("/recent", response_model=list[MeetingOut])
def list_recent(
    limit: int = Query(default=10, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attended = select(Participant.meeting_id).where(Participant.user_id == user.id)
    stmt = (
        select(Meeting)
        .options(joinedload(Meeting.host))
        .where(
            Meeting.status == MeetingStatus.ENDED,
            or_(Meeting.host_id == user.id, Meeting.id.in_(attended)),
        )
        .order_by(Meeting.ended_at.desc())
        .limit(limit)
    )
    return db.scalars(stmt).all()


@router.get("/lookup", response_model=MeetingPublicOut)
def lookup_meeting(
    q: str = Query(min_length=1, max_length=500),
    db: Session = Depends(get_db),
):
    """Join box: the user pastes an ID *or* a full invite link; parsing lives server-side."""
    return resolve_meeting(db, q)


# ---------------------------------------------------------------- one meeting

@router.get("/{code}", response_model=MeetingPublicOut)
def get_meeting(meeting: Meeting = Depends(get_meeting_or_404)):
    return meeting


@router.post("/{code}/join", response_model=JoinResponse, status_code=201)
def join_meeting(
    payload: JoinRequest,
    meeting: Meeting = Depends(get_meeting_or_404),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if meeting.status is MeetingStatus.ENDED:
        raise HTTPException(410, "This meeting has ended.")
    if payload.as_host and meeting.host_id != user.id:
        raise HTTPException(403, "Only the host can join as host.")

    svc.start_if_scheduled(meeting)
    participant = Participant(
        meeting_id=meeting.id,
        user_id=user.id if payload.as_host else None,  # guests have no account
        display_name=payload.display_name,
        role=ParticipantRole.HOST if payload.as_host else ParticipantRole.PARTICIPANT,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return {"participant": participant, "meeting": meeting}


@router.post("/{code}/leave", status_code=204)
def leave_meeting(
    payload: ParticipantRef,
    meeting: Meeting = Depends(get_meeting_or_404),
    db: Session = Depends(get_db),
):
    participant = svc.get_participant(db, meeting.id, payload.participant_id)
    if participant is None:
        raise HTTPException(404, "Participant not found in this meeting.")
    svc.leave_meeting(db, meeting, participant)
    db.commit()


@router.post("/{code}/end", response_model=MeetingOut)
def end_meeting(
    payload: ParticipantRef,
    meeting: Meeting = Depends(get_meeting_or_404),
    db: Session = Depends(get_db),
):
    participant = svc.get_participant(db, meeting.id, payload.participant_id)
    if participant is None:
        raise HTTPException(404, "Participant not found in this meeting.")
    if participant.role is not ParticipantRole.HOST:
        raise HTTPException(403, "Only the host can end the meeting.")

    if meeting.status is not MeetingStatus.ENDED:  # idempotent
        svc.end_meeting(db, meeting)
        db.commit()
        db.refresh(meeting)
    return meeting


@router.get("/{code}/participants", response_model=list[ParticipantOut])
def list_participants(
    meeting: Meeting = Depends(get_meeting_or_404),
    db: Session = Depends(get_db),
):
    """Polled by the meeting room. Served by ix_participants_meeting_status."""
    stmt = (
        select(Participant)
        .where(
            Participant.meeting_id == meeting.id,
            Participant.status == ParticipantStatus.JOINED,
        )
        .order_by(Participant.joined_at, Participant.id)
    )
    return db.scalars(stmt).all()