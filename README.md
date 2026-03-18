# 🎉 Spotify Party — The Ultimate Shared Jukebox

**Spotify Party** est une application full-stack novatrice permettant à un groupe d'amis de collaborer en temps réel sur une file d'attente musicale Spotify lors d'une soirée. Fini les téléphones qui passent de main en main ou les disputes autour de l'enceinte : tout le monde participe au mix et vote depuis son propre écran !

---

## ✨ Fonctionnalités Principales

- 🎵 **File d'Attente Interactive & Collaborative** : Cherchez vos morceaux préférés dans tout le catalogue Spotify et proposez-les à la soirée. Le système de votes démocratique décide de ce qui passera !
- ⚡ **100% Temps Réel (WebSockets)** : Chaque ajout, vote, ou nouvelle connexion d'un invité est instantanément synchronisé sur l'écran de tous les participants à la milliseconde près, sans aucun rechargement ou polling lourd.
- 🔒 **Authentification Robuste & Sécurisée** : Connexion OAuth avec Spotify gérée via une architecture orientée service très propre. De plus, les WebSockets sont protégés par un **Middleware de vérification de Token JWT**.
- 🐳 **Prêt pour le Déploiement (Docker)** : Le backend et la base de données sont entièrement conteneurisés pour un lancement instantané sur n'importe quel ordinateur ou serveur cloud.
- 📱 **Expérience Mobile-First** : Une application React Native (Expo) fluide pour les invités, accompagnée d'un frontend web d'administration pour l'hôte !

---

## 🏗️ Architecture et Technologies

Ce projet a été conçu avec une approche moderne, modulaire, et séparant clairement les responsabilités :

1. **Backend (API Node.js / Express)**
   - Base de données : **MongoDB** (stockage durable des utilisateurs, sessions et votes).
   - Temps Réel : **Socket.io** pour la diffusion en direct.
   - Architecture : Séparation professionnelle des *Controllers* et des *Services* (ex: `auth.service.js`).
2. **Application Mobile (React Native / Expo)**
   - Interface réactive conçue pour faciliter l'ajout de titres rapidement pendant une fête.
   - Gestion persistante des tokens et appels API sécurisés via des intercepteurs `axios`.
3. **Frontend Web (React / Vite)**
   - Interface pour l'affichage plein écran pendant l'évènement (*Actuellement en cours de refonte totale par l'équipe UI/UX !*).

---

## 🚀 Guide de Démarrage Rapide

### 1. Préparation de l'environnement
Assurez-vous d'avoir Node.js (v18+) et Docker Desktop installés sur votre machine d'hôte.

```bash
git clone <votre-repo>
cd Spotify-Party
npm install
```

### 2. Configuration (`.env`)
Créez (ou modifiez) le fichier `.env` dans le dossier `backend` et remplissez-le avec vos identifiants fournis par le Spotify Developer Dashboard :

```env
MONGODB_URI=mongodb://mongodb:27017/spotify_party
SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret
SPOTIFY_REDIRECT_URI=https://ripply-unconcentrated-lindy.ngrok-free.dev/api/auth/callback
BACKEND_URL=https://ripply-unconcentrated-lindy.ngrok-free.dev
JWT_SECRET=super_secret_jwt_key
```

> ⚠️ **Important :** L'URL Ngrok (le `ripply-unconcentrated-...`) doit impérativement correspondre à celle déclarée comme "Redirect URI" dans vos paramètres d'application sur Spotify !

### 3. Lancer le Serveur Backend (via Docker 🐳)
L'infrastructure backend monte en une seule commande avec Docker Compose, ce qui inclut l'API et la base de données :

```bash
docker compose up -d --build
```
- L'API tourne désormais sur le pont local `3000`.
- Bonus : Une petite interface graphqiue pour regarder la base de données (Mongo Express) tourne sur `http://localhost:8081`.

### 4. Lancer le Tunnel Sécurisé (Indispensable pour Spotify)
Dans un nouveau terminal, restez à la racine du projet et tapez :
```bash
npm run tunnel
```
*(Cela active le pont internet vers votre serveur local, obligatoire pour que Spotify puisse communiquer avec vous lors du login).*

### 5. Démarrer l'Application Mobile
Dans un troisième terminal :
```bash
cd mobile
npx expo start --tunnel
```
Scannez le QR code affiché avec l'application Expo Go sur les téléphones de vos invités, et que la fête commence ! 🎉

---

## 💡 Perspectives d'Évolution (Roadmap)
Parmi les prochaines grandes étapes de R&D identifiées pour amener le projet plus loin :
1. **Base de données In-Memory (Redis)** : Pour supporter des soirées de très grande ampleur (type festivals) avec des milliers de clics et votes simultanés sans saturer MongoDB.
2. **Modération Avancée** : Offrir aux hôtes le pouvoir absolu de bannir des participants frauduleux (trolls) ou de verrouiller la salle par QR Code rotatif.
3. **Lecteur Synchronisé en Direct** : Pousser en temps réel à tous les téléphones la pochette et la progression exacte de la musique qui passe actuellement sur les enceintes de l'hôte.

---