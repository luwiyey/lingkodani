// ignore_for_file: unused_element

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/models/mobile_models.dart';
import '../state/app_state.dart';
import 'farmer_detail_screen.dart';
import 'mobile_alerts_tab.dart';
import 'mobile_farmers_tab.dart';
import 'mobile_shared_widgets.dart';
import 'mobile_sms_feed_tab.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;

  Future<void> _syncPendingActions() async {
    final messenger = ScaffoldMessenger.of(context);
    final appState = context.read<AppState>();
    await appState.syncPendingActions();

    if (!mounted) {
      return;
    }

    final pendingCount = appState.pendingActionCount;
    messenger.showSnackBar(
      SnackBar(
        content: Text(
          pendingCount == 0
              ? 'Na-sync na ang lahat ng pending mobile actions.'
              : '$pendingCount mobile action pa ang naghihintay ng signal o retry.',
        ),
      ),
    );
  }

  void _openFarmerDetail(MobileSession session, FarmerSummary farmer) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => FarmerDetailScreen(
          session: session,
          farmerId: farmer.id,
          title: farmer.name,
        ),
      ),
    );
  }

  void _openFarmerDetailById(
    MobileSession session,
    String farmerId,
    String title,
  ) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => FarmerDetailScreen(
          session: session,
          farmerId: farmerId,
          title: title,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final profile = appState.profile!;

    final tabs = [
      _OverviewTab(session: appState.session!, profile: profile),
      MobileAlertsTab(
        session: appState.session!,
        onOpenFarmer: (farmerId, title) =>
            _openFarmerDetailById(appState.session!, farmerId, title),
        onOpenSms: () {
          setState(() {
            _currentIndex = 2;
          });
        },
      ),
      MobileSmsFeedTab(
        session: appState.session!,
        onOpenFarmer: (farmerId, title) =>
            _openFarmerDetailById(appState.session!, farmerId, title),
      ),
      MobileFarmersTab(
        session: appState.session!,
        onOpenFarmer: (farmer) => _openFarmerDetail(appState.session!, farmer),
      ),
      _KnowledgeTab(session: appState.session!),
    ];

    final titles = [
      'Overview',
      'Alerts',
      'SMS Feed',
      'Farmers',
      'Knowledge',
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(titles[_currentIndex]),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'I-sync ang pending actions',
            onPressed: appState.syncingPendingActions ? null : _syncPendingActions,
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  appState.syncingPendingActions
                      ? Icons.sync_rounded
                      : Icons.cloud_sync_outlined,
                ),
                if (appState.pendingActionCount > 0)
                  Positioned(
                    right: -6,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFB91C1C),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        '${appState.pendingActionCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    profile.name,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  if (appState.pendingActionCount > 0)
                    Text(
                      '${appState.pendingActionCount} pending sync',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  if (appState.pendingSyncError != null)
                    Text(
                      'May retry needed',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.red.shade700,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ),
          ),
          IconButton(
            tooltip: 'Mag-sign out',
            onPressed: () => context.read<AppState>().signOut(),
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: SafeArea(child: tabs[_currentIndex]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (nextIndex) {
          setState(() {
            _currentIndex = nextIndex;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded),
            label: 'Overview',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_none_rounded),
            selectedIcon: Icon(Icons.notifications_rounded),
            label: 'Alerts',
          ),
          NavigationDestination(
            icon: Icon(Icons.sms_outlined),
            selectedIcon: Icon(Icons.sms_rounded),
            label: 'SMS',
          ),
          NavigationDestination(
            icon: Icon(Icons.agriculture_outlined),
            selectedIcon: Icon(Icons.agriculture_rounded),
            label: 'Farmers',
          ),
          NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined),
            selectedIcon: Icon(Icons.auto_awesome_rounded),
            label: 'Knowledge',
          ),
        ],
      ),
    );
  }
}

class _OverviewTab extends StatefulWidget {
  const _OverviewTab({
    required this.session,
    required this.profile,
  });

  final MobileSession session;
  final MobileProfile profile;

  @override
  State<_OverviewTab> createState() => _OverviewTabState();
}

class _OverviewTabState extends State<_OverviewTab> {
  late Future<MobileOverview> _future;

  String _buildLastSyncLabel(AppState appState) {
    final syncAge = appState.timeSinceLastPendingSync;

    if (appState.syncingPendingActions) {
      return 'Sinusubukang i-sync ngayon ang pending mobile actions.';
    }

    if (syncAge == null) {
      return 'Wala pang naitatalang completed sync sa device na ito.';
    }

    if (syncAge.inMinutes < 1) {
      return 'Kakasagawa lang ng huling sync.';
    }

    return 'Huling sync: ${syncAge.inMinutes} minuto na ang nakalipas.';
  }

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<MobileOverview> _load() {
    return context.read<AppState>().api.fetchOverview(widget.session.idToken);
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return FutureBuilder<MobileOverview>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return _ErrorState(
            message: '${snapshot.error}',
            onRetry: () => setState(() => _future = _load()),
          );
        }

        final overview = snapshot.data!;

        return RefreshIndicator(
          onRefresh: () async {
            setState(() => _future = _load());
            await _future;
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Kamusta, ${widget.profile.name}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${widget.profile.title} • ${widget.profile.role}',
                style: TextStyle(color: Colors.grey.shade600),
              ),
              const SizedBox(height: 16),
              MobileSyncWatchCard(
                pendingCount: appState.pendingActionCount,
                retryNeededCount: appState.retryNeededCount,
                manualReviewCount: appState.manualReviewCount,
                longPendingCount: appState.longPendingCount,
                syncing: appState.syncingPendingActions,
                dataMayBeStale: appState.dataMayBeStale,
                lastSyncLabel: _buildLastSyncLabel(appState),
                errorMessage: appState.pendingSyncError,
              ),
              const SizedBox(height: 16),
              MobilePendingActionsCard(
                actions: appState.pendingActions,
                onSyncNow: appState.syncingPendingActions
                    ? null
                    : () {
                        appState.syncPendingActions();
                      },
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _MetricCard(
                    label: 'Farmers',
                    value: '${overview.summary.farmerCount}',
                    icon: Icons.people_alt_rounded,
                  ),
                  _MetricCard(
                    label: 'Pending approval',
                    value: '${overview.summary.pendingFarmerCount}',
                    icon: Icons.person_add_alt_1_rounded,
                  ),
                  _MetricCard(
                    label: 'Open cases',
                    value: '${overview.summary.openCaseCount}',
                    icon: Icons.inbox_rounded,
                  ),
                  _MetricCard(
                    label: 'High urgency',
                    value: '${overview.summary.highUrgencyCount}',
                    icon: Icons.warning_amber_rounded,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Text(
                'Pinakahuling mensahe',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              ...overview.recentMessages.map(
                (message) => Card(
                  child: ListTile(
                    title: Text(message.farmerName),
                    subtitle: Text(
                      message.message,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        _StatusChip(
                          text: message.urgency,
                          color: message.urgency == 'high'
                              ? Colors.red
                              : Colors.orange,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          message.caseStatus,
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 12,
                          ),
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

class _SmsFeedTab extends StatefulWidget {
  const _SmsFeedTab({required this.session});

  final MobileSession session;

  @override
  State<_SmsFeedTab> createState() => _SmsFeedTabState();
}

class _SmsFeedTabState extends State<_SmsFeedTab> {
  late Future<List<SmsFeedItem>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<SmsFeedItem>> _load() {
    return context.read<AppState>().api.fetchSmsFeed(widget.session.idToken);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<SmsFeedItem>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return _ErrorState(
            message: '${snapshot.error}',
            onRetry: () => setState(() => _future = _load()),
          );
        }

        final messages = snapshot.data!;

        return RefreshIndicator(
          onRefresh: () async {
            setState(() => _future = _load());
            await _future;
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: messages.length,
            itemBuilder: (context, index) {
              final message = messages[index];

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
                          _StatusChip(
                            text: message.urgency,
                            color: message.urgency == 'high'
                                ? Colors.red
                                : Colors.orange,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        message.message,
                        style: const TextStyle(fontSize: 15, height: 1.4),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _InfoChip(text: message.caseStatus),
                          _InfoChip(text: message.parsedIntent),
                          _InfoChip(text: message.status),
                          if (message.assignedTo.isNotEmpty)
                            _InfoChip(text: 'Owner: ${message.assignedTo}'),
                        ],
                      ),
                      if (message.aiAdvice.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Text(
                          'AI advice: ${message.aiAdvice}',
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                      ],
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

class _FarmersTab extends StatefulWidget {
  const _FarmersTab({required this.session});

  final MobileSession session;

  @override
  State<_FarmersTab> createState() => _FarmersTabState();
}

class _FarmersTabState extends State<_FarmersTab> {
  late Future<List<FarmerSummary>> _future;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<List<FarmerSummary>> _load([String query = '']) {
    return context.read<AppState>().api.fetchFarmers(
          widget.session.idToken,
          query: query,
        );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: const InputDecoration(
                    hintText: 'Hanapin ang farmer, sitio, o pananim',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.search_rounded),
                  ),
                  onSubmitted: (value) {
                    setState(() => _future = _load(value.trim()));
                  },
                ),
              ),
              const SizedBox(width: 12),
              FilledButton(
                onPressed: () {
                  setState(() => _future = _load(_searchController.text.trim()));
                },
                child: const Text('Hanap'),
              ),
            ],
          ),
        ),
        Expanded(
          child: FutureBuilder<List<FarmerSummary>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }

              if (snapshot.hasError) {
                return _ErrorState(
                  message: '${snapshot.error}',
                  onRetry: () => setState(() => _future = _load(_searchController.text.trim())),
                );
              }

              final farmers = snapshot.data!;

              return RefreshIndicator(
                onRefresh: () async {
                  setState(() => _future = _load(_searchController.text.trim()));
                  await _future;
                },
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: farmers.length,
                  itemBuilder: (context, index) {
                    final farmer = farmers[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFFE7F4E8),
                          child: Text(
                            farmer.name.isNotEmpty ? farmer.name[0].toUpperCase() : '?',
                            style: const TextStyle(
                              color: Color(0xFF2F7A3E),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        title: Text(farmer.name),
                        subtitle: Text(
                          [
                            if (farmer.sitio.isNotEmpty) farmer.sitio,
                            if (farmer.crops.isNotEmpty) farmer.crops.join(', '),
                            farmer.phone,
                          ].where((part) => part.isNotEmpty).join(' • '),
                        ),
                        trailing: _StatusChip(
                          text: farmer.status,
                          color: farmer.status == 'active' ? Colors.green : Colors.orange,
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _KnowledgeTab extends StatefulWidget {
  const _KnowledgeTab({required this.session});

  final MobileSession session;

  @override
  State<_KnowledgeTab> createState() => _KnowledgeTabState();
}

class _KnowledgeTabState extends State<_KnowledgeTab> {
  final _queryController = TextEditingController();
  bool _includeWebGrounding = true;
  bool _submitting = false;
  KnowledgeSearchResult? _result;
  String? _error;

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final query = _queryController.text.trim();
    if (query.isEmpty) {
      setState(() {
        _error = 'Ilagay ang search question.';
      });
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final result = await context.read<AppState>().api.searchKnowledge(
            widget.session.idToken,
            query: query,
            includeWebGrounding: _includeWebGrounding,
          );

      setState(() {
        _result = result;
      });
    } catch (error) {
      setState(() {
        _error = '$error';
      });
    } finally {
      setState(() {
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: _queryController,
          maxLines: 2,
          decoration: const InputDecoration(
            hintText: 'Halimbawa: Ano ang unang payo sa rice bug sa palay?',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Gamitin ang web grounding kung available'),
          subtitle: const Text(
            'Kasama ang lokal na knowledge at Gemini answer kapag configured.',
          ),
          value: _includeWebGrounding,
          onChanged: (value) {
            setState(() {
              _includeWebGrounding = value;
            });
          },
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: _submitting ? null : _search,
          icon: const Icon(Icons.auto_awesome_rounded),
          label: Text(_submitting ? 'Naghahanap...' : 'Maghanap'),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(
            _error!,
            style: const TextStyle(color: Color(0xFF991B1B)),
          ),
        ],
        if (_result != null) ...[
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _InfoChip(text: _result!.answerMode),
                      if (_result!.usedWebGrounding)
                        const _InfoChip(text: 'Web grounded'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _result!.directAnswer,
                    style: const TextStyle(fontSize: 16, height: 1.5),
                  ),
                  if (_result!.sources.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Sources',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    ..._result!.sources.map(
                      (source) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text(
                          '• ${source.kind.toUpperCase()}: ${source.title}',
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
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

class _StatusChip extends StatelessWidget {
  const _StatusChip({
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

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.text});

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

class _ErrorState extends StatelessWidget {
  const _ErrorState({
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
