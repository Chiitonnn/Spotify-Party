# 🚀 Guide de démarrage complet - Spotify Party

Guide pour lancer le projet complet (backend + frontend) en 5 minutes.

## 📋 Prérequis

- Python 3.9+ installé
- Node.js 18+ installé
- Compte Spotify (gratuit ou premium)
- Un navigateur web

## 🎯 Configuration Spotify (IMPORTANT - À faire en premier)

### 1. Créer une application Spotify

1. Aller sur https://developer.spotify.com/dashboard
2. Se connecter avec ton compte Spotify
3. Cliquer sur **"Create app"**
4. Remplir le formulaire :
   - **App name** : `Spotify Party`
   - **App description** : `Application de party musicale`
   - **Website** : `http://localhost:3000`
   - **Redirect URI** : `http://localhost:8000/auth/callback` ⚠️ IMPORTANT
   - Cocher **"Web API"**
5. Accepter les conditions et créer
6. Dans les paramètres de l'app, noter :
   - ✅ **Client ID**
   - ✅ **Client Secret** (cliquer sur "Show client secret")

## 🔧 Installation

### Backend (Terminal 1)

```bash
# Aller dans le dossier backend
cd party-backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement
# Sur Windows :
venv\Scripts\activate
# Sur Mac/Linux :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
# Copier .env.example et le renommer en .env
# Puis éditer avec tes credentials Spotify

# Contenu du .env :
SPOTIFY_CLIENT_ID=ton_client_id_ici
SPOTIFY_CLIENT_SECRET=ton_client_secret_ici
SPOTIFY_REDIRECT_URI=http://localhost:8000/auth/callback

# Lancer le backend
uvicorn app.main:app --reload
```

✅ Le backend tourne maintenant sur **http://localhost:8000**

### Frontend (Terminal 2 - NOUVEAU TERMINAL)

```bash
# Aller dans le dossier frontend
cd party-frontend

# Installer les dépendances
npm install

# Lancer le frontend
npm run dev
```

✅ Le frontend tourne maintenant sur **http://localhost:3000**

## 🎮 Utilisation

### 1️⃣ Première connexion

1. Ouvrir **http://localhost:3000** dans ton navigateur
2. Cliquer sur **"Se connecter avec Spotify"**
3. Autoriser l'application (tu seras redirigé vers Spotify)
4. Tu reviens automatiquement sur l'app, connecté ! ✅

### 2️⃣ Créer ta première room

1. Sur la page d'accueil, cliquer sur **"Créer une Room"**
2. Choisir le seuil de likes (ex: 3 = il faut 3 likes pour jouer une musique)
3. Cliquer sur **"Créer la Room"**
4. Tu es maintenant dans ta room ! 
5. **Note le code** (ex: `ABC123`) pour le partager avec tes amis

### 3️⃣ Choisir une musique

En tant qu'hôte, tu as accès aux contrôles spéciaux :

1. Cliquer sur **"🎲 Choisir une musique aléatoire"**
2. Une musique aléatoire de tes playlists Spotify s'affiche
3. Les participants peuvent maintenant voter !

### 4️⃣ Voter

1. Regarder la musique proposée
2. Cliquer sur **👍 Like** ou **👎 Dislike**
3. La barre de progression se remplit
4. Quand le seuil est atteint → **"✅ Prêt à jouer !"**

### 5️⃣ Passer au tour suivant

Quand une musique a atteint son seuil :

1. L'hôte clique sur **"⏭️ Tour suivant"**
2. Les votes sont réinitialisés
3. Une nouvelle musique aléatoire est choisie
4. C'est reparti pour un tour !

### 6️⃣ Inviter des amis

**Pour rejoindre une room existante :**

1. Aller sur **http://localhost:3000**
2. Se connecter avec Spotify
3. Entrer le code de la room (donné par l'hôte)
4. Cliquer sur **"Rejoindre"**
5. C'est bon, tu es dans la room ! 🎉

## 🔍 Vérification que tout fonctionne

### Backend
- Ouvrir http://localhost:8000/docs
- Tu dois voir la documentation Swagger de l'API

### Frontend
- Ouvrir http://localhost:3000
- Tu dois voir la page d'accueil

### Base de données
Un fichier `spotify_party.db` doit apparaître dans le dossier `party-backend/`

## 🐛 Problèmes courants

### "Redirect URI mismatch"
➡️ Vérifier que dans Spotify Dashboard, tu as bien ajouté :
`http://localhost:8000/auth/callback`

### "Module not found" (Backend)
```bash
# Réactiver l'environnement virtuel
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Réinstaller
pip install -r requirements.txt
```

### "Cannot find module" (Frontend)
```bash
# Supprimer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Le backend ne démarre pas
- Vérifier que le fichier `.env` existe et contient les bonnes valeurs
- Vérifier que l'environnement virtuel est activé

### L'authentification échoue
- Vérifier les credentials Spotify dans `.env`
- Vérifier que le Redirect URI est correct dans Spotify Dashboard
- Essayer de vider le cache du navigateur

### Les votes ne se mettent pas à jour
- L'auto-refresh se fait toutes les 3 secondes
- Vérifier que le backend est bien lancé
- Vérifier la console du navigateur (F12) pour les erreurs

## 📊 Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │────────▶│   Frontend  │────────▶│   Backend   │
│ (localhost: │◀────────│  React App  │◀────────│  FastAPI    │
│    3000)    │         │             │         │ (port 8000) │
└─────────────┘         └─────────────┘         └─────────────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │  SQLite DB  │
                                                 └─────────────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │ Spotify API │
                                                 └─────────────┘
```

## 🎯 Prochaines étapes

Une fois que tout fonctionne :

1. **Tester avec plusieurs navigateurs** (simule plusieurs utilisateurs)
2. **Ajouter des amis** pour tester en conditions réelles
3. **Explorer les WebSockets** pour du temps réel
4. **Intégrer le Spotify Web Playback SDK** pour lancer vraiment les musiques

## 📚 Ressources

- **Backend API docs** : http://localhost:8000/docs
- **Frontend** : http://localhost:3000
- **Spotify API** : https://developer.spotify.com/documentation/web-api

---

**Besoin d'aide ?** Ouvre une issue sur GitHub ou contacte-moi !

**Bon développement ! 🎉🎵**