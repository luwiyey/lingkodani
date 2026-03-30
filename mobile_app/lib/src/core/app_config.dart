class AppConfig {
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://lingkod-ani.com',
  );

  static const firebaseWebApiKey = String.fromEnvironment(
    'FIREBASE_WEB_API_KEY',
    defaultValue: 'AIzaSyBOvgBtkbfyUGrn8qmz5HCxQzM5IwVH7Ag',
  );

  static bool get hasFirebaseWebApiKey => firebaseWebApiKey.trim().isNotEmpty;
}
