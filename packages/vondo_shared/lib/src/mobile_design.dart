import 'package:flutter/material.dart';
import 'tenant_theme.dart';

Color tenantColor(String? value, Color fallback) {
  final normalized = value?.replaceFirst('#', '');
  return normalized != null && RegExp(r'^[0-9a-fA-F]{6}$').hasMatch(normalized)
      ? Color(int.parse('ff$normalized', radix: 16)) : fallback;
}

ThemeData tenantThemeData(TenantTheme? theme, {Color fallbackPrimary = const Color(0xffc95028)}) {
  final primary = tenantColor(theme?.primary, fallbackPrimary);
  final surface = tenantColor(theme?.surface, Colors.white);
  final text = tenantColor(theme?.text, const Color(0xff29231f));
  return ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: primary, primary: primary, surface: surface, onSurface: text),
    scaffoldBackgroundColor: tenantColor(theme?.background, const Color(0xfffffaf6)),
    useMaterial3: true,
    cardTheme: const CardThemeData(elevation: 0),
    inputDecorationTheme: const InputDecorationTheme(filled: true,
      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(14)), borderSide: BorderSide.none)),
  );
}

class VondoAsyncState extends StatelessWidget {
  const VondoAsyncState({super.key, required this.message, this.icon = Icons.cloud_off_outlined, this.retry});
  final String message; final IconData icon; final VoidCallback? retry;
  @override Widget build(BuildContext context) => Center(child: Semantics(liveRegion: true, child: Padding(
    padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 46),
      const SizedBox(height: 12), Text(message, textAlign: TextAlign.center), if (retry != null) ...[const SizedBox(height: 16), OutlinedButton(onPressed: retry, child: const Text('Try again'))]]))));
}
