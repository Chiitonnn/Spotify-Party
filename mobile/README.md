# 📱 Spotify Party — Application Mobile

Application React Native (Expo Go) pour les invités et l'hôte.

## Démarrage

Pour lancer l'app mobile en développement, utilisez la commande maîtresse **depuis la racine du projet** :

```bash
npm run start:all
```

Ce script gère automatiquement les tunnels et lance Expo. Scannez le QR code affiché avec l'app **Expo Go** sur votre téléphone.

## Configuration locale

Copiez `../backend/.env.example` vers `../backend/.env` et remplissez vos identifiants.
Créez un fichier `config.js` à la racine de ce dossier avec votre URL backend :

```js
export const BASE_URL = 'https://votre-url-ngrok.ngrok-free.dev/api';
```