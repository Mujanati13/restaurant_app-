import 'package:test/test.dart';
import 'package:vondo_shared/vondo_shared.dart';

void main() {
  test('theme rejects unsafe colors and storage keys are tenant scoped', () {
    final theme = TenantTheme.fromBrand({'theme': {'primary': 'red', 'text': '#010203'}});
    expect(theme.primary, '#c95028');
    expect(theme.text, '#010203');
    expect(tenantStorageKey('customer', 'Tenant A', 'token'), 'vondo_customer_tenant_a_token');
    expect(tenantStorageKey('customer', 'Tenant B', 'token'), isNot(tenantStorageKey('customer', 'Tenant A', 'token')));
  });

  test('deep links reject another tenant and map supported destinations', () {
    final order = VondoDeepLink.parse(Uri.parse('https://foodly.test/account/orders/42?restaurant=foodly'), expectedTenant: 'foodly');
    expect(order?.target, VondoLinkTarget.order);
    expect(order?.resourceId, 42);
    expect(VondoDeepLink.parse(Uri.parse('vondo-other://menu/7'), expectedTenant: 'foodly'), isNull);
    expect(VondoDeepLink.parse(Uri.parse('https://other.test/menu/7'), expectedTenant: 'foodly', allowedHosts: {'foodly.test'}), isNull);
    expect(VondoDeepLink.parse(Uri.parse('https://foodly.test/menu/7'), expectedTenant: 'foodly', allowedHosts: {'foodly.test'})?.target, VondoLinkTarget.menu);
    expect(VondoDeepLink.parse(Uri.parse('https://foodly.test/menu/7'), expectedTenant: 'foodly'), isNull);
  });
}
