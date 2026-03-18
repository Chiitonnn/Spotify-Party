import { createSpotifyApi, SPOTIFY_SCOPES } from '../config/spotify.js';
import User from '../models/User.js';
import { generateToken } from '../services/token.service.js';
import { handleSpotifyCallback } from '../services/auth.service.js';

export const login = (req, res) => {
  try {
    const { platform = 'web', callbackUrl } = req.query;
    console.log('🔐 [LOGIN] platform:', platform, '| callbackUrl:', callbackUrl);

    const state = Buffer.from(JSON.stringify({
      platform,
      mobileCallbackUrl: callbackUrl || null
    })).toString('base64');

    const spotifyApi = createSpotifyApi();
    const authURL = spotifyApi.createAuthorizeURL(SPOTIFY_SCOPES, state, true);

    console.log('✅ [LOGIN] Auth URL generated');
    res.json({ authUrl: authURL });
  } catch (error) {
    console.error('❌ [LOGIN] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// 🆕 FONCTION MODIFIÉE : Version Robuste
export const exchangeCode = async (req, res) => {
  const { code, redirectUri } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const result = await handleSpotifyCallback(code, redirectUri);
    res.json(result);
  } catch (error) {
    console.error('❌ [EXCHANGE] Error:', error.message);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
};

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
    console.warn('⚠️ [CALLBACK] Could not parse state for redirect:', e.message);
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
    console.error('❌ [CALLBACK] Global error:', error.message);
    res.redirect(getFinalRedirect({ error: error.message }));
  }
};

export const refreshToken = async (req, res) => {
  try {
    console.log('🔄 [REFRESH] Refreshing token for user:', req.userId);

    const user = await User.findById(req.userId);
    if (!user || !user.spotifyRefreshToken) {
      console.error('❌ [REFRESH] No refresh token found');
      return res.status(401).json({ error: 'No refresh token' });
    }

    const spotifyApi = createSpotifyApi();
    spotifyApi.setRefreshToken(user.spotifyRefreshToken);

    const data = await spotifyApi.refreshAccessToken();
    user.spotifyAccessToken = data.body.access_token;
    user.tokenExpiresAt = new Date(Date.now() + data.body.expires_in * 1000);

    await user.save();

    console.log('✅ [REFRESH] Token refreshed successfully');
    res.json({
      accessToken: data.body.access_token,
      expiresIn: data.body.expires_in
    });
  } catch (error) {
    console.error('❌ [REFRESH] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    console.log('👤 [GET_USER] Fetching user:', req.userId);

    const user = await User.findById(req.userId).select('-spotifyAccessToken -spotifyRefreshToken');
    if (!user) {
      console.error('❌ [GET_USER] User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ [GET_USER] User found:', user.displayName);
    res.json(user);
  } catch (error) {
    console.error('❌ [GET_USER] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};