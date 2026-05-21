import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/theme.dart';
import 'core/router.dart';
import 'firebase_options.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'services/notification_service.dart';
import 'core/providers/theme_provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'navigation/services/background_tracking_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);
  
  debugPrint('--- APP STARTUP ---');
  
  try {
    // Wrap initialization in a timeout to prevent permanent splash screen hangs
    await Future.wait([
      dotenv.load(fileName: "assets/.env").then((_) => debugPrint('Dotenv loaded')),
      Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      ).then((_) => debugPrint('Firebase initialized')),
      BackgroundTrackingService.initialize().then((_) => debugPrint('Background service initialized')),
    ]).timeout(const Duration(seconds: 8), onTimeout: () {
      debugPrint('Warning: Startup initialization timed out after 8s');
      return [];
    });
    
  } catch (e) {
    debugPrint('Startup initialization error: $e');
  }
  
  debugPrint('Launching KibabiiNestApp');
  runApp(
    const ProviderScope(
      child: KibabiiNestApp(),
    ),
  );
}

class KibabiiNestApp extends ConsumerStatefulWidget {
  const KibabiiNestApp({super.key});

  @override
  ConsumerState<KibabiiNestApp> createState() => _KibabiiNestAppState();
}

class _KibabiiNestAppState extends ConsumerState<KibabiiNestApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      NotificationService().initialize(context);
      NotificationService().subscribeToUserTopic();
    });
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);

    return MaterialApp.router(
      title: 'Kibabii Nest',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: AppRouter.router,
    );
  }
}
