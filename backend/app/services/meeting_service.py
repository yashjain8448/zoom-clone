from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Meeting, User
from app.services.meeting_code import random_code

MAX_CODE_ATTEMPTS = 10


def generate_unique_code(db: Session) -> str:
    """Best-effort uniqueness check. The UNIQUE constraint is the final guarantee."""
    for _ in range(MAX_CODE_ATTEMPTS):
        code = random_code()
        if db.scalar(select(Meeting.id).where(Meeting.meeting_code == code)) is None:
            return code
    raise RuntimeError("Could not generate a unique meeting code")


def get_meeting_by_code(db: Session, code: str) -> Meeting | None:
    return db.scalar(select(Meeting).where(Meeting.meeting_code == code))


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))