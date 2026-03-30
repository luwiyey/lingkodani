import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:lingkodani_mobile/src/screens/login_screen.dart';
import 'package:lingkodani_mobile/src/state/app_state.dart';

void main() {
  testWidgets('shows mobile login shell', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppState(),
        child: const MaterialApp(
          home: LoginScreen(),
        ),
      ),
    );

    expect(find.text('Lingkod-Ani Mobile'), findsOneWidget);
    expect(find.text('Mag-log in'), findsOneWidget);
  });
}
