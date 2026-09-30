from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from app.database import SessionLocal
from app.models import User, Meeting
from app.models.enums import MeetingType

db = SessionLocal()
u = User(name="Test", email="t@example.com")
db.add(u); db.commit()

# 1) scheduled meeting WITHOUT a start time -> must fail
try:
    db.add(Meeting(meeting_code="11111111111", title="x", host_id=u.id,
                   type=MeetingType.SCHEDULED))
    db.commit()
except IntegrityError as e:
    db.rollback(); print("OK, check constraint blocked it:", e.orig)

# 2) nonexistent host -> must fail (proves FK pragma is on)
try:
    db.add(Meeting(meeting_code="22222222222", title="y", host_id=999,
                   type=MeetingType.INSTANT))
    db.commit()
except IntegrityError as e:
    db.rollback(); print("OK, FK blocked it:", e.orig)

db.delete(u); db.commit()   # cleanup