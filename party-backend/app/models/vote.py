# app/models/vote.py
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class Vote(SQLModel, table=True):
    __tablename__ = "votes"

    id: Optional[int] = Field(default=None, primary_key=True)

    room_id: int = Field(index=True)
    user_id: int = Field(index=True)

    track_uri: str = Field(index=True)  # ex: "spotify:track:..."
    is_like: bool = Field(default=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
