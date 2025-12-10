from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.db.session import engine
from app.api.routes.auth import router as auth_router
from app.api.routes.rooms import router as rooms_router


app = FastAPI(
    title="Spotify Party Backend",
    version="0.1.0",
)

# 🔥 CORS Configuration - IMPORTANT
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(bind=engine)
    print("✅ Base de données initialisée")
    print("📍 Routes enregistrées:")
    for route in app.routes:
        if hasattr(route, 'methods'):
            print(f"  {list(route.methods)[0]} {route.path}")


@app.get("/")
def root():
    return {"message": "Backend Party - ça tourne 🎉"}


# 🔥 IMPORTANT : Bien inclure les routers
app.include_router(auth_router)
app.include_router(rooms_router)

# Debug : afficher toutes les routes au démarrage
print("\n📋 Liste des routes disponibles:")
for route in app.routes:
    print(f"  {route}")