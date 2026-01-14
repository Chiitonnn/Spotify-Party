# app/db/session.py
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./spotify_party.db"

engine = create_engine(
    DATABASE_URL, echo=False  # mets True si tu veux voir les requêtes SQL
)

def get_session():
    with Session(engine) as session:
        yield session
