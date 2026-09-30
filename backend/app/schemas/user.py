from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    avatar_url: str | None = None

class HostPublic(BaseModel):
    """What a person who merely has the meeting ID may see about the host."""
    model_config = ConfigDict(from_attributes=True)

    name: str
    avatar_url: str | None = None