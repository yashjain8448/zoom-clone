from datetime import datetime, timedelta, timezone
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import (
    BaseModel, ConfigDict, EmailStr, Field, StringConstraints,
    computed_field, field_validator,
)

from app.config import settings
from app.models.enums import MeetingStatus, MeetingType
from app.schemas.common import UTCDateTime
from app.services.meeting_code import format_code
from app.schemas.user import HostPublic, UserOut   # replace the existing user import

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class InstantMeetingCreate(BaseModel):
    title: Title | None = None          # defaults to "<Name>'s Zoom Meeting" in the router


class ScheduleMeetingCreate(BaseModel):
    title: Title
    description: str | None = Field(default=None, max_length=2000)
    scheduled_start: UTCDateTime
    duration_minutes: int = Field(default=40, ge=5, le=1440)
    timezone: str = Field(default="UTC", max_length=64)
    passcode: str | None = Field(default=None, min_length=4, max_length=10)
    invitees: list[EmailStr] = Field(default_factory=list, max_length=100)

    @field_validator("scheduled_start")
    @classmethod
    def _not_in_past(cls, value: datetime) -> datetime:
        if value < datetime.now(timezone.utc) - timedelta(minutes=1):
            raise ValueError("Meeting start time cannot be in the past")
        return value

    @field_validator("timezone")
    @classmethod
    def _valid_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError(f"Unknown timezone: {value}")
        return value


class MeetingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_code: str
    title: str
    description: str | None
    type: MeetingType
    status: MeetingStatus
    scheduled_start: UTCDateTime | None
    duration_minutes: int
    timezone: str
    passcode: str | None
    started_at: UTCDateTime | None
    ended_at: UTCDateTime | None
    host: UserOut

    @computed_field
    @property
    def display_code(self) -> str:
        return format_code(self.meeting_code)

    @computed_field
    @property
    def invite_link(self) -> str:
        return f"{settings.frontend_url}/j/{self.meeting_code}"

class MeetingPublicOut(BaseModel):
    """Lookup/lobby view. Deliberately excludes passcode, host email, and internal ids."""
    model_config = ConfigDict(from_attributes=True)

    meeting_code: str
    title: str
    type: MeetingType
    status: MeetingStatus
    scheduled_start: UTCDateTime | None
    duration_minutes: int
    host: HostPublic

    @computed_field
    @property
    def display_code(self) -> str:
        return format_code(self.meeting_code)