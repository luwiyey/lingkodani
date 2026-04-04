import 'package:flutter/material.dart';

class MobileMetricCard extends StatelessWidget {
  const MobileMetricCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: const Color(0xFF2F7A3E)),
              const SizedBox(height: 16),
              Text(
                value,
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(color: Colors.grey.shade600)),
            ],
          ),
        ),
      ),
    );
  }
}

class MobileStatusChip extends StatelessWidget {
  const MobileStatusChip({
    super.key,
    required this.text,
    required this.color,
  });

  final String text;
  final MaterialColor color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.shade50,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.shade200),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color.shade800,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class MobileInfoChip extends StatelessWidget {
  const MobileInfoChip({
    super.key,
    required this.text,
  });

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class MobileEmptyCard extends StatelessWidget {
  const MobileEmptyCard({
    super.key,
    required this.message,
  });

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          message,
          style: TextStyle(color: Colors.grey.shade700),
        ),
      ),
    );
  }
}

class MobileErrorState extends StatelessWidget {
  const MobileErrorState({
    super.key,
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, size: 40),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: onRetry,
              child: const Text('Subukan muli'),
            ),
          ],
        ),
      ),
    );
  }
}

class MobileSyncWatchCard extends StatelessWidget {
  const MobileSyncWatchCard({
    super.key,
    required this.pendingCount,
    required this.retryNeededCount,
    required this.manualReviewCount,
    required this.longPendingCount,
    required this.syncing,
    required this.dataMayBeStale,
    required this.lastSyncLabel,
    this.errorMessage,
  });

  final int pendingCount;
  final int retryNeededCount;
  final int manualReviewCount;
  final int longPendingCount;
  final bool syncing;
  final bool dataMayBeStale;
  final String lastSyncLabel;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    final hasAttention =
        retryNeededCount > 0 || manualReviewCount > 0 || longPendingCount > 0;
    final backgroundColor = hasAttention
        ? const Color(0xFFFEF2F2)
        : dataMayBeStale
            ? const Color(0xFFFFFBEB)
            : const Color(0xFFF0FDF4);
    final borderColor = hasAttention
        ? const Color(0xFFFCA5A5)
        : dataMayBeStale
            ? const Color(0xFFFDE68A)
            : const Color(0xFF86EFAC);
    final iconColor = hasAttention
        ? const Color(0xFFB91C1C)
        : dataMayBeStale
            ? const Color(0xFFB45309)
            : const Color(0xFF166534);
    final title = syncing
        ? 'Nagsi-sync ang mobile queue'
        : hasAttention
            ? 'May mobile actions na kailangang bantayan'
            : dataMayBeStale
                ? 'Maaaring luma na ang ilang datos'
                : 'Maayos ang huling mobile sync';

    return Card(
      color: backgroundColor,
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  syncing
                      ? Icons.sync_rounded
                      : hasAttention
                          ? Icons.warning_amber_rounded
                          : dataMayBeStale
                              ? Icons.history_toggle_off_rounded
                              : Icons.cloud_done_rounded,
                  color: iconColor,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: iconColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        lastSyncLabel,
                        style: TextStyle(color: Colors.grey.shade700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                MobileInfoChip(text: '$pendingCount pending'),
                if (retryNeededCount > 0)
                  MobileInfoChip(text: '$retryNeededCount retry needed'),
                if (manualReviewCount > 0)
                  MobileInfoChip(text: '$manualReviewCount manual review'),
                if (longPendingCount > 0)
                  MobileInfoChip(text: '$longPendingCount matagal nang pending'),
              ],
            ),
            if (errorMessage != null && errorMessage!.trim().isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                'Huling sync issue: $errorMessage',
                style: TextStyle(
                  color: Colors.red.shade700,
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
