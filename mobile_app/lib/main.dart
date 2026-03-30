import 'package:flutter/widgets.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'src/app.dart';
import 'src/core/services/push_notifications_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (PushNotificationsService.isConfigured) {
    await PushNotificationsService.ensureFirebaseInitialized();
    FirebaseMessaging.onBackgroundMessage(
      firebaseMessagingBackgroundHandler,
    );
  }

  runApp(const LingkodAniMobileApp());
}
