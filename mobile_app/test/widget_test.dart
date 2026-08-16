// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/main.dart';
import 'package:mobile_app/core/session_controller.dart';
import 'package:mobile_app/core/vendor_api.dart';

void main() {
  testWidgets('shows vendor sign in', (WidgetTester tester) async {
    await tester.pumpWidget(
      VondoVendorApp(
        controller: SessionController(
          VendorApi(baseUrl: 'http://localhost/api'),
        ),
        restoreSession: false,
      ),
    );

    expect(find.text('Vondo Vendor'), findsOneWidget);
    expect(find.text('Sign in to your restaurant'), findsOneWidget);
  });
}
