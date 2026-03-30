class AppConfig {
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://lingkod-ani.com',
  );

  static const firebaseWebApiKey = String.fromEnvironment(
    'FIREBASE_WEB_API_KEY',
    defaultValue: 'AIzaSyBOvgBtkbfyUGrn8qmz5HCxQzM5IwVH7Ag',
  );

  static const firebaseProjectId = String.fromEnvironment(
    'MOBILE_FIREBASE_PROJECT_ID',
    defaultValue: 'lingkod-ani',
  );

  static const firebaseStorageBucket = String.fromEnvironment(
    'MOBILE_FIREBASE_STORAGE_BUCKET',
    defaultValue: 'lingkod-ani.firebasestorage.app',
  );

  static const firebaseMessagingSenderId = String.fromEnvironment(
    'MOBILE_FIREBASE_MESSAGING_SENDER_ID',
    defaultValue: '310193583286',
  );

  static const firebaseAndroidAppId = String.fromEnvironment(
    'MOBILE_FIREBASE_ANDROID_APP_ID',
    defaultValue: '',
  );

  static bool get hasFirebaseWebApiKey => firebaseWebApiKey.trim().isNotEmpty;

  static bool get hasFirebaseMessagingConfig =>
      firebaseWebApiKey.trim().isNotEmpty &&
      firebaseProjectId.trim().isNotEmpty &&
      firebaseStorageBucket.trim().isNotEmpty &&
      firebaseMessagingSenderId.trim().isNotEmpty &&
      firebaseAndroidAppId.trim().isNotEmpty;
}
