import { createSpotifyApi, SPOTIFY_SCOPES } from '../config/spotify.js';
import User from '../models/User.js';
import { generateToken } from '../services/token.service.js';

export const login = (req, res) => {
  try {
    console.log('🔐 [LOGIN] Starting login flow...');
    console.log('📍 SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);
    
    const spotifyApi = createSpotifyApi();
    const authURL = spotifyApi.createAuthorizeURL(SPOTIFY_SCOPES, 'state');
    
    console.log('✅ [LOGIN] Auth URL generated:', authURL);
    res.json({ authUrl: authURL });
  } catch (error) {
    console.error('❌ [LOGIN] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: error.message });
  }
};

export const callback = async (req, res) => {
  const { code, error: spotifyError } = req.query;

  console.log('🔄 [CALLBACK] Received callback from Spotify');
  console.log('📊 [CALLBACK] Query params:', { 
    hasCode: !!code, 
    codeLength: code?.length,
    spotifyError: spotifyError 
  });

  // Si Spotify renvoie une erreur
  if (spotifyError) {
    console.error('❌ [CALLBACK] Spotify returned error:', spotifyError);
    return res.redirect(`spotifyparty://callback?error=${encodeURIComponent(spotifyError)}`);
  }

  // Si pas de code
  if (!code) {
    console.error('❌ [CALLBACK] No code received from Spotify');
    return res.redirect(`spotifyparty://callback?error=${encodeURIComponent('No authorization code received')}`);
  }

  try {
    console.log('🎫 [CALLBACK] Exchanging code for tokens...');
    const spotifyApi = createSpotifyApi();
    const data = await spotifyApi.authorizationCodeGrant(code);
    
    console.log('✅ [CALLBACK] Tokens received from Spotify');
    const { access_token, refresh_token, expires_in } = data.body;
    
    if (!access_token) {
      throw new Error('No access token received from Spotify');
    }
    
    spotifyApi.setAccessToken(access_token);
    
    // Récupérer le profil
    console.log('👤 [CALLBACK] Fetching user profile...');
    const profile = await spotifyApi.getMe();
    
    console.log('✅ [CALLBACK] Profile received:', {
      id: profile.body.id,
      displayName: profile.body.display_name,
      email: profile.body.email
    });
    
    // Créer ou mettre à jour l'utilisateur
    console.log('💾 [CALLBACK] Saving user to database...');
    let user = await User.findOne({ spotifyId: profile.body.id });
    
    if (user) {
      console.log('🔄 [CALLBACK] Updating existing user:', user._id);
      user.spotifyAccessToken = access_token;
      user.spotifyRefreshToken = refresh_token;
      user.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      user.displayName = profile.body.display_name;
      user.email = profile.body.email;
      user.isPremium = profile.body.product === 'premium';
      user.profileImage = profile.body.images?.[0]?.url;
    } else {
      console.log('🆕 [CALLBACK] Creating new user');
      user = new User({
        spotifyId: profile.body.id,
        displayName: profile.body.display_name,
        email: profile.body.email,
        spotifyAccessToken: access_token,
        spotifyRefreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        isPremium: profile.body.product === 'premium',
        profileImage: profile.body.images?.[0]?.url
      });
    }
    
    await user.save();
    console.log('✅ [CALLBACK] User saved successfully:', user._id);
    
    const jwtToken = generateToken(user._id);
    console.log('🎟️ [CALLBACK] JWT token generated');
    
    // ✅ Redirection vers le deep link mobile
    const redirectUrl = `spotifyparty://callback?token=${jwtToken}&userId=${user._id}`;
    console.log('🚀 [CALLBACK] Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ [CALLBACK] Error occurred:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      body: error.body
    });
    
    // ✅ Extraire le message d'erreur proprement
    let errorMessage = 'Authentication failed';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.body?.error?.message) {
      errorMessage = error.body.error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.log('📤 [CALLBACK] Sending error to app:', errorMessage);
    res.redirect(`spotifyparty://callback?error=${encodeURIComponent(errorMessage)}`);
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
    console.error('❌ [REFRESH] Error:', {
      message: error.message,
      stack: error.stack
    });
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
    console.error('❌ [GET_USER] Error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
};