# app/models/room_participant.py
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class RoomParticipant(SQLModel, table=True):
    __tablename__ = "room_participants"

    id: Optional[int] = Field(default=None, primary_key=True)

    room_id: int = Field(index=True)
    user_id: int = Field(index=True)

    joined_at: datetime = Field(default_factory=datetime.utcnow)
