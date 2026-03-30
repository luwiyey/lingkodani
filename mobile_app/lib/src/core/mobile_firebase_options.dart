import 'package:firebase_core/firebase_core.dart';

import 'app_config.dart';

class MobileFirebaseOptions {
  const MobileFirebaseOptions._();

  static FirebaseOptions? get android {
    if (!AppConfig.hasFirebaseMessagingConfig) {
      return null;
    }

    return FirebaseOptions(
      apiKey: AppConfig.firebaseWebApiKey,
      appId: AppConfig.firebaseAndroidAppId,
      messagingSenderId: AppConfig.firebaseMessagingSenderId,
      projectId: AppConfig.firebaseProjectId,
      storageBucket: AppConfig.firebaseStorageBucket,
    );
  }
}
