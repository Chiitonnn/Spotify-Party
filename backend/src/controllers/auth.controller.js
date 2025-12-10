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

  console.log('🔄 [CALLBACK] ========== DÉBUT CALLBACK ==========');
  console.log('📊 [CALLBACK] Query params:', req.query);
  console.log('📊 [CALLBACK] Headers:', req.headers);

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
    console.log('🔑 [CALLBACK] Using client ID:', process.env.SPOTIFY_CLIENT_ID?.substring(0, 10) + '...');
    console.log('🔑 [CALLBACK] Using redirect URI:', process.env.SPOTIFY_REDIRECT_URI);
    
    const spotifyApi = createSpotifyApi();
    
    // Tenter l'échange du code
    let data;
    try {
      data = await spotifyApi.authorizationCodeGrant(code);
      console.log('✅ [CALLBACK] Token exchange successful');
    } catch (spotifyError) {
      console.error('❌ [CALLBACK] Spotify API error during token exchange:', {
        message: spotifyError.message,
        statusCode: spotifyError.statusCode,
        body: spotifyError.body
      });
      
      // Extraire le vrai message d'erreur de Spotify
      let errorMsg = 'Spotify authentication failed';
      if (spotifyError.body?.error_description) {
        errorMsg = spotifyError.body.error_description;
      } else if (spotifyError.body?.error) {
        errorMsg = spotifyError.body.error;
      } else if (spotifyError.message) {
        errorMsg = spotifyError.message;
      }
      
      console.log('📤 [CALLBACK] Redirecting with error:', errorMsg);
      return res.redirect(`spotifyparty://callback?error=${encodeURIComponent(errorMsg)}`);
    }
    
    const { access_token, refresh_token, expires_in } = data.body;
    
    if (!access_token) {
      throw new Error('No access token received from Spotify');
    }
    
    console.log('🎫 [CALLBACK] Tokens received, expires in:', expires_in, 'seconds');
    spotifyApi.setAccessToken(access_token);
    
    // Récupérer le profil
    console.log('👤 [CALLBACK] Fetching user profile...');
    let profile;
    try {
      profile = await spotifyApi.getMe();
      console.log('✅ [CALLBACK] Profile received:', {
        id: profile.body.id,
        displayName: profile.body.display_name,
        email: profile.body.email
      });
    } catch (profileError) {
      console.error('❌ [CALLBACK] Error fetching profile:', profileError.message);
      return res.redirect(`spotifyparty://callback?error=${encodeURIComponent('Failed to fetch user profile')}`);
    }
    
    // Créer ou mettre à jour l'utilisateur
    console.log('💾 [CALLBACK] Saving user to database...');
    let user;
    
    try {
      user = await User.findOne({ spotifyId: profile.body.id });
      
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
    } catch (dbError) {
      console.error('❌ [CALLBACK] Database error:', {
        message: dbError.message,
        name: dbError.name,
        code: dbError.code
      });
      
      // Vérifier si c'est une erreur de connexion MongoDB
      if (dbError.name === 'MongoNetworkError' || dbError.name === 'MongooseServerSelectionError') {
        return res.redirect(`spotifyparty://callback?error=${encodeURIComponent('Database connection failed')}`);
      }
      
      return res.redirect(`spotifyparty://callback?error=${encodeURIComponent('Failed to save user: ' + dbError.message)}`);
    }
    
    // Générer le JWT
    let jwtToken;
    try {
      jwtToken = generateToken(user._id);
      console.log('🎟️ [CALLBACK] JWT token generated');
    } catch (jwtError) {
      console.error('❌ [CALLBACK] JWT generation error:', jwtError.message);
      return res.redirect(`spotifyparty://callback?error=${encodeURIComponent('Failed to generate token')}`);
    }
    
    // ✅ Redirection vers le deep link mobile
    const redirectUrl = `spotifyparty://callback?token=${jwtToken}&userId=${user._id}`;
    console.log('🚀 [CALLBACK] Redirecting to app with success');
    console.log('🚀 [CALLBACK] Redirect URL length:', redirectUrl.length);
    res.redirect(redirectUrl);
    
  } catch (error) {
    // Catch-all pour toute erreur non prévue
    console.error('❌ [CALLBACK] Unexpected error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      body: error.body
    });
    
    // ✅ CORRECTION CRITIQUE : Toujours envoyer une string, jamais un objet
    let errorMessage = 'Authentication failed';
    
    // Essayer d'extraire le meilleur message d'erreur possible
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.body?.error_description) {
      errorMessage = error.body.error_description;
    } else if (error.body?.error) {
      errorMessage = error.body.error;
    } else {
      // Si vraiment rien ne fonctionne, stringify l'objet
      errorMessage = JSON.stringify({
        name: error.name,
        message: error.message || 'Unknown error'
      });
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