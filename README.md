# 🎵 Spotify Party — The Ultimate Shared Jukebox

**Spotify Party** est une application full-stack permettant à un groupe d'amis de collaborer en temps réel sur une file d'attente musicale Spotify. Le principe est simple : un "Host" (hôte) crée une session et connecte son enceinte, et tous les invités peuvent chercher et ajouter des titres directement depuis leur téléphone dans une file d'attente partagée !

---

## 🏗️ Architecture Technique (Solution "Golden")

Nous utilisons une architecture hybride optimisée pour le développement local et la stabilité de l'authentification :

-   **Backend Statique (Ngrok)** : Le serveur API utilise un domaine Ngrok fixe (`ripply-unconcentrated-lindy.ngrok-free.dev`) pour que l'authentification Spotify fonctionne sans avoir à modifier le Dashboard Spotify à chaque redémarrage.
-   **Mobile Dynamique (Cloudflare)** : Expo Go est exposé via un tunnel Cloudflare éphémère pour une connectivité maximale sur les réseaux mobiles.
-   **Proxy Dynamique** : L'app mobile communique son URL actuelle au backend pour assurer des redirections OAuth parfaites.

---

## 🚀 Guide de Démarrage Rapide

### 1. Installation
Installez les dépendances à la racine du projet :
```bash
npm install
```

### 2. Configuration (`backend/.env`)
Vérifiez vos identifiants Spotify :
```env
SPOTIFY_CLIENT_ID=votre_id
SPOTIFY_CLIENT_SECRET=votre_secret
SPOTIFY_REDIRECT_URI=https://ripply-unconcentrated-lindy.ngrok-free.dev/api/auth/callback
BACKEND_URL=https://ripply-unconcentrated-lindy.ngrok-free.dev
```

### 3. Lancer le Projet (Commande Maitresse)
Nous avons créé un script qui gère automatiquement les tunnels, l'environnement et le lancement :
```bash
npm run start:all
```
*Ce script :*
- Lance le tunnel **Ngrok** statique pour le backend.
- Lance un tunnel **Cloudflare** pour le packager Expo.
- Démarre **Expo Go** avec la configuration réseau optimale.

### 4. Rejoindre la fête
Scannez le QR Code affiché par Expo Go avec votre téléphone.

---

## 🔐 Configuration Spotify Dashboard

Assurez-vous que votre application sur le [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) possède ce **Redirect URI** :
`https://ripply-unconcentrated-lindy.ngrok-free.dev/api/auth/callback`

---

## 🛠️ VS Code & Outils

Pour une meilleure expérience, ouvrez le projet dans VS Code :
- **Launch Configurations** : Utilisez l'onglet "Exécuter et déboguer" pour lancer le projet en un clic via `🔥 Launch All`.
- **Extensions recommandées** : Installez les extensions suggérées (ESLint, Prettier, React Native Tools).

---

## 💡 Scripts de secours (Root)

- `npm run dev` : Lance backend + frontal via concurrently (sans tunnels complexes).
- `npm run tunnel` : Lance uniquement le tunnel Cloudflare par défaut.
- `npm run start:mobile` : Lance uniquement le tunnel mobile Cloudflare.