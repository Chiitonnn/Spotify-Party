# 🎵 Spotify Party - Frontend

Interface React pour l'application Spotify Party.

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Backend lancé sur `http://localhost:8000`

### Installation
```bash
# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

## 📱 Fonctionnalités

### ✅ Implémenté
- 🔐 **Connexion Spotify OAuth**
- 🏠 **Création de room** avec seuil personnalisable
- 🚪 **Rejoindre une room** avec code
- 🎵 **Affichage de la musique en cours**
- 👍👎 **Système de vote** (like/dislike)
- 👥 **Liste des participants** avec badge hôte
- 🎲 **Sélection aléatoire** de musique (hôte uniquement)
- ⏭️ **Passage au tour suivant** (hôte uniquement)
- 🔄 **Auto-refresh** de l'état de la room (toutes les 3 secondes)
- 📊 **Barre de progression** des votes
- ✨ **UI moderne** avec gradients

### 🎨 Design
- Interface épurée et moderne
- Animations fluides
- Responsive (mobile & desktop)
- Thème violet/rose inspiré de Spotify

## 🏗️ Structure

```
src/
├── components/
│   ├── Header.jsx           # En-tête avec info user
│   ├── TrackCard.jsx        # Affichage musique + votes
│   └── VoteButtons.jsx      # Boutons like/dislike
│
├── pages/
│   ├── Home.jsx             # Page d'accueil
│   ├── CreateRoom.jsx       # Création de room
│   ├── Room.jsx             # Room principale
│   └── Callback.jsx         # Retour OAuth
│
├── services/
│   └── api.js               # Appels API backend
│
├── hooks/
│   └── useUser.js           # Hook gestion user
│
├── App.jsx                  # App principale + routing
├── main.jsx                 # Point d'entrée
└── index.css                # Styles globaux
```

## 🎮 Utilisation

### 1. Connexion
1. Cliquer sur "Se connecter avec Spotify"
2. Autoriser l'application
3. Vous êtes redirigé vers l'accueil

### 2. Créer une room
1. Cliquer sur "Créer une Room"
2. Choisir le seuil de likes (nombre de likes pour jouer une musique)
3. Vous êtes redirigé vers votre room
4. Partagez le code avec vos amis !

### 3. Rejoindre une room
1. Entrer le code à 6 caractères
2. Cliquer sur "Rejoindre"
3. Vous entrez dans la room

### 4. Dans la room

**Pour tous les participants :**
- Voir la musique en cours
- Voter 👍 (like) ou 👎 (dislike)
- Voir la progression des votes
- Voir les autres participants

**Pour l'hôte uniquement :**
- 🎲 Choisir une musique aléatoire
- ⏭️ Passer au tour suivant (reset des votes + nouvelle musique)

### 5. Système de votes
- Chaque participant peut voter une fois par musique
- Quand le seuil est atteint → "✅ Prêt à jouer !"
- L'hôte peut alors lancer la musique sur Spotify (fonctionnalité à venir)
- L'hôte peut passer au tour suivant pour proposer une nouvelle musique

## 🔧 Configuration

### Proxy API
Le fichier `vite.config.js` configure un proxy vers le backend :
```javascript
proxy: {
  '/auth': 'http://localhost:8000',
  '/rooms': 'http://localhost:8000'
}
```

### Variables d'environnement
Pour le moment, l'URL de l'API est hardcodée dans `src/services/api.js`.
Pour la production, créer un fichier `.env` :
```
VITE_API_URL=https://votre-backend.com
```

## 🐛 Debug

### Le frontend ne démarre pas
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Erreurs CORS
Vérifier que le backend a bien configuré CORS :
```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### L'authentification ne marche pas
1. Vérifier que le Redirect URI dans Spotify Dashboard contient :
   - `http://localhost:8000/auth/callback` (backend)
2. Vérifier que le backend tourne sur le port 8000
3. Vérifier les credentials Spotify dans le `.env` du backend

## 🚧 À venir

### Phase 2 : WebSockets
- ⏱️ Mise à jour en temps réel des votes
- 🔔 Notifications instantanées
- 🎵 Synchronisation de la lecture

### Phase 3 : Intégration Spotify
- ▶️ Lancer la musique directement depuis l'interface
- ⏸️ Contrôles play/pause
- 🔊 Contrôle du volume
- 📱 Web Playback SDK

### Phase 4 : Améliorations UX
- 🎨 Thèmes personnalisables
- 📊 Statistiques de la room
- 📜 Historique des musiques jouées
- 💬 Chat en temps réel

## 📦 Build pour production

```bash
# Build
npm run build

# Preview du build
npm run preview
```

Les fichiers de production seront dans `dist/`

