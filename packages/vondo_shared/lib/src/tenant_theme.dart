class TenantTheme {
  const TenantTheme({required this.primary, required this.background, required this.surface, required this.text});

  final String primary;
  final String background;
  final String surface;
  final String text;

  factory TenantTheme.fromBrand(Map<String, dynamic>? brand) {
    final theme = Map<String, dynamic>.from((brand?['theme'] as Map?) ?? const {});
    return TenantTheme(
      primary: _hex(theme['primary'], '#c95028'),
      background: _hex(theme['background'], '#fffaf6'),
      surface: _hex(theme['surface'], '#ffffff'),
      text: _hex(theme['text'], '#29231f'),
    );
  }

  static String _hex(Object? value, String fallback) {
    final candidate = value is String ? value : '';
    return RegExp(r'^#[0-9a-fA-F]{6}$').hasMatch(candidate) ? candidate : fallback;
  }
}
