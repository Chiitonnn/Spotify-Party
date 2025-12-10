import SpotifyWebApi from 'spotify-web-api-node';

export const createSpotifyApi = (accessToken = null) => {
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  });

  if (accessToken) {
    spotifyApi.setAccessToken(accessToken);
  }

  return spotifyApi;
};

export const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
  'streaming'
];