from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.models.enums import ParticipantRole, ParticipantStatus
from app.schemas.common import UTCDateTime
from app.schemas.meeting import MeetingPublicOut

DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class JoinRequest(BaseModel):
    display_name: DisplayName
    # Host claim. Verified only against the default user (no auth in scope).
    as_host: bool = False


class ParticipantRef(BaseModel):
    participant_id: int


class ParticipantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    display_name: str
    role: ParticipantRole
    is_muted: bool
    is_video_off: bool
    status: ParticipantStatus
    joined_at: UTCDateTime


class JoinResponse(BaseModel):
    participant: ParticipantOut
    meeting: MeetingPublicOut

class ParticipantMediaUpdate(BaseModel):
    """Partial update of a participant's own mic/camera state."""
    is_muted: bool | None = None
    is_video_off: bool | None = None