import enum
from datetime import datetime, timezone
from sqlalchemy import Enum as SAEnum


def utcnow() -> datetime:
    """Timezone-aware UTC 'now'. All timestamps in the DB are UTC."""
    return datetime.now(timezone.utc)


def enum_column(enum_cls: type[enum.Enum], length: int = 20) -> SAEnum:
    """Store enums as VARCHAR of their *values* (portable, readable in the DB)."""
    return SAEnum(
        enum_cls,
        native_enum=False,
        length=length,
        values_callable=lambda e: [member.value for member in e],
    )