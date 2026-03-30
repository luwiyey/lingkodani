import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/models/mobile_models.dart';
import '../state/app_state.dart';
import 'mobile_shared_widgets.dart';

class MobileAlertsTab extends StatefulWidget {
  const MobileAlertsTab({
    super.key,
    required this.session,
    required this.onOpenFarmer,
    required this.onOpenSms,
  });

  final MobileSession session;
  final void Function(String farmerId, String title) onOpenFarmer;
  final VoidCallback onOpenSms;

  @override
  State<MobileAlertsTab> createState() => _MobileAlertsTabState();
}

class _MobileAlertsTabState extends State<MobileAlertsTab> {
  late Future<MobileNotificationsFeed> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<MobileNotificationsFeed> _load() {
    return context.read<AppState>().api.fetchNotifications(widget.session.idToken);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<MobileNotificationsFeed>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return MobileErrorState(
            message: '${snapshot.error}',
            onRetry: () => setState(() => _future = _load()),
          );
        }

        final feed = snapshot.data!;

        return RefreshIndicator(
          onRefresh: () async {
            setState(() => _future = _load());
            await _future;
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  MobileMetricCard(
                    label: 'Alerts',
                    value: '${feed.summary.alertCount}',
                    icon: Icons.notification_important_rounded,
                  ),
                  MobileMetricCard(
                    label: 'Urgent cases',
                    value: '${feed.summary.urgentCaseCount}',
                    icon: Icons.warning_amber_rounded,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Text(
                'In-app notification center',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              Text(
                'Ito ang best mobile alert layer habang wala pang native Firebase Messaging setup.',
                style: TextStyle(color: Colors.grey.shade600),
              ),
              const SizedBox(height: 12),
              if (feed.notifications.isEmpty)
                const MobileEmptyCard(
                  message: 'Wala pang alert o urgent case sa ngayon.',
                )
              else
                ...feed.notifications.map(
                  (item) => Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                item.kind == 'alert'
                                    ? Icons.campaign_rounded
                                    : Icons.sms_failed_rounded,
                                color: item.severity == 'high' ||
                                        item.severity == 'critical'
                                    ? Colors.red.shade700
                                    : const Color(0xFF2F7A3E),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  item.title,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(item.subtitle),
                          if (item.detail.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(
                              item.detail,
                              style: TextStyle(color: Colors.grey.shade700),
                            ),
                          ],
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              MobileInfoChip(text: item.kind),
                              MobileInfoChip(text: item.severity),
                              if (item.timestamp.isNotEmpty)
                                MobileInfoChip(text: item.timestamp),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              if (item.hasFarmerTarget)
                                OutlinedButton.icon(
                                  onPressed: () =>
                                      widget.onOpenFarmer(item.farmerId, item.title),
                                  icon: const Icon(Icons.person_outline_rounded),
                                  label: const Text('Farmer detail'),
                                ),
                              if (item.hasMessageTarget)
                                FilledButton.tonalIcon(
                                  onPressed: widget.onOpenSms,
                                  icon: const Icon(Icons.sms_outlined),
                                  label: const Text('Buksan ang SMS feed'),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
