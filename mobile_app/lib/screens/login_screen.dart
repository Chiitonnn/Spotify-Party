import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../utils/constants.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  bool _hasTokenInUrl = false;

  @override
  void initState() {
    super.initState();
    _checkExistingAuth();
  }

  Future<void> _checkExistingAuth() async {
    // Vérifier si l'URL contient un token (callback Spotify)
    if (kIsWeb) {
      final uri = Uri.base;
      final accessToken = uri.queryParameters['access_token'];
      
      if (accessToken != null && accessToken.isNotEmpty) {
        setState(() {
          _hasTokenInUrl = true;
        });
      }
    }
    
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.keyAccessToken);
    
    if (token != null && token.isNotEmpty) {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/home');
      }
      return;
    }
    
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loginWithSpotify() async {
    try {
      // RÉCUPÉRER L'URL D'AUTH ET REDIRIGER VERS ELLE
      final response = await _apiService.getAuthUrl();
      final authUrl = response['auth_url'];
      
      print('🔗 Redirection vers: $authUrl');
      
      if (kIsWeb) {
        // Web : ouvrir dans le même onglet
        await launchUrl(
          Uri.parse(authUrl),
          mode: LaunchMode.inAppWebView,
        );
      } else {
        // Pour mobile : ouvrir l'URL d'auth
        if (await canLaunchUrl(Uri.parse(authUrl))) {
          await launchUrl(Uri.parse(authUrl));
        } else {
          throw 'Impossible d\'ouvrir l\'URL d\'authentification';
        }
      }
    } catch (e) {
      print('❌ Erreur login: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur de connexion: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // NOUVELLE MÉTHODE : Utiliser le token présent dans l'URL
  Future<void> _useTokenFromUrl() async {
    if (kIsWeb) {
      final uri = Uri.base;
      final accessToken = uri.queryParameters['access_token'];
      final userId = uri.queryParameters['user_id'];
      
      if (accessToken != null && accessToken.isNotEmpty) {
        setState(() => _isLoading = true);
        
        try {
          await _apiService.saveToken(accessToken);
          
          final prefs = await SharedPreferences.getInstance();
          if (userId != null) {
            await prefs.setString(AppConstants.keyUserId, userId);
          }
          
          if (mounted) {
            Navigator.pushReplacementNamed(context, '/home');
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Erreur: $e')),
            );
            setState(() => _isLoading = false);
          }
        }
      }
    }
  }

  void _showManualAuthDialog() {
    final codeController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Authentification Spotify'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Pour mobile, utilisez cette méthode:'),
            const SizedBox(height: 10),
            Text(
              '1. Allez sur: ${AppConstants.apiUrl}/api/auth/login\n'
              '2. Autorisez l\'application\n'
              '3. Copiez le code de l\'URL\n'
              '4. Collez-le ci-dessous',
              style: const TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: codeController,
              decoration: const InputDecoration(
                labelText: 'Code d\'autorisation',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _submitManualCode(codeController.text);
            },
            child: const Text('Se connecter'),
          ),
        ],
      ),
    );
  }

  Future<void> _submitManualCode(String code) async {
    if (code.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Veuillez entrer le code'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    if (mounted) {
      setState(() => _isLoading = true);
    }

    try {
      final result = await _apiService.handleCallback(code);
      await _apiService.saveToken(result['access_token']);
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.keyUserId, result['user']['id']);
      await prefs.setString(AppConstants.keyUserData, json.encode(result['user']));
      
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF191414),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Color(0xFF1DB954)),
                  SizedBox(height: 20),
                  Text(
                    'Chargement...',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ],
              ),
            )
          : Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.music_note,
                    size: 80,
                    color: Color(0xFF1DB954),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Spotify Party',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Connectez-vous avec Spotify pour commencer',
                    style: TextStyle(color: Colors.grey, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 40),
                  
                  // BOUTON PRINCIPAL - Authentification Spotify
                  ElevatedButton(
                    onPressed: _loginWithSpotify,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1DB954),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                    child: const Text(
                      'Se connecter avec Spotify',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  
                  // NOUVEAU BOUTON - Si token présent dans URL
                  if (_hasTokenInUrl) ...[
                    const SizedBox(height: 20),
                    const Text(
                      '✅ Authentification réussie!',
                      style: TextStyle(
                        color: Color(0xFF1DB954),
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton(
                      onPressed: _useTokenFromUrl,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                      ),
                      child: const Text(
                        'Accéder à l\'application',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Cliquez ici pour finaliser votre connexion',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                  
                  if (!kIsWeb) ...[
                    const SizedBox(height: 20),
                    const Text(
                      'Sur mobile, vous devrez copier-coller le code d\'autorisation',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: _showManualAuthDialog,
                      child: const Text(
                        'Méthode manuelle',
                        style: TextStyle(color: Color(0xFF1DB954)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}