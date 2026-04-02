import 'package:geolocator/geolocator.dart';

class FieldVisitLocationService {
  const FieldVisitLocationService();

  Future<Map<String, dynamic>> captureVerification() async {
    final capturedAt = DateTime.now().toIso8601String();

    try {
      final servicesEnabled = await Geolocator.isLocationServiceEnabled();

      if (!servicesEnabled) {
        return {
          'status': 'manual_only',
          'source': 'mobile_manual',
          'capturedAt': capturedAt,
          'note': 'Location service is turned off on this device.',
        };
      }

      var permission = await Geolocator.checkPermission();

      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return {
          'status': 'manual_only',
          'source': 'mobile_manual',
          'capturedAt': capturedAt,
          'note': permission == LocationPermission.deniedForever
              ? 'Location permission is permanently denied.'
              : 'Location permission was not granted.',
        };
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 12),
        ),
      );

      return {
        'status': 'gps_captured',
        'source': 'mobile_gps',
        'capturedAt': capturedAt,
        'lat': position.latitude,
        'lng': position.longitude,
        'accuracyMeters': position.accuracy,
        'note': 'Captured from mobile field visit workflow.',
      };
    } catch (error) {
      return {
        'status': 'manual_only',
        'source': 'mobile_manual',
        'capturedAt': capturedAt,
        'note': 'GPS capture failed: $error',
      };
    }
  }
}
