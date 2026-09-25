import 'package:flutter/material.dart';
import 'tenant_theme.dart';

Color tenantColor(String? value, Color fallback) {
  final normalized = value?.replaceFirst('#', '');
  return normalized != null && RegExp(r'^[0-9a-fA-F]{6}$').hasMatch(normalized)
      ? Color(int.parse('ff$normalized', radix: 16))
      : fallback;
}

/// The shared mobile expression of the Deliveriano storefront.
///
/// Restaurants can still provide their own brand colour, while spacing,
/// typography, surfaces and interaction states remain familiar across apps.
ThemeData tenantThemeData(
  TenantTheme? theme, {
  Color fallbackPrimary = const Color(0xff00c66b),
}) {
  final primary = tenantColor(theme?.primary, fallbackPrimary);
  final surface = tenantColor(theme?.surface, Colors.white);
  final text = tenantColor(theme?.text, const Color(0xff191514));
  final scheme = ColorScheme.fromSeed(
    seedColor: primary,
    primary: primary,
    surface: surface,
    onSurface: text,
    brightness: Brightness.light,
  );
  return ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: tenantColor(
      theme?.background,
      const Color(0xfffffbf8),
    ),
    useMaterial3: true,
    fontFamily: 'Roboto',
    appBarTheme: AppBarTheme(
      backgroundColor: surface,
      foregroundColor: text,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: text,
        fontSize: 19,
        fontWeight: FontWeight.w800,
        letterSpacing: -.35,
      ),
    ),
    cardTheme: CardThemeData(
      color: surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: text.withValues(alpha: .09)),
      ),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: surface,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      dragHandleColor: text.withValues(alpha: .2),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 72,
      backgroundColor: surface,
      surfaceTintColor: Colors.transparent,
      indicatorColor: primary.withValues(alpha: .14),
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => TextStyle(
          fontSize: 11,
          fontWeight: states.contains(WidgetState.selected)
              ? FontWeight.w800
              : FontWeight.w600,
          color: states.contains(WidgetState.selected)
              ? text
              : text.withValues(alpha: .58),
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          color: states.contains(WidgetState.selected)
              ? primary
              : text.withValues(alpha: .58),
        ),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        minimumSize: const Size(0, 52),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: text,
        minimumSize: const Size(0, 48),
        side: BorderSide(color: text.withValues(alpha: .18)),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(fontWeight: FontWeight.w800),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xfff5f4f2),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      labelStyle: TextStyle(color: text.withValues(alpha: .68)),
      hintStyle: TextStyle(color: text.withValues(alpha: .48)),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: BorderSide(color: text.withValues(alpha: .12)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: BorderSide(color: text.withValues(alpha: .12)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: BorderSide(color: primary, width: 2),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: const Color(0xfff5f4f2),
      selectedColor: primary.withValues(alpha: .14),
      side: BorderSide(color: text.withValues(alpha: .1)),
      shape: const StadiumBorder(),
      labelStyle: TextStyle(color: text, fontWeight: FontWeight.w700),
    ),
    dividerTheme: DividerThemeData(color: text.withValues(alpha: .1), space: 1),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: const Color(0xff201d1a),
      contentTextStyle: const TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.w600,
      ),
      behavior: SnackBarBehavior.floating,
      shape: const StadiumBorder(),
    ),
  );
}

class VondoAsyncState extends StatelessWidget {
  const VondoAsyncState({
    super.key,
    required this.message,
    this.icon = Icons.cloud_off_outlined,
    this.retry,
  });
  final String message;
  final IconData icon;
  final VoidCallback? retry;
  @override
  Widget build(BuildContext context) => Center(
    child: Semantics(
      liveRegion: true,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 46),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            if (retry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton(onPressed: retry, child: const Text('Try again')),
            ],
          ],
        ),
      ),
    ),
  );
}
