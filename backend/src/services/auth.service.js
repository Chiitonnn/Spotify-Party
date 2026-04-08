import { createSpotifyApi } from '../config/spotify.js';
import User from '../models/User.js';
import { generateToken } from './token.service.js';

/**
 * Handles Spotify code exchange, profile fetching, and user DB sync.
 * Profile fetch is non-blocking — if it fails, a placeholder user is assigned
 * so the login flow can still complete successfully.
 */
export const handleSpotifyCallback = async (code, redirectUri) => {
  const spotifyApi = createSpotifyApi();

  if (redirectUri) {
    spotifyApi.setRedirectURI(redirectUri);
  }

  // 1. Exchange code for tokens
  let data;
  try {
    data = await spotifyApi.authorizationCodeGrant(code);
  } catch (err) {
    throw new Error(err.body?.error_description || err.message || 'Spotify authentication failed');
  }

  const { access_token, refresh_token, expires_in } = data.body;
  if (!access_token) throw new Error('No access token received from Spotify');

  spotifyApi.setAccessToken(access_token);

  // 2. Fetch user profile (non-blocking — falls back to defaults on failure)
  let profileBody = {};
  try {
    const profileData = await spotifyApi.getMe();
    profileBody = profileData.body;
  } catch (profileError) {
    console.warn('Could not fetch Spotify profile, using placeholder:', profileError.message);
    profileBody = {
      id: 'unknown_user_' + Math.floor(Math.random() * 1000000),
      display_name: 'Utilisateur Spotify',
      email: 'no-email-available',
      images: [],
      product: 'free'
    };
  }

  // 3. Sync user in database
  const spotifyId = profileBody.id || 'unknown';
  let user = await User.findOne({ spotifyId });

  if (user) {
    user.spotifyAccessToken = access_token;
    user.spotifyRefreshToken = refresh_token;
    user.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
    user.displayName = profileBody.display_name || user.displayName;
    user.email = profileBody.email || user.email;
    user.isPremium = profileBody.product === 'premium';
    if (profileBody.images?.[0]?.url) {
      user.profileImage = profileBody.images[0].url;
    }
  } else {
    user = new User({
      spotifyId,
      displayName: profileBody.display_name || 'Utilisateur',
      email: profileBody.email,
      spotifyAccessToken: access_token,
      spotifyRefreshToken: refresh_token,
      tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      isPremium: profileBody.product === 'premium',
      profileImage: profileBody.images?.[0]?.url
    });
  }

  await user.save();

  // 4. Generate internal JWT
  const jwtToken = generateToken(user._id);

  return {
    token: jwtToken,
    user: {
      id: user._id,
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      email: user.email,
      isPremium: user.isPremium,
      profileImage: user.profileImage
    }
  };
};
