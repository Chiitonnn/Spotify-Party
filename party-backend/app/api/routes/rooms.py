# app/api/routes/rooms.py
import random
import string
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, delete

from app.db.session import get_session
from app.models.room import Room
from app.models.user import SpotifyUser
from app.models.room_participant import RoomParticipant
from app.models.vote import Vote
from app.services.spotify import pick_random_track_from_user
from app.services.playback import play_track_on_device, pause_playback, resume_playback
from app.schemas import CreateRoomRequest, JoinRoomRequest


router = APIRouter(
    prefix="/rooms",
    tags=["rooms"],
)


def generate_room_code(length: int = 6) -> str:
    """
    Génère un code de room simple, ex: 'A3F9ZQ'
    """
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choice(chars) for _ in range(length))


@router.post("/")
def create_room(
    body: CreateRoomRequest,
    session: Session = Depends(get_session),
):
    """
    Crée une nouvelle room.
    """
    print(f"🎉 Création room pour : {body.host_spotify_id}")
    
    statement = select(SpotifyUser).where(SpotifyUser.spotify_id == body.host_spotify_id)
    host = session.exec(statement).first()

    if not host:
        print(f"❌ Hôte introuvable : {body.host_spotify_id}")
        raise HTTPException(status_code=404, detail="Hôte (SpotifyUser) introuvable")

    code = generate_room_code()
    while session.exec(select(Room).where(Room.code == code)).first():
        code = generate_room_code()

    room = Room(
        code=code,
        host_user_id=host.id,
        like_threshold=body.like_threshold,
        is_active=True,
    )

    session.add(room)
    session.commit()
    session.refresh(room)
    
    print(f"✅ Room créée : {room.code}")

    participant = RoomParticipant(
        room_id=room.id,
        user_id=host.id,
    )
    session.add(participant)
    session.commit()

    return {
        "id": room.id,
        "code": room.code,
        "host_user_id": room.host_user_id,
        "like_threshold": room.like_threshold,
        "is_active": room.is_active,
        "created_at": room.created_at.isoformat() if room.created_at else None,
        "current_track_uri": room.current_track_uri,
        "current_track_name": room.current_track_name,
        "current_track_artists": room.current_track_artists,
        "current_track_image_url": room.current_track_image_url,
    }


@router.get("/")
def list_rooms(
    session: Session = Depends(get_session),
):
    rooms = session.exec(select(Room)).all()
    return rooms


@router.get("/{code}")
def get_room_by_code(
    code: str,
    session: Session = Depends(get_session),
):
    statement = select(Room).where(Room.code == code)
    room = session.exec(statement).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    return {
        "id": room.id,
        "code": room.code,
        "host_user_id": room.host_user_id,
        "like_threshold": room.like_threshold,
        "is_active": room.is_active,
        "created_at": room.created_at.isoformat() if room.created_at else None,
    }


@router.post("/{code}/join")
def join_room(
    code: str,
    body: JoinRoomRequest,
    session: Session = Depends(get_session),
):
    statement_room = select(Room).where(Room.code == code)
    room = session.exec(statement_room).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    statement_user = select(SpotifyUser).where(SpotifyUser.spotify_id == body.spotify_id)
    user = session.exec(statement_user).first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur Spotify introuvable")

    statement_participant = select(RoomParticipant).where(
        RoomParticipant.room_id == room.id,
        RoomParticipant.user_id == user.id,
    )
    existing = session.exec(statement_participant).first()

    if existing:
        return {
            "status": "already_in_room",
            "room_code": room.code,
            "user_id": user.id,
        }

    participant = RoomParticipant(
        room_id=room.id,
        user_id=user.id,
    )
    session.add(participant)
    session.commit()
    session.refresh(participant)

    return {
        "status": "joined",
        "room_code": room.code,
        "user_id": user.id,
    }


@router.get("/{code}/participants")
def list_participants(
    code: str,
    session: Session = Depends(get_session),
):
    statement_room = select(Room).where(Room.code == code)
    room = session.exec(statement_room).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    statement_participants = select(RoomParticipant).where(
        RoomParticipant.room_id == room.id
    )
    participants = session.exec(statement_participants).all()

    users_data = []
    for p in participants:
        user_stmt = select(SpotifyUser).where(SpotifyUser.id == p.user_id)
        u = session.exec(user_stmt).first()
        if u:
            users_data.append(
                {
                    "user_id": u.id,
                    "spotify_id": u.spotify_id,
                    "display_name": u.display_name,
                    "email": u.email,
                    "joined_at": p.joined_at.isoformat() if p.joined_at else None,
                }
            )

    return {
        "room_code": room.code,
        "participants": users_data,
    }


@router.post("/{code}/vote")
def vote_on_track(
    code: str,
    spotify_id: str = Query(...),
    is_like: bool = Query(True),
    session: Session = Depends(get_session),
):
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    if not room.current_track_uri:
        raise HTTPException(status_code=400, detail="Aucune musique en cours")

    user_stmt = select(SpotifyUser).where(SpotifyUser.spotify_id == spotify_id)
    user = session.exec(user_stmt).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    participant_stmt = select(RoomParticipant).where(
        RoomParticipant.room_id == room.id,
        RoomParticipant.user_id == user.id,
    )
    participant = session.exec(participant_stmt).first()
    if not participant:
        raise HTTPException(status_code=403, detail="Non participant")

    vote = Vote(
        room_id=room.id,
        user_id=user.id,
        track_uri=room.current_track_uri,
        is_like=is_like,
    )
    session.add(vote)
    session.commit()

    likes_stmt = (
        select(func.count(Vote.id))
        .where(
            Vote.room_id == room.id,
            Vote.track_uri == room.current_track_uri,
            Vote.is_like == True,
        )
    )
    likes_count = session.exec(likes_stmt).one()

    should_play = likes_count >= room.like_threshold

    return {
        "status": "vote_registered",
        "room_code": room.code,
        "track_uri": room.current_track_uri,
        "track_name": room.current_track_name,
        "likes": likes_count,
        "like_threshold": room.like_threshold,
        "play": should_play,
    }


@router.get("/{code}/random-track")
def get_random_track_for_room(
    code: str,
    session: Session = Depends(get_session),
):
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    participants_stmt = select(RoomParticipant).where(
        RoomParticipant.room_id == room.id
    )
    participants = session.exec(participants_stmt).all()
    if not participants:
        raise HTTPException(status_code=400, detail="Aucun participant")

    random_participant = random.choice(participants)

    user_stmt = select(SpotifyUser).where(SpotifyUser.id == random_participant.user_id)
    user = session.exec(user_stmt).first()
    if not user:
        raise HTTPException(status_code=500, detail="Participant sans SpotifyUser")

    if not user.access_token:
        raise HTTPException(status_code=500, detail="Pas de token Spotify")

    track_info = pick_random_track_from_user(user.access_token)

    if "error" in track_info:
        return {
            "status": "error",
            "room_code": room.code,
            "error": track_info["error"],
        }

    room.current_track_uri = track_info["track_uri"]
    room.current_track_name = track_info["name"]
    room.current_track_artists = track_info["artists"]
    room.current_track_image_url = track_info["image_url"]

    session.add(room)
    session.commit()
    session.refresh(room)

    return {
        "status": "ok",
        "room_code": room.code,
        "track": track_info,
    }


@router.get("/{code}/state")
def get_room_state(
    code: str,
    session: Session = Depends(get_session),
):
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    likes_count = 0
    if room.current_track_uri:
        likes_stmt = (
            select(func.count(Vote.id))
            .where(
                Vote.room_id == room.id,
                Vote.track_uri == room.current_track_uri,
                Vote.is_like == True,
            )
        )
        likes_count = session.exec(likes_stmt).one()

    return {
        "room": {
            "code": room.code,
            "like_threshold": room.like_threshold,
            "is_active": room.is_active,
        },
        "current_track": {
            "uri": room.current_track_uri,
            "name": room.current_track_name,
            "artists": room.current_track_artists,
            "image_url": room.current_track_image_url,
        },
        "likes": likes_count,
    }


@router.get("/{code}/next-track")
def get_next_track(
    code: str,
    session: Session = Depends(get_session),
):
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    if not room.current_track_uri:
        return {"ready_to_play": False, "reason": "no_track_selected"}

    likes_stmt = (
        select(func.count(Vote.id))
        .where(
            Vote.room_id == room.id,
            Vote.track_uri == room.current_track_uri,
            Vote.is_like == True,
        )
    )
    likes_count = session.exec(likes_stmt).one()

    ready = likes_count >= room.like_threshold

    return {
        "ready_to_play": ready,
        "track_uri": room.current_track_uri,
        "name": room.current_track_name,
        "artists": room.current_track_artists,
        "image_url": room.current_track_image_url,
        "likes": likes_count,
        "threshold": room.like_threshold
    }


@router.post("/{code}/next-round")
def next_round(
    code: str,
    session: Session = Depends(get_session),
):
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    participants_stmt = select(RoomParticipant).where(
        RoomParticipant.room_id == room.id
    )
    participants = session.exec(participants_stmt).all()
    if not participants:
        raise HTTPException(status_code=400, detail="Aucun participant")

    delete_stmt = delete(Vote).where(Vote.room_id == room.id)
    session.exec(delete_stmt)
    session.commit()

    random_participant = random.choice(participants)

    user_stmt = select(SpotifyUser).where(SpotifyUser.id == random_participant.user_id)
    user = session.exec(user_stmt).first()
    if not user:
        raise HTTPException(status_code=500, detail="Participant sans SpotifyUser")

    if not user.access_token:
        raise HTTPException(status_code=500, detail="Pas de token Spotify")

    track_info = pick_random_track_from_user(user.access_token)

    if "error" in track_info:
        return {
            "status": "error",
            "room_code": room.code,
            "error": track_info["error"],
        }

    room.current_track_uri = track_info["track_uri"]
    room.current_track_name = track_info["name"]
    room.current_track_artists = track_info["artists"]
    room.current_track_image_url = track_info["image_url"]

    session.add(room)
    session.commit()
    session.refresh(room)

    return {
        "status": "next_round_started",
        "room_code": room.code,
        "track": track_info,
    }


# 🎵 NOUVELLES ROUTES PLAYBACK

@router.post("/{code}/play")
def play_track(
    code: str,
    device_id: str = Query(..., description="Spotify Web Playback SDK device ID"),
    session: Session = Depends(get_session),
):
    """
    Lance la lecture de la musique courante sur le Web Player.
    """
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")
    
    if not room.current_track_uri:
        raise HTTPException(status_code=400, detail="Aucune musique sélectionnée")
    
    host_stmt = select(SpotifyUser).where(SpotifyUser.id == room.host_user_id)
    host = session.exec(host_stmt).first()
    if not host:
        raise HTTPException(status_code=404, detail="Hôte introuvable")
    
    if not host.access_token:
        raise HTTPException(status_code=401, detail="Token Spotify manquant")
    
    result = play_track_on_device(host.access_token, device_id, room.current_track_uri)
    
    if "error" in result:
        return {
            "status": "error",
            "error": result["error"],
            "details": result.get("details", "")
        }
    
    return {
        "status": "playing",
        "track_uri": room.current_track_uri,
        "track_name": room.current_track_name,
    }


@router.post("/{code}/pause")
def pause_track(
    code: str,
    device_id: str = Query(...),
    session: Session = Depends(get_session),
):
    """
    Met en pause la lecture.
    """
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")
    
    host_stmt = select(SpotifyUser).where(SpotifyUser.id == room.host_user_id)
    host = session.exec(host_stmt).first()
    if not host:
        raise HTTPException(status_code=404, detail="Hôte introuvable")
    
    result = pause_playback(host.access_token, device_id)
    return result


@router.post("/{code}/resume")
def resume_track(
    code: str,
    device_id: str = Query(...),
    session: Session = Depends(get_session),
):
    """
    Reprend la lecture.
    """
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")
    
    host_stmt = select(SpotifyUser).where(SpotifyUser.id == room.host_user_id)
    host = session.exec(host_stmt).first()
    if not host:
        raise HTTPException(status_code=404, detail="Hôte introuvable")
    
    result = resume_playback(host.access_token, device_id)
    return result