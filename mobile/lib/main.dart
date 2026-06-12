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
import 'package:sentry_flutter/sentry_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  debugPrint('--- APP STARTUP ---');
  
  // 1. Load env configuration first so it is available for Sentry and other services
  try {
    await dotenv.load(fileName: "assets/.env");
    debugPrint('Dotenv loaded');
  } catch (e) {
    debugPrint('Failed to load dotenv: $e');
  }

  final sentryDsn = dotenv.env['SENTRY_DSN'];
  
  // Helper function to run the app with other initializations
  Future<void> initAndRun() async {
    try {
      await Future.wait([
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
      if (sentryDsn != null && sentryDsn.isNotEmpty) {
        Sentry.captureException(e);
      }
    }

    debugPrint('Launching KibabiiNestApp');
    runApp(
      const ProviderScope(
        child: KibabiiNestApp(),
      ),
    );
  }

  // 2. Initialize Sentry if DSN is set
  if (sentryDsn != null && sentryDsn.isNotEmpty) {
    await SentryFlutter.init(
      (options) {
        options.dsn = sentryDsn;
        options.tracesSampleRate = 1.0;
      },
      appRunner: () => initAndRun(),
    );
  } else {
    await initAndRun();
  }
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
