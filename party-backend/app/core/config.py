import os
from dotenv import load_dotenv

# Charge le .env à la racine du projet
load_dotenv()

class Settings:
    def __init__(self) -> None:
        self.SPOTIFY_CLIENT_ID: str | None = os.getenv("SPOTIFY_CLIENT_ID")
        self.SPOTIFY_CLIENT_SECRET: str | None = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.SPOTIFY_REDIRECT_URI: str | None = os.getenv("SPOTIFY_REDIRECT_URI")

        if not self.SPOTIFY_CLIENT_ID or not self.SPOTIFY_CLIENT_SECRET:
            print("⚠️  SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET manquant dans .env")

settings = Settings()
