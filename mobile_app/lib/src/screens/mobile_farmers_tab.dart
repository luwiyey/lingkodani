import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/models/mobile_models.dart';
import '../state/app_state.dart';
import 'mobile_shared_widgets.dart';

class MobileFarmersTab extends StatefulWidget {
  const MobileFarmersTab({
    super.key,
    required this.session,
    required this.onOpenFarmer,
  });

  final MobileSession session;
  final void Function(FarmerSummary farmer) onOpenFarmer;

  @override
  State<MobileFarmersTab> createState() => _MobileFarmersTabState();
}

class _MobileFarmersTabState extends State<MobileFarmersTab> {
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
                return MobileErrorState(
                  message: '${snapshot.error}',
                  onRetry: () => setState(
                    () => _future = _load(_searchController.text.trim()),
                  ),
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
                        onTap: () => widget.onOpenFarmer(farmer),
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
                          ].where((part) => part.isNotEmpty).join(' - '),
                        ),
                        trailing: MobileStatusChip(
                          text: farmer.status,
                          color: farmer.status == 'active'
                              ? Colors.green
                              : Colors.orange,
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
