# app/models/room.py
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class Room(SQLModel, table=True):
    __tablename__ = "rooms"

    id: Optional[int] = Field(default=None, primary_key=True)

    code: str = Field(index=True, unique=True)
    host_user_id: int = Field(index=True)

    like_threshold: int = 1
    is_active: bool = True

    created_at: datetime = Field(default_factory=datetime.utcnow)

    # 🔽 Nouveau : infos sur la musique en cours de vote
    current_track_uri: Optional[str] = Field(default=None, index=True)
    current_track_name: Optional[str] = None
    current_track_artists: Optional[str] = None
    current_track_image_url: Optional[str] = None
