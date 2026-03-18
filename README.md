# 🎵 Spotify Party — Shared Queue

Une application permettant à plusieurs personnes d'ajouter des musiques dans une file d'attente Spotify commune en temps réel.

## 🚀 Lancement Rapide

Pour lancer tout le projet (Backend + Frontend + Tunnels) :

```bash
# À la racine du projet
npm install
npm run dev
```

Pour lancer l'application mobile :

```bash
cd mobile
npx expo start --tunnel
```

---

## 🐳 Déploiement avec Docker

Pour simplifier le déploiement de l'API (Backend) et de la base de données, vous pouvez utiliser Docker :

```bash
# À la racine du projet
docker compose up -d --build
```

Cela démarrera :
- L'API Node.js sur le port `3000`
- Une base de données MongoDB locale sur le port `27017`

> **Note :** Les variables d'environnement (`.env`) du dossier `backend` seront automatiquement utilisées. La variable `MONGODB_URI` sera écrasée pour utiliser le conteneur MongoDB local fourni par Docker (`mongodb://mongodb:27017/spotify_party`).

---

## 🏗️ Architecture

Le projet est divisé en trois parties :

1.  **Backend** (`/backend`) : Serveur Node.js/Express gérant l'authentification Spotify, les sessions et les WebSockets.
2.  **Frontend Web** (`/frontend`) : Interface d'administration pour le Host (contrôle la lecture).
3.  **App Mobile** (`/mobile`) : Application React Native (Expo) permettant aux invités de rejoindre une session et d'ajouter des musiques.

---

## 🔐 Configuration Spotify (Crucial)

Pour que l'authentification fonctionne, vous devez configurer votre application sur le [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) :

1.  **Redirect URI** : Ajoutez exactement cette URL (et aucune autre) :
    `https://ripply-unconcentrated-lindy.ngrok-free.dev/api/auth/callback`
2.  **Client ID & Secret** : Assurez-vous qu'ils correspondent à ceux dans votre fichier `backend/.env`.

---

## 🛠️ Installation & Pré-requis

### Pré-requis
- Node.js (v18+)
- Compte Spotify Premium (nécessaire pour le Host)
- Un compte Ngrok (pour exposer votre serveur local)

### Variables d'environnement
Créez un fichier `.env` dans le dossier `backend` :

```env
MONGODB_URI=votre_uri_mongodb
SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret
SPOTIFY_REDIRECT_URI=https://ripply-unconcentrated-lindy.ngrok-free.dev/api/auth/callback
BACKEND_URL=https://ripply-unconcentrated-lindy.ngrok-free.dev
JWT_SECRET=votre_secret_jwt
```

---

## 📱 Fonctionnalités

- **Authentification Robuste** : Système de proxy pour gérer les changements de tunnels Expo sans modifier le Dashboard Spotify.
- **File d'attente partagée** : Ajout de titres instantané.
- **Synchronisation en Direct** : Utilisation de WebSockets (Socket.io) pour mettre à jour la file d'attente sur tous les appareils.
- **Mode Host** : Lecture automatique sur le compte Spotify du créateur de la session.

---

## 💻 Développement

Les scripts utiles :
- `npm run dev` : Lance tout le projet.
- `npm run tunnel` : Lance uniquement le tunnel Ngrok sur le port 3000.
- `npm run dev:backend` : Lance uniquement le serveur avec nodemon.
- `npm run dev:frontend` : Lance uniquement le frontend Vite.