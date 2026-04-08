import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/models/mobile_models.dart';
import '../state/app_state.dart';
import 'mobile_shared_widgets.dart';

class MobileSmsFeedTab extends StatefulWidget {
  const MobileSmsFeedTab({
    super.key,
    required this.session,
    required this.onOpenFarmer,
  });

  final MobileSession session;
  final void Function(String farmerId, String title) onOpenFarmer;

  @override
  State<MobileSmsFeedTab> createState() => _MobileSmsFeedTabState();
}

class _MobileSmsFeedTabState extends State<MobileSmsFeedTab> {
  late Future<List<SmsFeedItem>> _future;
  String? _actionMessageId;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<SmsFeedItem>> _load() {
    return context.read<AppState>().api.fetchSmsFeed(widget.session.idToken);
  }

  Future<void> _sendReply(SmsFeedItem message) async {
    final appState = context.read<AppState>();
    final messenger = ScaffoldMessenger.of(context);
    final reply = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _ReplyActionSheet(message: message),
    );

    if (reply == null || reply.trim().isEmpty) {
      return;
    }

    final normalizedReply = reply.trim();
    final shouldMarkApproved =
        message.status == 'pending_approval' &&
        message.aiAdvice.trim().isNotEmpty &&
        normalizedReply == message.aiAdvice.trim();

    setState(() {
      _actionMessageId = message.id;
    });

    try {
      final result = await appState.sendSmsReply(
        messageId: message.id,
        reply: normalizedReply,
        status: shouldMarkApproved ? 'approved' : 'replied',
        expectedSyncVersion: message.syncVersion,
        parsedIntent: message.parsedIntent,
        urgency: message.urgency,
        safetyFlag: message.safetyFlag,
        tone: message.tone,
      );

      if (!mounted) {
        return;
      }

      messenger.showSnackBar(
        SnackBar(
          content: Text(
            result.queued
                ? result.detail
                : shouldMarkApproved
                ? 'Naaprubahan at naipadala ang payo kay ${message.farmerName}.'
                : 'Naipadala ang tugon kay ${message.farmerName}.',
          ),
        ),
      );
      if (!result.queued) {
        setState(() {
          _future = _load();
        });
        await _future;
      }
    } catch (error) {
      if (!mounted) {
        return;
      }

      messenger.showSnackBar(SnackBar(content: Text('$error')));
    } finally {
      if (mounted) {
        setState(() {
          _actionMessageId = null;
        });
      }
    }
  }

  Future<void> _requestResolution(SmsFeedItem message) async {
    final appState = context.read<AppState>();
    final messenger = ScaffoldMessenger.of(context);
    final note = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _ResolveActionSheet(message: message),
    );

    if (note == null) {
      return;
    }

    setState(() {
      _actionMessageId = message.id;
    });

    try {
      final result = await appState.requestResolutionConfirmation(
        messageId: message.id,
        note: note.trim(),
        expectedSyncVersion: message.syncVersion,
      );

      if (!mounted) {
        return;
      }

      messenger.showSnackBar(
        SnackBar(
          content: Text(
            result.queued
                ? result.detail
                : 'Naipadala ang YES/NO confirmation kay ${message.farmerName}.',
          ),
        ),
      );
      if (!result.queued) {
        setState(() {
          _future = _load();
        });
        await _future;
      }
    } catch (error) {
      if (!mounted) {
        return;
      }

      messenger.showSnackBar(SnackBar(content: Text('$error')));
    } finally {
      if (mounted) {
        setState(() {
          _actionMessageId = null;
        });
      }
    }
  }

  Future<void> _assignMessage(SmsFeedItem message) async {
    final appState = context.read<AppState>();
    final messenger = ScaffoldMessenger.of(context);

    setState(() {
      _actionMessageId = message.id;
    });

    try {
      final result = await appState.assignSmsMessage(
        messageId: message.id,
        expectedSyncVersion: message.syncVersion,
      );

      if (!mounted) {
        return;
      }

      messenger.showSnackBar(
        SnackBar(
          content: Text(
            result.queued
                ? result.detail
                : 'Naitalaga ang case kay ${widget.session.email}.',
          ),
        ),
      );
      if (!result.queued) {
        setState(() {
          _future = _load();
        });
        await _future;
      }
    } catch (error) {
      if (!mounted) {
        return;
      }

      messenger.showSnackBar(SnackBar(content: Text('$error')));
    } finally {
      if (mounted) {
        setState(() {
          _actionMessageId = null;
        });
      }
    }
  }

  String _buildLastSyncLabel(AppState appState) {
    final syncAge = appState.timeSinceLastPendingSync;

    if (appState.syncingPendingActions) {
      return 'Sinusubukang i-sync ngayon ang pending actions bago ma-refresh ang SMS feed.';
    }

    if (syncAge == null) {
      return 'Wala pang completed sync na naitala sa device na ito.';
    }

    if (syncAge.inMinutes < 1) {
      return 'Kakasagawa lang ng huling sync ng mobile actions.';
    }

    return 'Huling sync: ${syncAge.inMinutes} minuto na ang nakalipas.';
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return FutureBuilder<List<SmsFeedItem>>(
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

        final messages = snapshot.data!;

        return RefreshIndicator(
          onRefresh: () async {
            await appState.syncPendingActions();
            setState(() => _future = _load());
            await _future;
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: messages.length + 1,
            itemBuilder: (context, index) {
              if (index == 0) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: MobileSyncWatchCard(
                    pendingCount: appState.pendingActionCount,
                    retryNeededCount: appState.retryNeededCount,
                    manualReviewCount: appState.manualReviewCount,
                    longPendingCount: appState.longPendingCount,
                    syncing: appState.syncingPendingActions,
                    dataMayBeStale: appState.dataMayBeStale,
                    lastSyncLabel: _buildLastSyncLabel(appState),
                    errorMessage: appState.pendingSyncError,
                  ),
                );
              }

              final message = messages[index - 1];
              final actionBusy = _actionMessageId == message.id;
              final pendingActions = appState.pendingActionsForMessage(
                message.id,
              );

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              message.farmerName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          MobileStatusChip(
                            text: message.urgency,
                            color: message.urgency == 'high'
                                ? Colors.red
                                : Colors.orange,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (message.caseId.isNotEmpty)
                        Text(
                          message.caseId,
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      const SizedBox(height: 6),
                      Text(
                        message.message,
                        style: const TextStyle(fontSize: 15, height: 1.4),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          MobileInfoChip(text: message.caseStatus),
                          MobileInfoChip(text: message.parsedIntent),
                          MobileInfoChip(text: message.status),
                          for (final pendingAction in pendingActions)
                            MobileInfoChip(
                              text:
                                  pendingAction.type ==
                                      MobileQueuedActionType.smsReply
                                  ? 'Pending reply sync'
                                  : pendingAction.type ==
                                        MobileQueuedActionType.assignMessage
                                  ? 'Pending assign sync'
                                  : 'Pending resolve sync',
                            ),
                          if (message.assignedTo.isNotEmpty)
                            MobileInfoChip(
                              text: 'Owner: ${message.assignedTo}',
                            ),
                        ],
                      ),
                      if (pendingActions.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFCBD5E1)),
                          ),
                          child: Text(
                            'May ${pendingActions.length} pending mobile action na isi-sync kapag bumalik ang signal.',
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...pendingActions.map((pendingAction) {
                          final actionLabel =
                              pendingAction.type ==
                                  MobileQueuedActionType.smsReply
                              ? 'Reply'
                              : pendingAction.type ==
                                    MobileQueuedActionType.assignMessage
                              ? 'Assign'
                              : 'Resolve';
                          final hasError =
                              pendingAction.lastError != null &&
                              pendingAction.lastError!.isNotEmpty;
                          final hasConflict = pendingAction.hasConflict;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Text(
                              hasConflict
                                  ? '$actionLabel needs refresh - ${pendingAction.conflictSummary}'
                                  : hasError
                                  ? '$actionLabel retry needed - attempts: ${pendingAction.attempts} - ${pendingAction.lastError}'
                                  : '$actionLabel queued - attempts: ${pendingAction.attempts}',
                              style: TextStyle(
                                fontSize: 12,
                                color: hasConflict
                                    ? Colors.amber.shade900
                                    : hasError
                                    ? Colors.red.shade700
                                    : Colors.grey.shade700,
                              ),
                            ),
                          );
                        }),
                      ],
                      if (message.aiAdvice.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Text(
                          'AI draft: ${message.aiAdvice}',
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                      ],
                      if (message.caseOutcomeSummary.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(
                          'Outcome: ${message.caseOutcomeSummary}',
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                      ],
                      if (message.isAwaitingFarmerConfirmation) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF7ED),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFF59E0B)),
                          ),
                          child: const Text(
                            'Hinihintay pa ang YES o NO ng magsasaka bago tuluyang isara ang case.',
                          ),
                        ),
                      ],
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          if (message.canOpenFarmerDetail)
                            OutlinedButton.icon(
                              onPressed: () => widget.onOpenFarmer(
                                message.farmerId,
                                message.farmerName,
                              ),
                              icon: const Icon(Icons.person_outline_rounded),
                              label: const Text('Farmer'),
                            ),
                          FilledButton.icon(
                            onPressed: actionBusy
                                ? null
                                : () => _sendReply(message),
                            icon: actionBusy
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(Icons.send_rounded),
                            label: const Text('Reply'),
                          ),
                          FilledButton.tonalIcon(
                            onPressed:
                                actionBusy ||
                                    message.caseStatus == 'closed' ||
                                    message.assignedTo.isNotEmpty
                                ? null
                                : () => _assignMessage(message),
                            icon: const Icon(Icons.assignment_ind_outlined),
                            label: const Text('Assign'),
                          ),
                          FilledButton.tonalIcon(
                            onPressed:
                                actionBusy || message.caseStatus == 'closed'
                                ? null
                                : () => _requestResolution(message),
                            icon: const Icon(Icons.verified_outlined),
                            label: const Text('Resolve'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class _ReplyActionSheet extends StatefulWidget {
  const _ReplyActionSheet({required this.message});

  final SmsFeedItem message;

  @override
  State<_ReplyActionSheet> createState() => _ReplyActionSheetState();
}

class _ReplyActionSheetState extends State<_ReplyActionSheet> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.message.aiAdvice);
  }

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
                'Ipadala ang tugon',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                'Kapag kapareho ng AI draft ang ipinadala, ituturing itong approved draft. Kapag inedit mo, manual reply na ito.',
                style: TextStyle(color: Colors.grey.shade700),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _controller,
                maxLines: 6,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: 'Ilagay ang reply para sa magsasaka',
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  MobileInfoChip(text: widget.message.caseStatus),
                  MobileInfoChip(text: widget.message.parsedIntent),
                  MobileInfoChip(text: widget.message.urgency),
                ],
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
                      child: const Text('Ipadala'),
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

class _ResolveActionSheet extends StatefulWidget {
  const _ResolveActionSheet({required this.message});

  final SmsFeedItem message;

  @override
  State<_ResolveActionSheet> createState() => _ResolveActionSheetState();
}

class _ResolveActionSheetState extends State<_ResolveActionSheet> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: widget.message.caseOutcomeSummary.isNotEmpty
          ? widget.message.caseOutcomeSummary
          : 'Naresolba na ang concern batay sa follow-up ng barangay team.',
    );
  }

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
                'Humiling ng YES/NO confirmation',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                'Magpapadala ito ng SMS sa magsasaka para kumpirmahin kung resolved na talaga ang kaso.',
                style: TextStyle(color: Colors.grey.shade700),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _controller,
                maxLines: 4,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: 'Optional na tala bago magpadala ng confirmation',
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
                    child: FilledButton.tonal(
                      onPressed: () =>
                          Navigator.of(context).pop(_controller.text.trim()),
                      child: const Text('Ipadala ang YES/NO'),
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
