from datetime import datetime
from sqlalchemy import (
    String, Text, DateTime, ForeignKey, CheckConstraint, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import utcnow, enum_column
from app.models.enums import MeetingType, MeetingStatus

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.participant import Participant
    from app.models.invitee import MeetingInvitee


class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (
        CheckConstraint("duration_minutes > 0", name="ck_meeting_duration_positive"),
        CheckConstraint(
            "type = 'instant' OR scheduled_start IS NOT NULL",
            name="ck_scheduled_meeting_has_start",
        ),
        # Serves the Upcoming query: WHERE status='scheduled' ORDER BY scheduled_start
        Index("ix_meetings_status_start", "status", "scheduled_start"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_code: Mapped[str] = mapped_column(String(11), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)

    host_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True
    )
    type: Mapped[MeetingType] = mapped_column(enum_column(MeetingType))
    status: Mapped[MeetingStatus] = mapped_column(
        enum_column(MeetingStatus), default=MeetingStatus.SCHEDULED
    )

    scheduled_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_minutes: Mapped[int] = mapped_column(default=40)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    passcode: Mapped[str | None] = mapped_column(String(10))

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    host: Mapped["User"] = relationship(back_populates="hosted_meetings")
    participants: Mapped[list["Participant"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )
    invitees: Mapped[list["MeetingInvitee"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )