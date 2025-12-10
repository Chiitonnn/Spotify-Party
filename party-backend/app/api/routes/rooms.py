# app/api/routes/rooms.py
import random
import string
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func, delete

from app.db.session import get_session
from app.models.room import Room
from app.models.user import SpotifyUser
from app.models.room_participant import RoomParticipant

from app.models.room_participant import RoomParticipant
from app.models.vote import Vote

from app.services.spotify import pick_random_track_from_user
from app.models.vote import Vote  # si pas déjà importé

from app.schemas import CreateRoomRequest, JoinRoomRequest, VoteRequest


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


@router.post("/", response_model=Room)
def create_room(
    body: CreateRoomRequest,
    session: Session = Depends(get_session),
):
    """
    Crée une nouvelle room.

    Reçoit un JSON :
    {
      "host_spotify_id": "...",
      "like_threshold": 4
    }
    """

    # On cherche l'hôte dans spotify_users
    statement = select(SpotifyUser).where(SpotifyUser.spotify_id == body.host_spotify_id)
    host = session.exec(statement).first()

    if not host:
        raise HTTPException(status_code=404, detail="Hôte (SpotifyUser) introuvable")

    # Générer un code unique
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

    # Ajouter l'hôte comme participant
    participant = RoomParticipant(
        room_id=room.id,
        user_id=host.id,
    )
    session.add(participant)
    session.commit()

    return room



@router.get("/", response_model=List[Room])
def list_rooms(
    session: Session = Depends(get_session),
):
    rooms = session.exec(select(Room)).all()
    return rooms


@router.get("/{code}", response_model=Room)
def get_room_by_code(
    code: str,
    session: Session = Depends(get_session),
):
    statement = select(Room).where(Room.code == code)
    room = session.exec(statement).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    return room


@router.post("/{code}/join")
def join_room(
    code: str,
    body: JoinRoomRequest,
    session: Session = Depends(get_session),
):
    """
    Un utilisateur (via son spotify_id) rejoint une room.

    Body JSON :
    {
      "spotify_id": "..."
    }
    """

    # Room
    statement_room = select(Room).where(Room.code == code)
    room = session.exec(statement_room).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    # User
    statement_user = select(SpotifyUser).where(SpotifyUser.spotify_id == body.spotify_id)
    user = session.exec(statement_user).first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur Spotify introuvable")

    # Déjà participant ?
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
    """
    Liste les participants d'une room (pour debug / dev)
    """
    # Room
    statement_room = select(Room).where(Room.code == code)
    room = session.exec(statement_room).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    # Participants
    statement_participants = select(RoomParticipant).where(
        RoomParticipant.room_id == room.id
    )
    participants = session.exec(statement_participants).all()

    # On récupère aussi les infos SpotifyUser pour chaque user
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
                    "joined_at": p.joined_at,
                }
            )

    return {
        "room_code": room.code,
        "participants": users_data,
    }

from typing import Optional
from fastapi import Query
from sqlmodel import func


@router.post("/{code}/vote")
def vote_on_track(
    code: str,
    spotify_id: str = Query(...),
    is_like: bool = Query(True),
    session: Session = Depends(get_session),
):
    """
    Un utilisateur vote pour/contre la musique courante de la room.
    """

    # 1) Room
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    if not room.current_track_uri:
        raise HTTPException(status_code=400, detail="Aucune musique en cours pour cette room")

    # 2) User
    user_stmt = select(SpotifyUser).where(SpotifyUser.spotify_id == spotify_id)
    user = session.exec(user_stmt).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur Spotify introuvable")

    # 3) Vérifier qu'il fait bien partie de la room
    participant_stmt = select(RoomParticipant).where(
        RoomParticipant.room_id == room.id,
        RoomParticipant.user_id == user.id,
    )
    participant = session.exec(participant_stmt).first()
    if not participant:
        raise HTTPException(status_code=403, detail="Utilisateur non participant de la room")

    # 4) Enregistrer le vote pour la musique courante
    vote = Vote(
        room_id=room.id,
        user_id=user.id,
        track_uri=room.current_track_uri,
        is_like=is_like,
    )
    session.add(vote)
    session.commit()

    # 5) Compter les likes
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
    """
    Choisit un joueur aléatoire dans la room,
    puis une musique aléatoire dans ses playlists,
    et la stocke comme 'current track' de la room.
    """

    # 1) Room
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    # 2) Participants
    participants_stmt = select(RoomParticipant).where(
        RoomParticipant.room_id == room.id
    )
    participants = session.exec(participants_stmt).all()
    if not participants:
        raise HTTPException(status_code=400, detail="Aucun participant dans la room")

    # 3) Joueur aléatoire
    random_participant = random.choice(participants)

    user_stmt = select(SpotifyUser).where(SpotifyUser.id == random_participant.user_id)
    user = session.exec(user_stmt).first()
    if not user:
        raise HTTPException(status_code=500, detail="Participant lié à aucun SpotifyUser")

    access_token = user.access_token
    if not access_token:
        raise HTTPException(status_code=500, detail="Pas de token Spotify pour cet utilisateur")

    # 4) Musique aléatoire dans ses playlists
    track_info = pick_random_track_from_user(access_token)

    if "error" in track_info:
        return {
            "status": "error",
            "room_code": room.code,
            "user": {
                "id": user.id,
                "spotify_id": user.spotify_id,
                "display_name": user.display_name,
            },
            "error": track_info["error"],
        }

    # 5) Mettre à jour la room avec la musique courante
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
        "chosen_user": {
            "id": user.id,
            "spotify_id": user.spotify_id,
            "display_name": user.display_name,
        },
        "track": track_info,
    }

@router.get("/{code}/state")
def get_room_state(
    code: str,
    session: Session = Depends(get_session),
):
    """
    Renvoie l'état actuel de la room :
    - infos room
    - musique en cours (si existante)
    - nombre de likes actuels sur cette musique
    """
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
    """
    Renvoie la musique courante si elle a atteint le seuil de likes.
    Utilisé par l'hôte pour lancer la musique via Spotify Web API.
    """

    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    if not room.current_track_uri:
        return {"ready_to_play": False, "reason": "no_track_selected"}

    # Calculer le nombre de likes actuels
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
    """
    Passe à la musique suivante :
    - supprime les votes de la room
    - choisit un joueur aléatoire
    - choisit une musique aléatoire dans ses playlists
    - met à jour la room avec cette nouvelle musique
    """

    # 1) Récupérer la room
    room_stmt = select(Room).where(Room.code == code)
    room = session.exec(room_stmt).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room introuvable")

    # 2) Récupérer les participants
    participants_stmt = select(RoomParticipant).where(
        RoomParticipant.room_id == room.id
    )
    participants = session.exec(participants_stmt).all()
    if not participants:
        raise HTTPException(status_code=400, detail="Aucun participant dans la room")

    # 3) Supprimer tous les votes de cette room (nouvelle manche, on repart à zéro)
    delete_stmt = delete(Vote).where(Vote.room_id == room.id)
    session.exec(delete_stmt)
    session.commit()

    # 4) Choisir un participant aléatoire
    random_participant = random.choice(participants)

    user_stmt = select(SpotifyUser).where(SpotifyUser.id == random_participant.user_id)
    user = session.exec(user_stmt).first()
    if not user:
        raise HTTPException(status_code=500, detail="Participant lié à aucun SpotifyUser")

    if not user.access_token:
        raise HTTPException(status_code=500, detail="Pas de token Spotify pour cet utilisateur")

    # 5) Choisir une musique aléatoire dans ses playlists
    track_info = pick_random_track_from_user(user.access_token)

    if "error" in track_info:
        return {
            "status": "error",
            "room_code": room.code,
            "user": {
                "id": user.id,
                "spotify_id": user.spotify_id,
                "display_name": user.display_name,
            },
            "error": track_info["error"],
        }

    # 6) Mettre à jour la room avec la nouvelle musique courante
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
        "chosen_user": {
            "id": user.id,
            "spotify_id": user.spotify_id,
            "display_name": user.display_name,
        },
        "track": track_info,
    }
