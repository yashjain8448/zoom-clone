from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.models.enums import ParticipantRole, ParticipantStatus
from app.schemas.common import UTCDateTime

DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class JoinRequest(BaseModel):
    display_name: DisplayName


class ParticipantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    display_name: str
    role: ParticipantRole
    is_muted: bool
    is_video_off: bool
    status: ParticipantStatus
    joined_at: UTCDateTime