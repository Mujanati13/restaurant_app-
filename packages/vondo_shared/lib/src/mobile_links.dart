enum VondoLinkTarget { home, menu, order, reservation, unknown }

class VondoDeepLink {
  const VondoDeepLink({required this.tenant, required this.target, this.resourceId});
  final String tenant;
  final VondoLinkTarget target;
  final int? resourceId;

  static VondoDeepLink? parse(Uri uri, {required String expectedTenant, Set<String> allowedHosts = const {}}) {
    final segments = uri.pathSegments.where((value) => value.isNotEmpty).toList();
    final explicitTenant = uri.queryParameters['restaurant'];
    if (uri.scheme == 'http' || uri.scheme == 'https') {
      final normalizedHosts = allowedHosts.map((value) => value.toLowerCase()).toSet();
      if (normalizedHosts.isNotEmpty && !normalizedHosts.contains(uri.host.toLowerCase())) return null;
      if (normalizedHosts.isEmpty && explicitTenant == null) return null;
    }
    final tenant = explicitTenant ?? (uri.scheme.startsWith('vondo-') ? uri.scheme.substring(6) : expectedTenant);
    if (tenant != expectedTenant) return null;
    if (segments.isEmpty) return VondoDeepLink(tenant: tenant, target: VondoLinkTarget.home);
    if (segments.first == 'menu') return VondoDeepLink(tenant: tenant, target: VondoLinkTarget.menu, resourceId: segments.length > 1 ? int.tryParse(segments[1]) : null);
    if (segments.first == 'account' && segments.length > 2 && segments[1] == 'orders') return VondoDeepLink(tenant: tenant, target: VondoLinkTarget.order, resourceId: int.tryParse(segments[2]));
    if (segments.first == 'reservations') return VondoDeepLink(tenant: tenant, target: VondoLinkTarget.reservation);
    return VondoDeepLink(tenant: tenant, target: VondoLinkTarget.unknown);
  }
}
