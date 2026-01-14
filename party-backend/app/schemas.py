# app/schemas.py
from pydantic import BaseModel


class CreateRoomRequest(BaseModel):
    host_spotify_id: str
    like_threshold: int = 3


class JoinRoomRequest(BaseModel):
    spotify_id: str


class VoteRequest(BaseModel):
    spotify_id: str
    is_like: bool = True
