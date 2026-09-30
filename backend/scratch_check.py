from sqlalchemy import select, func
from app.database import SessionLocal
from app.models import Meeting, Participant
from app.models.enums import MeetingStatus
from app.schemas import MeetingOut
from app.services.meeting_code import normalize_code, format_code

print(normalize_code("http://localhost:3000/j/12345678901?pwd=abc"))  # 12345678901
print(normalize_code("123 4567 8901"))                                # 12345678901
print(normalize_code("123"))                                          # None
print(format_code("12345678901"))                                     # 123 4567 8901

with SessionLocal() as db:
    print("meetings:", db.scalar(select(func.count(Meeting.id))))         # 9
    print("participants:", db.scalar(select(func.count(Participant.id)))) # 10
    m = db.scalar(select(Meeting).where(Meeting.status == MeetingStatus.SCHEDULED))
    print(MeetingOut.model_validate(m).model_dump_json(indent=2))