import enum


class MeetingType(str, enum.Enum):
    INSTANT = "instant"
    SCHEDULED = "scheduled"


class MeetingStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    ENDED = "ended"


class ParticipantRole(str, enum.Enum):
    HOST = "host"
    PARTICIPANT = "participant"


class ParticipantStatus(str, enum.Enum):
    JOINED = "joined"
    LEFT = "left"
    REMOVED = "removed"