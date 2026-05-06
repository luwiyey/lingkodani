import 'package:flutter/material.dart';

import '../core/app_config.dart';

class LegalAndPrivacyScreen extends StatelessWidget {
  const LegalAndPrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Legal & Privacy'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: const [
            _LegalCard(
              title: 'What the mobile app stores',
              body:
                  'Lingkod-Ani Mobile stores your staff session, a local cache of pending field actions, and any offline notes or updates that still need to sync. This helps AEWs and barangay staff keep working even with weak signal.',
            ),
            SizedBox(height: 12),
            _LegalCard(
              title: 'Location use',
              body:
                  'Location is requested only when you choose to capture a GPS verification during a field visit. The app does not use background location tracking. If you skip location access, the visit can still be saved with manual verification.',
            ),
            SizedBox(height: 12),
            _LegalCard(
              title: 'Notification use',
              body:
                  'Notifications are optional. If you enable them, the app registers this device for urgent Lingkod-Ani staff alerts so you can respond faster to cases in the field.',
            ),
            SizedBox(height: 12),
            _LegalCard(
              title: 'Privacy policy URL',
              body: AppConfig.privacyPolicyUrl,
              selectable: true,
            ),
            SizedBox(height: 12),
            _LegalCard(
              title: 'Support contact',
              body: AppConfig.supportEmail,
              selectable: true,
            ),
          ],
        ),
      ),
    );
  }
}

class _LegalCard extends StatelessWidget {
  const _LegalCard({
    required this.title,
    required this.body,
    this.selectable = false,
  });

  final String title;
  final String body;
  final bool selectable;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            if (selectable)
              SelectableText(
                body,
                style: TextStyle(color: Colors.grey.shade700, height: 1.5),
              )
            else
              Text(
                body,
                style: TextStyle(color: Colors.grey.shade700, height: 1.5),
              ),
          ],
        ),
      ),
    );
  }
}
