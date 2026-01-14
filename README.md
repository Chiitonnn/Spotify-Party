<<<<<<< HEAD
# Spotify-Party

Installer flutter


    cd .\backend\

    python -m venv venv

    .\venv\Scripts\activate

    pip install -r requirements.txt

    cd ..

    cd .\mobile_app\

    flutter build web  

    cd ..

    cd .\backend\

    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Pour tester le projet sur vos PC c'est : cd mobile_app
                                        >> flutter run -d chrome

et pour les push sur git et dcp sur render c'est : cd mobile_app
                                                    >> flutter build web --no-wasm-dry-run
                                                    >> cd ..
                                                    >> Copy-Item -Recurse -Force mobile_app\build\web\* frontend\
                                                    >> git add .
                                                    >> git commit -m "fix bouton"
                                                    >> git push
=======
# 🎵 Spotify Party – Backend (FastAPI)

Backend permettant de gérer une soirée musicale interactive où chaque joueur se connecte avec son compte Spotify, vote pour des musiques, et permet à l’hôte de lancer un morceau lorsque suffisamment de “likes” sont atteints.

---

## 🚀 Tech Stack

- **FastAPI**
- **Python 3.11+**
- **SQLModel** (ORM SQLite)
- **Uvicorn**
- **Spotify Web API (OAuth)**

---

## 📁 Structure du projet

party-backend/

│── app/

│ ├── main.py

│ ├── core/

│ │ └── config.py

│ ├── api/

│ │ └── routes/

│ │ ├── auth.py

│ │ └── rooms.py

│ ├── db/

│ │ └── session.py

│ ├── models/

│ │ ├── user.py

│ │ ├── room.py

│ │ ├── room_participant.py

│ │ └── vote.py

│ └── services/

│ └── spotify.py

│

├── .env

├── requirements.txt

└── venv/


---

## ⚙️ Installation & Setup

### 1️⃣ Installer l’environnement

```bash
cd party-backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

Si requirements.txt n’existe pas encore :

pip freeze > requirements.txt

2️⃣ Configuration Spotify OAuth

    Aller sur : https://developer.spotify.com/dashboard

    Créer une application

    Ajouter cette redirect URI :

http://127.0.0.1:8000/auth/callback

    Récupérer :

        CLIENT_ID

        CLIENT_SECRET

3️⃣ Créer le fichier .env

SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/auth/callback

🧩 Fonctionnalités déjà implémentées
1️⃣ Authentification Spotify (OAuth)
GET /auth/login

Redirige vers Spotify pour demander :

    accès au profil utilisateur

    accès à la bibliothèque musicale

GET /auth/callback

Appelé automatiquement par Spotify :

    échange du code → access_token

    récupération du profil /me

    sauvegarde du user en base (table spotify_users)

⚠️ Ne jamais appeler ce endpoint manuellement depuis Swagger.
2️⃣ Base de données

SQLite + SQLModel
Tables créées automatiquement au démarrage :

    spotify_users

    rooms

    room_participants

    votes

3️⃣ Rooms (parties)
POST /rooms

Crée une nouvelle room :

Params :

    host_spotify_id

    like_threshold

La room contient :

    un code unique (ex: DSCG8B)

    un hôte

    un seuil de likes

    des participants

L’hôte est ajouté automatiquement à la room.
4️⃣ Participants
POST /rooms/{code}/join?spotify_id=...

Ajoute un utilisateur dans la room (s’il est connu dans spotify_users).
GET /rooms/{code}/participants

Liste les participants :

    nom Spotify

    email

    date d’entrée

5️⃣ Votes
POST /rooms/{code}/vote?spotify_id=&track_uri=&is_like=

Système complet de votes :

    enregistre un vote

    compte les “likes” pour la musique

    compare avec le like_threshold

Exemple de réponse :

{
  "status": "vote_registered",
  "likes": 3,
  "like_threshold": 4,
  "play": false
}

Quand :

likes >= like_threshold

→ play = true
→ l’hôte peut lancer la musique sur Spotify.
🧪 Tester l’API

Documentation interactive :

👉 http://127.0.0.1:8000/docs

Flow OAuth correct :

    Aller sur GET /auth/login

    Se connecter (ou accepter l'application)

    Spotify renvoie automatiquement vers /auth/callback

    Le backend affiche une réponse JSON avec le profil + tokens

⚠️ Ne pas appeler /auth/callback manuellement depuis Swagger.
▶️ Lancer le serveur

uvicorn app.main:app --reload

🔥 Ce qui est prêt

✔ Auth Spotify
✔ Stockage des utilisateurs
✔ Rooms fonctionnelles
✔ Join room
✔ Votes + seuil
✔ API propre & découpée
✔ Base de données fonctionnelle
📌 Prochaines étapes possibles

    Rafraîchissement auto des tokens Spotify

    Sélection aléatoire d’un morceau dans la playlist d’un joueur

    WebSockets (votes / mise à jour en temps réel)

    Intégration mobile (React Native / Flutter)

    Lancement réel des musiques via Spotify Web Playback SDK

✨ Auteur

Projet scolaire Ynov – B2 Informatique
Backend réalisé en Python + FastAPI
>>>>>>> gabriel
