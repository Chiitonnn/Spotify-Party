# app/models/user.py
from typing import Optional
from sqlmodel import SQLModel, Field


class SpotifyUser(SQLModel, table=True):
    __tablename__ = "spotify_users"

    id: Optional[int] = Field(default=None, primary_key=True)
    spotify_id: str = Field(index=True, unique=True)

    display_name: Optional[str] = None
    email: Optional[str] = None

    access_token: str
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None
    scope: Optional[str] = None
    expires_in: Optional[int] = None
