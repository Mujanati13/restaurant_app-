String tenantStorageKey(String audience, String tenant, String purpose) {
  return 'vondo_${_segment(audience)}_${_segment(tenant)}_${_segment(purpose)}';
}

String _segment(String value) {
  final normalized = value.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9_-]'), '_');
  if (normalized.isEmpty) throw ArgumentError.value(value, 'value', 'Storage key segments cannot be empty.');
  return normalized;
}
