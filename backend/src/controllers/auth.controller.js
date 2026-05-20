import { createSpotifyApi, SPOTIFY_SCOPES } from '../config/spotify.js';
import User from '../models/User.js';
import { generateToken } from '../services/token.service.js';
import { handleSpotifyCallback } from '../services/auth.service.js';

/**
 * Redirects the user to Spotify Authorization page or returns the Auth URL.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const login = (req, res) => {
  try {
    const { platform = 'web', callbackUrl } = req.query;

    const state = Buffer.from(JSON.stringify({
      platform,
      mobileCallbackUrl: callbackUrl || null
    })).toString('base64');

    const spotifyApi = createSpotifyApi();
    const authURL = spotifyApi.createAuthorizeURL(SPOTIFY_SCOPES, state, true);

    res.json({ authUrl: authURL });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Exchanges a Spotify authorization code for an access token.
 * Used for manual/custom flows.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const exchangeCode = async (req, res) => {
  const { code, redirectUri } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const result = await handleSpotifyCallback(code, redirectUri);
    res.json(result);
  } catch (error) {
    console.error('Exchange code error:', error.message);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
};

/**
 * Handle the redirect back from Spotify after user authorization.
 * Handles both Web and Mobile redirection logic.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const callback = async (req, res) => {
  const { code, state, error: spotifyError } = req.query;

  let mobileUrl = process.env.FRONTEND_MOBILE_URL || 'spotifyparty://callback';
  let isWeb = false;

  try {
    if (state) {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (stateData.mobileCallbackUrl) mobileUrl = stateData.mobileCallbackUrl;
      if (stateData.platform === 'web') isWeb = true;
    }
  } catch (e) {
    console.warn('Could not parse OAuth state:', e.message);
  }

  const getFinalRedirect = (params = {}) => {
    let url;
    if (isWeb) {
      const webBase = process.env.FRONTEND_WEB_URL || 'http://localhost:5173';
      const search = new URLSearchParams(params).toString();
      url = `${webBase}/auth/callback?${search}`;
    } else {
      const sep = mobileUrl.includes('?') ? '&' : '?';
      const search = new URLSearchParams(params).toString();
      url = `${mobileUrl}${sep}${search}`;
    }
    return url;
  };

  if (spotifyError) {
    return res.redirect(getFinalRedirect({ error: spotifyError }));
  }

  if (!code) {
    return res.redirect(getFinalRedirect({ error: 'No authorization code received' }));
  }

  try {
    const result = await handleSpotifyCallback(code);
    const finalUrl = getFinalRedirect({
      token: result.token,
      userId: result.user.id.toString()
    });
    res.redirect(finalUrl);
  } catch (error) {
    console.error('Callback error:', error.message);
    res.redirect(getFinalRedirect({ error: error.message }));
  }
};

/**
 * Refreshes the Spotify access token for the authenticated user.
 * @param {Object} req - Express request object (with userId from middleware).
 * @param {Object} res - Express response object.
 */
export const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.spotifyRefreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const spotifyApi = createSpotifyApi();
    spotifyApi.setRefreshToken(user.spotifyRefreshToken);

    const data = await spotifyApi.refreshAccessToken();
    user.spotifyAccessToken = data.body.access_token;
    user.tokenExpiresAt = new Date(Date.now() + data.body.expires_in * 1000);

    await user.save();

    res.json({
      accessToken: data.body.access_token,
      expiresIn: data.body.expires_in
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Returns the currently authenticated user's profile information.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-spotifyAccessToken -spotifyRefreshToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ error: error.message });
  }
};