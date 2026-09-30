from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Meeting, User
from app.services.meeting_code import normalize_code
from app.services.meeting_service import get_meeting_by_code, get_user_by_email


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Auth is out of scope: every request acts as the configured default user."""
    user = get_user_by_email(db, settings.default_user_email)
    if user is None:
        raise HTTPException(500, "Default user missing. Has the database been seeded?")
    return user


def resolve_meeting(db: Session, raw: str) -> Meeting:
    """Accepts a bare code, a spaced code, or a full invite link."""
    code = normalize_code(raw)
    if code is None:
        raise HTTPException(400, "Enter a valid 11-digit Meeting ID or invite link.")
    meeting = get_meeting_by_code(db, code)
    if meeting is None:
        raise HTTPException(404, "Meeting not found. Check the ID and try again.")
    return meeting


def get_meeting_or_404(code: str, db: Session = Depends(get_db)) -> Meeting:
    return resolve_meeting(db, code)