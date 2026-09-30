from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.meeting import Meeting

class MeetingInvitee(Base):
    __tablename__ = "meeting_invitees"
    __table_args__ = (
        UniqueConstraint("meeting_id", "email", name="uq_invitee_per_meeting"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"))
    email: Mapped[str] = mapped_column(String(255))

    meeting: Mapped["Meeting"] = relationship(back_populates="invitees")