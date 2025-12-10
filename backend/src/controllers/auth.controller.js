import { createSpotifyApi, SPOTIFY_SCOPES } from '../config/spotify.js';
import User from '../models/User.js';
import { generateToken } from '../services/token.service.js';

export const login = (req, res) => {
  try {
    console.log('SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);
    const spotifyApi = createSpotifyApi();
    const authURL = spotifyApi.createAuthorizeURL(SPOTIFY_SCOPES, 'state');
    console.log('Auth URL:', authURL);
    res.json({ authUrl: authURL });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const callback = async (req, res) => {
  const { code } = req.query;

  try {
    const spotifyApi = createSpotifyApi();
    const data = await spotifyApi.authorizationCodeGrant(code);
    
    const { access_token, refresh_token, expires_in } = data.body;
    spotifyApi.setAccessToken(access_token);
    
    // Récupérer le profil
    const profile = await spotifyApi.getMe();
    
    // Créer ou mettre à jour l'utilisateur
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
    
    const jwtToken = generateToken(user._id);
    
    // ✅ Redirection vers le deep link mobile
    res.redirect(`spotifyparty://callback?token=${jwtToken}&userId=${user._id}`);
  } catch (error) {
    console.error('Auth callback error:', error);
    // ✅ Extraire le message d'erreur proprement
    const errorMessage = error.message || error.toString() || 'Authentication failed';
    res.redirect(`spotifyparty://callback?error=${encodeURIComponent(errorMessage)}`);
  }
};

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
    res.status(500).json({ error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-spotifyAccessToken -spotifyRefreshToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};