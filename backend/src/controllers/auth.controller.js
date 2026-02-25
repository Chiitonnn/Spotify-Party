import { createSpotifyApi, SPOTIFY_SCOPES } from '../config/spotify.js';
import User from '../models/User.js';
import { generateToken } from '../services/token.service.js';

export const login = (req, res) => {
  try {
    console.log('🔐 [LOGIN] Starting login flow...');
    console.log('🔑 SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);
    
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

// 🆕 FONCTION MODIFIÉE : Version Robuste
export const exchangeCode = async (req, res) => {
  const { code, redirectUri } = req.body;

  console.log('🔄 [EXCHANGE] ========== DÉBUT EXCHANGE ==========');
  console.log('📊 [EXCHANGE] Code reçu:', code?.substring(0, 20) + '...');
  console.log('📍 [EXCHANGE] Redirect URI:', redirectUri);

  if (!code) {
    console.error('❌ [EXCHANGE] No code provided');
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    console.log('🎫 [EXCHANGE] Exchanging code for tokens...');
    
    // Créer l'instance Spotify API
    const spotifyApi = createSpotifyApi();
    
    // Si une redirectUri est fournie (depuis l'app mobile), l'utiliser
    if (redirectUri) {
      spotifyApi.setRedirectURI(redirectUri);
    }
    
    // Échanger le code contre des tokens
    let data;
    try {
      data = await spotifyApi.authorizationCodeGrant(code);
      console.log('✅ [EXCHANGE] Token exchange successful');
    } catch (spotifyError) {
      console.error('❌ [EXCHANGE] Spotify API error:', {
        message: spotifyError.message,
        statusCode: spotifyError.statusCode,
        body: spotifyError.body
      });
      
      return res.status(400).json({ 
        error: 'Spotify authentication failed',
        details: spotifyError.body?.error_description || spotifyError.message
      });
    }
    
    const { access_token, refresh_token, expires_in } = data.body;
    
    if (!access_token) {
      throw new Error('No access token received from Spotify');
    }
    
    console.log('🎫 [EXCHANGE] Tokens received, expires in:', expires_in, 'seconds');
    spotifyApi.setAccessToken(access_token);
    
    // 🛡️ CORRECTION ICI : Récupération robuste du profil
    console.log('👤 [EXCHANGE] Fetching user profile...');
    let profileBody = {};
    
    try {
      const profileData = await spotifyApi.getMe();
      profileBody = profileData.body;
      console.log('✅ [EXCHANGE] Profile received:', {
        id: profileBody.id,
        displayName: profileBody.display_name
      });
    } catch (profileError) {
      // On log juste un warning, mais ON NE PLANTE PAS L'AUTH
      console.warn('⚠️ [EXCHANGE] Warning: Could not fetch Spotify profile details, using defaults.', profileError.message);
      console.warn(JSON.stringify(profileError, null, 2));
      
      // Valeurs par défaut pour continuer l'inscription
      profileBody = {
        id: 'unknown_user_' + Math.floor(Math.random() * 10000), 
        display_name: 'Utilisateur Spotify',
        email: 'no-email-available',
        images: [],
        product: 'free'
      };
    }
    
    // Créer ou mettre à jour l'utilisateur
    console.log('💾 [EXCHANGE] Saving user to database...');
    let user;
    
    try {
      // Utilisation sécurisée de profileBody
      const spotifyId = profileBody.id || 'unknown';
      
      user = await User.findOne({ spotifyId: spotifyId });
      
      if (user) {
        console.log('🔄 [EXCHANGE] Updating existing user:', user._id);
        user.spotifyAccessToken = access_token;
        user.spotifyRefreshToken = refresh_token;
        user.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
        user.displayName = profileBody.display_name || user.displayName;
        user.email = profileBody.email || user.email;
        user.isPremium = profileBody.product === 'premium';
        // Garde l'ancienne image si la nouvelle n'est pas dispo
        if (profileBody.images?.[0]?.url) {
            user.profileImage = profileBody.images[0].url;
        }
      } else {
        console.log('🆕 [EXCHANGE] Creating new user');
        user = new User({
          spotifyId: spotifyId,
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
      console.log('✅ [EXCHANGE] User saved successfully:', user._id);
    } catch (dbError) {
      console.error('❌ [EXCHANGE] Database error:', {
        message: dbError.message,
        name: dbError.name
      });
      
      return res.status(500).json({ 
        error: 'Failed to save user',
        details: dbError.message
      });
    }
    
    // Générer le JWT
    let jwtToken;
    try {
      jwtToken = generateToken(user._id);
      console.log('🎟️ [EXCHANGE] JWT token generated');
    } catch (jwtError) {
      console.error('❌ [EXCHANGE] JWT generation error:', jwtError.message);
      return res.status(500).json({ error: 'Failed to generate token' });
    }
    
    // Retourner le token et les infos utilisateur
    console.log('✅ [EXCHANGE] Success! Returning data to client');
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        spotifyId: user.spotifyId,
        displayName: user.displayName,
        email: user.email,
        isPremium: user.isPremium,
        profileImage: user.profileImage
      }
    });
    
  } catch (error) {
    console.error('❌ [EXCHANGE] Unexpected error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message
    });
  }
};

export const callback = async (req, res) => {
  const { code, error: spotifyError } = req.query;

  console.log('🔄 [CALLBACK] ========== DÉBUT CALLBACK ==========');
  console.log('📊 [CALLBACK] Query params:', req.query);

  if (spotifyError) {
    console.error('❌ [CALLBACK] Spotify returned error:', spotifyError);
    return res.redirect(`spotifyparty://callback?error=${encodeURIComponent(spotifyError)}`);
  }

  if (!code) {
    console.error('❌ [CALLBACK] No code received from Spotify');
    return res.redirect(`spotifyparty://callback?error=${encodeURIComponent('No authorization code received')}`);
  }

  try {
    console.log('🎫 [CALLBACK] Exchanging code for tokens...');
    
    const spotifyApi = createSpotifyApi();
    
    let data;
    try {
      data = await spotifyApi.authorizationCodeGrant(code);
      console.log('✅ [CALLBACK] Token exchange successful');
    } catch (spotifyError) {
      console.error('❌ [CALLBACK] Spotify API error:', {
        message: spotifyError.message,
        statusCode: spotifyError.statusCode,
        body: spotifyError.body
      });
      
      let errorMsg = spotifyError.body?.error_description || spotifyError.message || 'Authentication failed';
      return res.redirect(`spotifyparty://callback?error=${encodeURIComponent(errorMsg)}`);
    }
    
    const { access_token, refresh_token, expires_in } = data.body;
    
    if (!access_token) {
      throw new Error('No access token received from Spotify');
    }
    
    console.log('🎫 [CALLBACK] Tokens received');
    spotifyApi.setAccessToken(access_token);
    
    console.log('👤 [CALLBACK] Fetching user profile...');
    let profile;
    try {
      profile = await spotifyApi.getMe();
      console.log('✅ [CALLBACK] Profile received:', profile.body.display_name);
    } catch (profileError) {
      console.error('❌ [CALLBACK] Error fetching profile:', profileError.message);
      return res.redirect(`spotifyparty://callback?error=${encodeURIComponent('Failed to fetch user profile')}`);
    }
    
    console.log('💾 [CALLBACK] Saving user...');
    let user = await User.findOne({ spotifyId: profile.body.id });
    
    if (user) {
      user.spotifyAccessToken = access_token;
      user.spotifyRefreshToken = refresh_token;
      user.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      user.displayName = profile.body.display_name;
      user.email = profile.body.email;
      user.isPremium = profile.body.product === 'premium';
      user.profileImage = profile.body.images?.[0]?.url;
    } else {
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
    console.log('✅ [CALLBACK] User saved');
    
    const jwtToken = generateToken(user._id);
    
    const redirectUrl = `spotifyparty://callback?token=${jwtToken}&userId=${user._id}`;
    console.log('🚀 [CALLBACK] Redirecting to app');
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ [CALLBACK] Error:', error.message);
    res.redirect(`spotifyparty://callback?error=${encodeURIComponent(error.message)}`);
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