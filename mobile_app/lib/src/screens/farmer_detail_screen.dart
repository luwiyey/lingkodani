import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/models/mobile_models.dart';
import '../core/services/field_visit_location_service.dart';
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
  final FieldVisitLocationService _locationService =
      const FieldVisitLocationService();
  String? _visitActionId;

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

  Future<void> _handleVisitStatus(FieldVisitSummary visit) async {
    final appState = context.read<AppState>();
    final nextStatus = visit.status == 'scheduled' ? 'in_progress' : 'completed';

    setState(() {
      _visitActionId = visit.id;
    });

    try {
      final verification = await _locationService.captureVerification();
      final result = await appState.updateFieldVisitStatus(
        visitId: visit.id,
        status: nextStatus,
        verification: verification,
      );

      if (!mounted) {
        return;
      }

      final usedManualFallback =
          '${verification['status'] ?? ''}' == 'manual_only';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result.queued
                ? result.detail
                : usedManualFallback
                    ? 'Na-update ang visit, pero manual verification lang ang na-save dahil walang GPS lock.'
                    : 'Na-update ang field visit at naka-save ang GPS verification.',
          ),
        ),
      );

      if (!result.queued) {
        setState(() => _future = _load());
        await _future;
      }
    } catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$error')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _visitActionId = null;
        });
      }
    }
  }

  Future<void> _addFarmerNote() async {
    final appState = context.read<AppState>();
    final messenger = ScaffoldMessenger.of(context);
    final note = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _FarmerNoteActionSheet(),
    );

    if (note == null || note.trim().isEmpty) {
      return;
    }

    try {
      final result = await appState.addFarmerNote(
        farmerId: widget.farmerId,
        note: note.trim(),
      );

      if (!mounted) {
        return;
      }

      messenger.showSnackBar(
        SnackBar(
          content: Text(
            result.queued
                ? result.detail
                : 'Na-save ang tala para kay ${widget.title}.',
          ),
        ),
      );

      if (!result.queued) {
        setState(() => _future = _load());
        await _future;
      }
    } catch (error) {
      if (!mounted) {
        return;
      }

      messenger.showSnackBar(
        SnackBar(content: Text('$error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Magdagdag ng tala',
            onPressed: _addFarmerNote,
            icon: const Icon(Icons.note_add_outlined),
          ),
        ],
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
            final pendingFarmerNotes =
                appState.pendingActionsForFarmer(widget.farmerId);

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
                          _MetaLine(
                            label: 'Huling SMS activity',
                            value: farmer.lastSmsActivity,
                          ),
                          _MetaLine(
                            label: 'Registration date',
                            value: farmer.registrationDate,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const _SectionTitle(
                    title: 'Pinakahuling SMS',
                    subtitle:
                        'Makikita rito ang pinakabagong usapan at case status.',
                  ),
                  const SizedBox(height: 8),
                  if (detail.recentMessages.isEmpty)
                    const _EmptyCard(
                      message: 'Wala pang naka-link na SMS record.',
                    )
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
                  const _SectionTitle(
                    title: 'Tulong at serbisyo',
                    subtitle:
                        'Mga naitalang assistance, vouchers, o support entries.',
                  ),
                  const SizedBox(height: 8),
                  if (detail.assistanceRecords.isEmpty)
                    const _EmptyCard(
                      message:
                          'Wala pang assistance record para sa farmer na ito.',
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
                  const _SectionTitle(
                    title: 'Mga tala at obserbasyon',
                    subtitle:
                        'Mga field note at mahahalagang obserbasyon para sa farmer na ito.',
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: FilledButton.tonalIcon(
                      onPressed: _addFarmerNote,
                      icon: const Icon(Icons.note_add_outlined),
                      label: const Text('Magdagdag ng Tala'),
                    ),
                  ),
                  if (pendingFarmerNotes.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'May ${pendingFarmerNotes.length} pending note na isi-sync kapag bumalik ang signal.',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 8),
                            ...pendingFarmerNotes.map(
                              (action) => Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Text(
                                  action.lastError == null ||
                                          action.lastError!.isEmpty
                                      ? 'Queued note - attempts: ${action.attempts}'
                                      : 'Note retry needed - attempts: ${action.attempts} - ${action.lastError}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: action.lastError == null ||
                                            action.lastError!.isEmpty
                                        ? Colors.grey.shade700
                                        : Colors.red.shade700,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  if (detail.logbookEntries.isEmpty)
                    const _EmptyCard(
                      message: 'Wala pang note o logbook entry para sa farmer na ito.',
                    )
                  else
                    ...detail.logbookEntries.map(
                      (entry) => Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(entry.title),
                          subtitle: Text(
                            [
                              if (entry.type.isNotEmpty) entry.type,
                              if (entry.timestamp.isNotEmpty) entry.timestamp,
                              if (entry.description.isNotEmpty) entry.description,
                            ].join(' - '),
                          ),
                          trailing: const Icon(Icons.chevron_right_rounded),
                        ),
                      ),
                    ),
                  const SizedBox(height: 20),
                  const _SectionTitle(
                    title: 'Field visits',
                    subtitle:
                        'Mga naka-assign o natapos na pagbisita kaugnay ng concern.',
                  ),
                  const SizedBox(height: 8),
                  if (detail.fieldVisitTasks.isEmpty)
                    const _EmptyCard(
                      message:
                          'Wala pang field visit task para sa farmer na ito.',
                    )
                  else
                    ...detail.fieldVisitTasks.map((visit) {
                      final pendingVisitActions =
                          appState.pendingActionsForFieldVisit(visit.id);
                      final pendingVisitAction = pendingVisitActions.isEmpty
                          ? null
                          : pendingVisitActions.last;
                      final pendingPayloadStatus =
                          pendingVisitAction?.payload['status']?.toString() ?? '';
                      final pendingVerification =
                          pendingVisitAction?.payload['verification'];
                      final pendingVerificationStatus = pendingVerification is Map
                          ? '${pendingVerification['status'] ?? ''}'
                          : '';
                      final effectiveStatus = pendingPayloadStatus.isNotEmpty
                          ? pendingPayloadStatus
                          : visit.status;
                      final effectiveVerificationStatus =
                          pendingVerificationStatus.isNotEmpty
                              ? pendingVerificationStatus
                              : visit.verificationStatus;
                      final busy = _visitActionId == visit.id;
                      final actionBlocked = busy || pendingVisitAction != null;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  Text(
                                    visit.title,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16,
                                    ),
                                  ),
                                  _Pill(text: effectiveStatus),
                                  _Pill(
                                    text: effectiveVerificationStatus ==
                                            'gps_captured'
                                        ? 'GPS verified'
                                        : effectiveVerificationStatus ==
                                                'manual_only'
                                            ? 'Manual verification'
                                            : 'Unverified',
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                [
                                  visit.purpose,
                                  visit.scheduledFor,
                                  visit.assignedTo,
                                  if (visit.notes.isNotEmpty) visit.notes,
                                ].where((part) => part.isNotEmpty).join(' • '),
                                style: TextStyle(
                                  color: Colors.grey.shade700,
                                  height: 1.4,
                                ),
                              ),
                              if (visit.gpsVerified) ...[
                                const SizedBox(height: 8),
                                Text(
                                  [
                                    if (visit.verificationCapturedAt.isNotEmpty)
                                      'Captured ${visit.verificationCapturedAt}',
                                    if (visit.verificationAccuracyMeters != null)
                                      'accuracy ${visit.verificationAccuracyMeters!.round()}m',
                                    if (visit.verificationLat != null &&
                                        visit.verificationLng != null)
                                      '${visit.verificationLat!.toStringAsFixed(5)}, ${visit.verificationLng!.toStringAsFixed(5)}',
                                  ].join(' • '),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                              if (visit.manualVerification &&
                                  visit.verificationNote.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Text(
                                  visit.verificationNote,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                              if (pendingVisitAction != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  pendingVisitAction.lastError == null
                                      ? 'Pending visit sync • attempts: ${pendingVisitAction.attempts}'
                                      : 'Visit retry needed • attempts: ${pendingVisitAction.attempts} • ${pendingVisitAction.lastError}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: pendingVisitAction.lastError == null
                                        ? Colors.grey.shade700
                                        : Colors.red.shade700,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 12),
                              if (effectiveStatus != 'completed' &&
                                  effectiveStatus != 'cancelled')
                                FilledButton.tonal(
                                  onPressed: actionBlocked
                                      ? null
                                      : () => _handleVisitStatus(visit),
                                  child: Text(
                                    busy
                                        ? 'Ina-update...'
                                        : effectiveStatus == 'scheduled'
                                            ? 'Simulan ang visit'
                                            : 'Markahang tapos',
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _FarmerNoteActionSheet extends StatefulWidget {
  const _FarmerNoteActionSheet();

  @override
  State<_FarmerNoteActionSheet> createState() => _FarmerNoteActionSheetState();
}

class _FarmerNoteActionSheetState extends State<_FarmerNoteActionSheet> {
  final TextEditingController _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Magdagdag ng Tala',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                'I-save ang maikling obserbasyon, paalala, o field note para sa farmer na ito.',
                style: TextStyle(color: Colors.grey.shade700),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _controller,
                maxLines: 5,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: 'Ilagay ang tala o obserbasyon dito',
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Kanselahin'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () =>
                          Navigator.of(context).pop(_controller.text.trim()),
                      child: const Text('I-save ang Tala'),
                    ),
                  ),
                ],
              ),
            ],
          ),
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
