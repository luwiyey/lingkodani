import 'package:shared_preferences/shared_preferences.dart';

class PermissionNoticeStore {
  const PermissionNoticeStore();

  static const _locationDisclosureAcceptedKey =
      'location_disclosure_accepted_v1';
  static const _notificationDisclosureAcceptedKey =
      'notification_disclosure_accepted_v1';

  Future<bool> hasAcceptedLocationDisclosure() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getBool(_locationDisclosureAcceptedKey) ?? false;
  }

  Future<void> markLocationDisclosureAccepted() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_locationDisclosureAcceptedKey, true);
  }

  Future<bool> hasAcceptedNotificationDisclosure() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getBool(_notificationDisclosureAcceptedKey) ?? false;
  }

  Future<void> markNotificationDisclosureAccepted() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_notificationDisclosureAcceptedKey, true);
  }
}
