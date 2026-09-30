from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import utcnow


from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.meeting import Meeting
    from app.models.participant import Participant

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    hosted_meetings: Mapped[list["Meeting"]] = relationship(back_populates="host")
    participations: Mapped[list["Participant"]] = relationship(back_populates="user")