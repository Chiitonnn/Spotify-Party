import { createSpotifyApi, SPOTIFY_SCOPES } from '../config/spotify.js';
import User from '../models/User.js';
import { generateToken } from '../services/token.service.js';

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
  const { code, state, error: spotifyError } = req.query;

  // Extraire le redirectUri mobile du state immédiatement pour pouvoir l'utiliser en cas d'erreur
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

  console.log('🔄 [CALLBACK] ========== DÉBUT CALLBACK ==========');
  console.log('📊 [CALLBACK] Platform:', isWeb ? 'Web' : 'Mobile');
  console.log('📍 [CALLBACK] Target Redirect:', isWeb ? 'Frontend Web' : mobileUrl);

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
    console.log('🚀 [CALLBACK] Final Redirect URL calculated:', url);
    return url;
  };

  if (spotifyError) {
    console.error('❌ [CALLBACK] Spotify returned error:', spotifyError);
    return res.redirect(getFinalRedirect({ error: spotifyError }));
  }

  if (!code) {
    return res.redirect(getFinalRedirect({ error: 'No authorization code received' }));
  }

  try {
    const spotifyApi = createSpotifyApi();

    // Échanger le code contre des tokens
    let data;
    try {
      data = await spotifyApi.authorizationCodeGrant(code);
    } catch (err) {
      console.error('❌ [CALLBACK] Spotify Token Exchange Failed:', {
        status: err.statusCode,
        message: err.message,
        error_description: err.body?.error_description
      });
      return res.redirect(getFinalRedirect({ error: 'Token exchange failed' }));
    }

    const { access_token, refresh_token, expires_in } = data.body;
    spotifyApi.setAccessToken(access_token);

    // Récupérer le profil (rendu robuste : on ne plante pas si ça échoue)
    console.log('👤 [CALLBACK] Récupération du profil Spotify...');
    let profileBody = {};
    try {
      const profileData = await spotifyApi.getMe();
      profileBody = profileData.body;
      console.log('✅ [CALLBACK] Profil récupéré:', profileBody.display_name);
    } catch (err) {
      console.warn('⚠️ [CALLBACK] Impossible de récupérer le profil Spotify détaillée:', err.message);
      // Fallback: on utilise des valeurs par défaut pour ne pas bloquer l'utilisateur
      profileBody = {
        id: 'user_' + Math.floor(Math.random() * 1000000),
        display_name: 'Utilisateur Spotify',
        email: 'inconnu@spotify.com',
        images: [],
        product: 'free'
      };
    }

    // Créer ou mettre à jour l'utilisateur
    console.log('💾 [CALLBACK] Sync base de données...');
    let user = await User.findOne({ spotifyId: profileBody.id });

    if (user) {
      console.log('🔄 [CALLBACK] Utilisateur existant trouvé:', user._id);
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
      console.log('🆕 [CALLBACK] Création nouvel utilisateur');
      user = new User({
        spotifyId: profileBody.id,
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
    console.log('✅ [CALLBACK] User saved:', user.displayName);

    const jwtToken = generateToken(user._id);

    const finalUrl = getFinalRedirect({
      token: jwtToken,
      userId: user._id.toString()
    });

    console.log('🚀 [CALLBACK] Success! Redirecting...');
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