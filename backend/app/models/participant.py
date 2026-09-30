from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import utcnow, enum_column
from app.models.enums import ParticipantRole, ParticipantStatus

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.meeting import Meeting
    from app.models.user import User

class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = (
        # "Who is currently in this meeting?" is our hottest query (polled)
        Index("ix_participants_meeting_status", "meeting_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"))
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")  # NULL = guest
    )
    display_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[ParticipantRole] = mapped_column(
        enum_column(ParticipantRole), default=ParticipantRole.PARTICIPANT
    )
    is_muted: Mapped[bool] = mapped_column(default=False)
    is_video_off: Mapped[bool] = mapped_column(default=False)
    status: Mapped[ParticipantStatus] = mapped_column(
        enum_column(ParticipantStatus), default=ParticipantStatus.JOINED
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    meeting: Mapped["Meeting"] = relationship(back_populates="participants")
    user: Mapped["User | None"] = relationship(back_populates="participations")