# app/services/playback.py
import requests

def play_track_on_device(access_token: str, device_id: str, track_uri: str) -> dict:
    """
    Lance la lecture d'une musique sur un appareil Spotify spécifique.
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "uris": [track_uri],
        "position_ms": 0
    }
    
    response = requests.put(
        f"https://api.spotify.com/v1/me/player/play?device_id={device_id}",
        headers=headers,
        json=data
    )
    
    if response.status_code == 204:
        return {"status": "playing", "track_uri": track_uri}
    else:
        return {
            "error": "playback_failed",
            "status_code": response.status_code,
            "details": response.text
        }


def pause_playback(access_token: str, device_id: str) -> dict:
    """
    Met en pause la lecture sur un appareil.
    """
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.put(
        f"https://api.spotify.com/v1/me/player/pause?device_id={device_id}",
        headers=headers
    )
    
    if response.status_code == 204:
        return {"status": "paused"}
    else:
        return {"error": "pause_failed", "status_code": response.status_code}


def resume_playback(access_token: str, device_id: str) -> dict:
    """
    Reprend la lecture sur un appareil.
    """
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.put(
        f"https://api.spotify.com/v1/me/player/play?device_id={device_id}",
        headers=headers
    )
    
    if response.status_code == 204:
        return {"status": "playing"}
    else:
        return {"error": "resume_failed", "status_code": response.status_code}