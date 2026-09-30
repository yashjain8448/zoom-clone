from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select, update
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
    MeetingPublicOut, ParticipantOut, ParticipantRef, ScheduleMeetingCreate, ParticipantMediaUpdate,
)
from app.services import meeting_service as svc

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

# A meeting nobody has started stays in "Upcoming" for a while after its start time.
UPCOMING_GRACE = timedelta(minutes=15)

def _require_host(db: Session, meeting: Meeting, participant_id: int) -> Participant:
    """The actor must be a HOST of this meeting and still inside. Scoped lookup, like everywhere else."""
    actor = svc.get_participant(db, meeting.id, participant_id)
    if actor is None:
        raise HTTPException(404, "Participant not found in this meeting.")
    if actor.role is not ParticipantRole.HOST or actor.status is not ParticipantStatus.JOINED:
        raise HTTPException(403, "Only the host can do that.")
    return actor

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

@router.patch("/{code}/participants/{participant_id}", response_model=ParticipantOut)
def update_participant_media(
    participant_id: int,
    payload: ParticipantMediaUpdate,
    meeting: Meeting = Depends(get_meeting_or_404),
    db: Session = Depends(get_db),
):
    """Mute/unmute or camera on/off. Scoped to this meeting; only for people still inside."""
    participant = svc.get_participant(db, meeting.id, participant_id)
    if participant is None:
        raise HTTPException(404, "Participant not found in this meeting.")
    if participant.status is not ParticipantStatus.JOINED:
        raise HTTPException(409, "You are no longer in this meeting.")

    # exclude_none: an explicit null would violate NOT NULL, so absent and null both mean "unchanged"
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(participant, field, value)
    db.commit()
    db.refresh(participant)
    return participant

@router.post("/{code}/mute-all", status_code=204)
def mute_all(
    payload: ParticipantRef,
    meeting: Meeting = Depends(get_meeting_or_404),
    db: Session = Depends(get_db),
):
    """Host mutes every guest currently inside. One UPDATE statement; the host is skipped."""
    if meeting.status is MeetingStatus.ENDED:
        raise HTTPException(410, "This meeting has ended.")
    _require_host(db, meeting, payload.participant_id)

    db.execute(
        update(Participant)
        .where(
            Participant.meeting_id == meeting.id,
            Participant.status == ParticipantStatus.JOINED,
            Participant.role != ParticipantRole.HOST,
        )
        .values(is_muted=True)
    )
    db.commit()


@router.delete("/{code}/participants/{participant_id}", status_code=204)
def remove_participant(
    participant_id: int,
    actor_id: int = Query(description="Participant id of the host making the request"),
    meeting: Meeting = Depends(get_meeting_or_404),
    db: Session = Depends(get_db),
):
    """Host removes a guest. Idempotent. Not a ban: the guest can rejoin via the lobby."""
    if meeting.status is MeetingStatus.ENDED:
        raise HTTPException(410, "This meeting has ended.")
    _require_host(db, meeting, actor_id)

    target = svc.get_participant(db, meeting.id, participant_id)
    if target is None:
        raise HTTPException(404, "Participant not found in this meeting.")
    if target.role is ParticipantRole.HOST:
        raise HTTPException(400, "The host can't be removed.")

    if target.status is ParticipantStatus.JOINED:  # already gone = nothing to do
        target.status = ParticipantStatus.REMOVED
        target.left_at = utcnow()
        db.commit()