import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

// Screens
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/create_session_screen.dart';
import 'screens/join_session_screen.dart';
import 'screens/session_screen.dart';

// Services
import 'services/api_service.dart';
import 'utils/constants.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Orientation portrait uniquement
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final ApiService _apiService = ApiService();
  String _initialRoute = '/';
  bool _isCheckingAuth = true;

  @override
  void initState() {
    super.initState();
    _determineInitialRoute();
  }

  Future<void> _determineInitialRoute() async {
    await _apiService.loadToken();
    
    // Vérifier SI on est dans une redirection Spotify avec token
    if (kIsWeb) {
      final uri = Uri.base;
      final accessToken = uri.queryParameters['access_token'];
      final userId = uri.queryParameters['user_id'];
      
      // Si l'URL contient un token, on est dans un callback Spotify
      if (accessToken != null && accessToken.isNotEmpty) {
        print('🎯 Détection callback Spotify - Token présent dans URL');
        
        // Sauvegarder le token et rediriger vers home
        await _apiService.saveToken(accessToken);
        
        final prefs = await SharedPreferences.getInstance();
        if (userId != null) {
          await prefs.setString(AppConstants.keyUserId, userId);
        }
        
        setState(() {
          _initialRoute = '/home';
          _isCheckingAuth = false;
        });
        return;
      }
    }
    
    // Vérifier l'authentification existante normale
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.keyAccessToken);
    
    if (token != null && token.isNotEmpty) {
      setState(() {
        _initialRoute = '/home';
        _isCheckingAuth = false;
      });
    } else {
      setState(() {
        _initialRoute = '/';
        _isCheckingAuth = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isCheckingAuth) {
      return MaterialApp(
        home: Scaffold(
          backgroundColor: const Color(0xFF191414),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircularProgressIndicator(color: Color(0xFF1DB954)),
                const SizedBox(height: 20),
                const Text(
                  'Vérification...',
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return MaterialApp(
      title: 'Spotify Party',
      theme: ThemeData(
        primaryColor: const Color(0xFF1DB954),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF1DB954),
          secondary: Color(0xFF1DB954),
          background: Color(0xFF191414),
          surface: Color(0xFF282828),
        ),
        scaffoldBackgroundColor: const Color(0xFF191414),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF191414),
          elevation: 0,
          iconTheme: IconThemeData(color: Colors.white),
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: Colors.white),
          bodyMedium: TextStyle(color: Colors.white),
          titleLarge: TextStyle(color: Colors.white),
          titleMedium: TextStyle(color: Colors.white),
        ),
        useMaterial3: true,
      ),
      initialRoute: _initialRoute,
      routes: {
        '/': (context) => const LoginScreen(),
        '/home': (context) => const HomeScreen(),
        '/create-session': (context) => const CreateSessionScreen(),
        '/join-session': (context) => const JoinSessionScreen(),
        '/session': (context) => const SessionScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/session' && settings.arguments != null) {
          return MaterialPageRoute(
            builder: (context) => SessionScreen(),
            settings: settings,
          );
        }
        return null;
      },
      onUnknownRoute: (settings) {
        return MaterialPageRoute(builder: (context) => const LoginScreen());
      },
    );
  }
}