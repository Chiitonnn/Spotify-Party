import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.red, // Couleur très visible
      body: Center(
        child: Text(
          'HOME SCREEN WORKS!',
          style: TextStyle(fontSize: 24, color: Colors.white),
        ),
      ),
    );
  }
}