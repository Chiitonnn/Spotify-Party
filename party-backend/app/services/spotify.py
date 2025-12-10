# app/services/spotify.py
import requests
import random

def get_current_user(access_token: str) -> dict:
    """
    Appelle l'endpoint /me de Spotify pour récupérer le profil de l'utilisateur
    """
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get("https://api.spotify.com/v1/me", headers=headers)

    if response.status_code != 200:
        # 🔥 CORRECTION : Gérer les réponses vides
        try:
            error_data = response.json()
        except:
            error_data = {"message": "Empty response from Spotify"}
        
        return {
            "error": "spotify_api_error",
            "status_code": response.status_code,
            "details": error_data,
        }

    return response.json()


def get_user_playlists(access_token: str, limit: int = 20) -> dict:
    """
    Récupère les playlists de l'utilisateur connecté.
    """
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    params = {
        "limit": limit
    }

    response = requests.get(
        "https://api.spotify.com/v1/me/playlists",
        headers=headers,
        params=params
    )

    return response.json()


def get_playlist_tracks(access_token: str, playlist_id: str, limit: int = 100) -> dict:
    """
    Récupère les morceaux d'une playlist.
    """
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    params = {
        "limit": limit
    }

    response = requests.get(
        f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
        headers=headers,
        params=params
    )

    return response.json()


def pick_random_track_from_user(access_token: str) -> dict:
    """
    Choisit une musique aléatoire dans les playlists de l'utilisateur.
    """
    playlists_data = get_user_playlists(access_token)

    items = playlists_data.get("items", [])
    if not items:
        return {"error": "no_playlists"}

    # Playlist aléatoire
    playlist = random.choice(items)
    playlist_id = playlist["id"]

    tracks_data = get_playlist_tracks(access_token, playlist_id)
    tracks_items = tracks_data.get("items", [])

    if not tracks_items:
        return {"error": "no_tracks_in_playlist"}

    track_item = random.choice(tracks_items)

    track = track_item.get("track")
    if not track:
        return {"error": "invalid_track_data"}

    # Extraire les infos
    artists = ", ".join(a["name"] for a in track.get("artists", []))

    images = track.get("album", {}).get("images", [])
    image_url = images[0]["url"] if images else None

    return {
        "track_id": track.get("id"),
        "track_uri": track.get("uri"),
        "name": track.get("name"),
        "artists": artists,
        "album": track.get("album", {}).get("name"),
        "image_url": image_url,
        "playlist": {
            "id": playlist_id,
            "name": playlist.get("name"),
        },
    }