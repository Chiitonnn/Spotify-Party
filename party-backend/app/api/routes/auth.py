from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
import requests
import urllib.parse
import json

from app.core.config import settings
from app.services.spotify import get_current_user
from app.db.session import get_session
from app.models.user import SpotifyUser

from sqlmodel import Session, select

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.get("/login")
def login():
    client_id = settings.SPOTIFY_CLIENT_ID
    redirect_uri = settings.SPOTIFY_REDIRECT_URI

    # 🎵 SCOPES MODIFIÉS : Ajout de streaming pour le Web Playback SDK
    scopes = " ".join([
        "user-read-email",
        "user-read-private",
        "streaming",                    # ✅ Pour le Web Playback SDK
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing"   # ✅ Pour voir ce qui joue
    ])

    auth_url = (
        "https://accounts.spotify.com/authorize"
        f"?client_id={client_id}"
        "&response_type=code"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scopes}"
    )

    return RedirectResponse(auth_url)


@router.get("/callback")
def callback(
    request: Request,
    session: Session = Depends(get_session),
):
    code = request.query_params.get("code")
    if not code:
        return {"error": "Pas de code reçu depuis Spotify"}

    token_url = "https://accounts.spotify.com/api/token"

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
        "client_id": settings.SPOTIFY_CLIENT_ID,
        "client_secret": settings.SPOTIFY_CLIENT_SECRET,
    }

    response = requests.post(token_url, data=data)
    tokens = response.json()

    print("🎧 TOKENS SPOTIFY :", tokens)

    access_token = tokens.get("access_token")
    if not access_token:
        return {
            "error": "no_access_token",
            "raw": tokens,
        }

    # Profil Spotify
    user_profile = get_current_user(access_token)
    print("👤 PROFIL SPOTIFY :", user_profile)

    spotify_id = user_profile.get("id")
    if not spotify_id:
        return {"error": "no_spotify_id", "profile": user_profile}

    # Chercher si l'utilisateur existe déjà
    statement = select(SpotifyUser).where(SpotifyUser.spotify_id == spotify_id)
    existing_user = session.exec(statement).first()

    if existing_user:
        # Mise à jour
        existing_user.display_name = user_profile.get("display_name")
        existing_user.email = user_profile.get("email")
        existing_user.access_token = access_token
        existing_user.refresh_token = tokens.get("refresh_token")
        existing_user.token_type = tokens.get("token_type")
        existing_user.scope = tokens.get("scope")
        existing_user.expires_in = tokens.get("expires_in")
        user = existing_user
    else:
        # Création
        user = SpotifyUser(
            spotify_id=spotify_id,
            display_name=user_profile.get("display_name"),
            email=user_profile.get("email"),
            access_token=access_token,
            refresh_token=tokens.get("refresh_token"),
            token_type=tokens.get("token_type"),
            scope=tokens.get("scope"),
            expires_in=tokens.get("expires_in"),
        )
        session.add(user)

    session.commit()
    session.refresh(user)

    # Rediriger vers le frontend avec les infos user
    user_data = {
        "id": user.id,
        "spotify_id": user.spotify_id,
        "display_name": user.display_name,
        "email": user.email,
        "access_token": access_token,  # 🎵 IMPORTANT : On envoie le token au frontend
    }
    
    user_json = json.dumps(user_data)
    user_encoded = urllib.parse.quote(user_json)
    
    frontend_url = f"http://localhost:3000/callback?user={user_encoded}"
    return RedirectResponse(url=frontend_url)


@router.get("/me")
def get_me(
    spotify_id: str,
    session: Session = Depends(get_session),
):
    """
    Récupère les infos d'un utilisateur par son spotify_id
    """
    statement = select(SpotifyUser).where(SpotifyUser.spotify_id == spotify_id)
    user = session.exec(statement).first()
    
    if not user:
        return {"error": "User not found"}
    
    return {
        "id": user.id,
        "spotify_id": user.spotify_id,
        "display_name": user.display_name,
        "email": user.email,
        "access_token": user.access_token,  # 🎵 Pour le Web Playback SDK
    }