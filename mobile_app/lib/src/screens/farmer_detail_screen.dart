import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/models/mobile_models.dart';
import '../state/app_state.dart';

class FarmerDetailScreen extends StatefulWidget {
  const FarmerDetailScreen({
    super.key,
    required this.session,
    required this.farmerId,
    required this.title,
  });

  final MobileSession session;
  final String farmerId;
  final String title;

  @override
  State<FarmerDetailScreen> createState() => _FarmerDetailScreenState();
}

class _FarmerDetailScreenState extends State<FarmerDetailScreen> {
  late Future<FarmerDetail> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<FarmerDetail> _load() {
    return context
        .read<AppState>()
        .api
        .fetchFarmerDetail(widget.session.idToken, widget.farmerId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
      ),
      body: SafeArea(
        child: FutureBuilder<FarmerDetail>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return _DetailErrorState(
                message: '${snapshot.error}',
                onRetry: () => setState(() => _future = _load()),
              );
            }

            final detail = snapshot.data!;
            final farmer = detail.farmer;

            return RefreshIndicator(
              onRefresh: () async {
                setState(() => _future = _load());
                await _future;
              },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 28,
                                backgroundColor: const Color(0xFFE7F4E8),
                                child: Text(
                                  farmer.name.isNotEmpty
                                      ? farmer.name[0].toUpperCase()
                                      : '?',
                                  style: const TextStyle(
                                    color: Color(0xFF2F7A3E),
                                    fontWeight: FontWeight.w800,
                                    fontSize: 20,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      farmer.name,
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      [
                                        if (farmer.sitio.isNotEmpty) farmer.sitio,
                                        if (farmer.barangay.isNotEmpty)
                                          farmer.barangay,
                                      ].join(' • '),
                                      style: TextStyle(
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _Pill(text: farmer.status),
                              if (farmer.phone.isNotEmpty) _Pill(text: farmer.phone),
                              ...farmer.crops.map((crop) => _Pill(text: crop)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _MetaLine(label: 'Huling SMS activity', value: farmer.lastSmsActivity),
                          _MetaLine(label: 'Registration date', value: farmer.registrationDate),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  _SectionTitle(
                    title: 'Pinakahuling SMS',
                    subtitle:
                        'Makikita rito ang pinakabagong usapan at case status.',
                  ),
                  const SizedBox(height: 8),
                  if (detail.recentMessages.isEmpty)
                    const _EmptyCard(message: 'Wala pang naka-link na SMS record.')
                  else
                    ...detail.recentMessages.map(
                      (message) => Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                message.message,
                                style: const TextStyle(
                                  fontSize: 15,
                                  height: 1.45,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _Pill(text: message.caseStatus),
                                  _Pill(text: message.urgency),
                                  _Pill(text: message.parsedIntent),
                                  if (message.caseId.isNotEmpty)
                                    _Pill(text: message.caseId),
                                ],
                              ),
                              if (message.aiAdvice.isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Text(
                                  'Pinakahuling payo: ${message.aiAdvice}',
                                  style: TextStyle(
                                    color: Colors.grey.shade700,
                                    height: 1.35,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  const SizedBox(height: 20),
                  _SectionTitle(
                    title: 'Tulong at serbisyo',
                    subtitle:
                        'Mga naitalang assistance, vouchers, o support entries.',
                  ),
                  const SizedBox(height: 8),
                  if (detail.assistanceRecords.isEmpty)
                    const _EmptyCard(
                      message: 'Wala pang assistance record para sa farmer na ito.',
                    )
                  else
                    ...detail.assistanceRecords.map(
                      (record) => Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(record.title),
                          subtitle: Text(
                            [
                              record.type,
                              record.details,
                              if (record.quantity.isNotEmpty) record.quantity,
                            ].where((part) => part.isNotEmpty).join(' • '),
                          ),
                          trailing: _Pill(text: record.status),
                        ),
                      ),
                    ),
                  const SizedBox(height: 20),
                  _SectionTitle(
                    title: 'Field visits',
                    subtitle:
                        'Mga naka-assign o natapos na pagbisita kaugnay ng concern.',
                  ),
                  const SizedBox(height: 8),
                  if (detail.fieldVisitTasks.isEmpty)
                    const _EmptyCard(
                      message: 'Wala pang field visit task para sa farmer na ito.',
                    )
                  else
                    ...detail.fieldVisitTasks.map(
                      (visit) => Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(visit.title),
                          subtitle: Text(
                            [
                              visit.purpose,
                              visit.scheduledFor,
                              visit.assignedTo,
                              if (visit.notes.isNotEmpty) visit.notes,
                            ].where((part) => part.isNotEmpty).join(' • '),
                          ),
                          trailing: _Pill(text: visit.status),
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: TextStyle(color: Colors.grey.shade600),
        ),
      ],
    );
  }
}

class _MetaLine extends StatelessWidget {
  const _MetaLine({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    if (value.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        '$label: $value',
        style: TextStyle(color: Colors.grey.shade700),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.text});

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
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.message});

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

class _DetailErrorState extends StatelessWidget {
  const _DetailErrorState({
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
            Text(message, textAlign: TextAlign.center),
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
