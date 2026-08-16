import 'dart:async';
import 'package:flutter/material.dart';
import 'package:vondo_shared/vondo_shared.dart';

import 'core/models.dart';
import 'core/session_controller.dart';
import 'core/vendor_api.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(VondoVendorApp(controller: SessionController(VendorApi())));
}

class VondoVendorApp extends StatefulWidget {
  const VondoVendorApp({
    super.key,
    required this.controller,
    this.restoreSession = true,
  });

  final SessionController controller;
  final bool restoreSession;

  @override
  State<VondoVendorApp> createState() => _VondoVendorAppState();
}

class _VondoVendorAppState extends State<VondoVendorApp> {
  VondoMobileServices? _mobileServices;
  int _deepLinkIndex = 0;
  bool _pushSynced = false;

  @override
  void initState() {
    super.initState();
    if (widget.restoreSession) widget.controller.restore();
    _mobileServices = VondoMobileServices(
      tenant: widget.controller.api.restaurantKey,
      onLink: (link) { if (!mounted) return; setState(() => _deepLinkIndex = switch (link.target) {
        VondoLinkTarget.order => 1, VondoLinkTarget.reservation => 2, VondoLinkTarget.menu => 3, _ => 0 }); },
      onPushToken: (token, platform) async { if (widget.controller.api.session != null) {
        await widget.controller.api.registerPushToken(endpointPrefix: 'vendor', token: token, platform: platform,
          topics: ['restaurant.${widget.controller.api.restaurantKey}.operations']);
      } },
    );
    unawaited(_mobileServices!.start());
  }

  @override
  void dispose() {
    final service = _mobileServices;
    if (service != null) unawaited(service.dispose());
    widget.controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final configuration = widget.controller.bootstrapData?.brand;
    final sharedTheme = configuration == null ? null : TenantTheme(primary: configuration.primary,
      background: configuration.background, surface: configuration.surface, text: configuration.text);
    if (widget.controller.isSignedIn && !_pushSynced) { _pushSynced = true; final service = _mobileServices; if (service != null) unawaited(service.syncPushToken()); }
    if (!widget.controller.isSignedIn) _pushSynced = false;
    return MaterialApp(
      title:
          configuration?.name ??
          const String.fromEnvironment(
            'VONDO_APP_NAME',
            defaultValue: 'Vondo Vendor',
          ),
      debugShowCheckedModeBanner: false,
      theme: tenantThemeData(sharedTheme),
      home: AnimatedBuilder(
        animation: widget.controller,
        builder: (context, _) {
          if (widget.controller.restoring) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          return widget.controller.isSignedIn
              ? VendorShell(controller: widget.controller, initialIndex: _deepLinkIndex)
              : LoginPage(controller: widget.controller);
        },
      ),
    );
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.controller});
  final SessionController controller;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _hidePassword = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final success = await widget.controller.signIn(_email.text, _password.text);
    if (mounted && !success && widget.controller.error != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(widget.controller.error!)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = widget.controller.loading;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const CircleAvatar(
                      radius: 36,
                      backgroundColor: Color(0xffffe3d8),
                      child: Icon(
                        Icons.restaurant_rounded,
                        size: 40,
                        color: Color(0xffc95028),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Vondo Vendor',
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Run your restaurant from one calm, fast workspace.',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyLarge?.copyWith(color: Colors.black54),
                    ),
                    const SizedBox(height: 32),
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.username],
                      decoration: const InputDecoration(
                        labelText: 'Work email',
                        prefixIcon: Icon(Icons.mail_outline),
                      ),
                      validator: (value) =>
                          value == null || !value.contains('@')
                          ? 'Enter your work email.'
                          : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _password,
                      obscureText: _hidePassword,
                      autofillHints: const [AutofillHints.password],
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          onPressed: () =>
                              setState(() => _hidePassword = !_hidePassword),
                          tooltip: _hidePassword
                              ? 'Show password'
                              : 'Hide password',
                          icon: Icon(
                            _hidePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                      validator: (value) => value == null || value.isEmpty
                          ? 'Enter your password.'
                          : null,
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: busy ? null : _submit,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(54),
                      ),
                      child: busy
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Sign in to your restaurant'),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      'Use a staff account that has an assigned restaurant location.',
                      textAlign: TextAlign.center,
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class VendorShell extends StatefulWidget {
  const VendorShell({super.key, required this.controller, this.initialIndex = 0});
  final SessionController controller;
  final int initialIndex;

  @override
  State<VendorShell> createState() => _VendorShellState();
}

class _VendorShellState extends State<VendorShell> {
  late int _index = widget.initialIndex;

  @override
  void didUpdateWidget(covariant VendorShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialIndex != widget.initialIndex) _index = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    final capabilities = widget.controller.bootstrapData!;
    final pages = [
      DashboardPage(controller: widget.controller),
      capabilities.canManageOrders
          ? OrdersPage(controller: widget.controller)
          : const _AccessDeniedState(resource: 'orders'),
      capabilities.canManageReservations
          ? ReservationsPage(controller: widget.controller)
          : const _AccessDeniedState(resource: 'reservations'),
      capabilities.canManageMenus
          ? MenuPage(controller: widget.controller)
          : const _AccessDeniedState(resource: 'menu items'),
      MorePage(controller: widget.controller),
    ];
    final titles = ['Overview', 'Orders', 'Reservations', 'Menu', 'More'];
    return Scaffold(
      appBar: AppBar(
        title: Text(
          titles[_index],
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        actions: [
          Padding(
            padding: const EdgeInsetsDirectional.only(end: 8),
            child: _LocationMenu(controller: widget.controller),
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_seat_outlined),
            selectedIcon: Icon(Icons.event_seat),
            label: 'Bookings',
          ),
          NavigationDestination(
            icon: Icon(Icons.restaurant_menu_outlined),
            selectedIcon: Icon(Icons.restaurant_menu),
            label: 'Menu',
          ),
          NavigationDestination(
            icon: Icon(Icons.more_horiz),
            selectedIcon: Icon(Icons.more),
            label: 'More',
          ),
        ],
      ),
    );
  }
}

class _LocationMenu extends StatelessWidget {
  const _LocationMenu({required this.controller});
  final SessionController controller;

  @override
  Widget build(BuildContext context) {
    final locations = controller.bootstrapData!.locations;
    final selected = controller.selectedLocationId;
    return PopupMenuButton<int>(
      tooltip: 'Switch location',
      onSelected: controller.selectLocation,
      itemBuilder: (context) => locations
          .map(
            (location) => PopupMenuItem(
              value: location.id,
              child: Row(
                children: [
                  Icon(
                    location.id == selected
                        ? Icons.check_circle
                        : Icons.storefront_outlined,
                    size: 19,
                  ),
                  const SizedBox(width: 10),
                  Flexible(
                    child: Text(location.name, overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ),
          )
          .toList(),
      child: Chip(
        avatar: const Icon(Icons.storefront_outlined, size: 18),
        label: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 130),
          child: Text(
            controller.selectedLocation?.name ?? 'Location',
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }
}

abstract class _VendorPageState<T extends StatefulWidget> extends State<T> {
  SessionController get controller;
  String get token => controller.token!;
  int get locationId => controller.selectedLocationId!;

  void reportError(Object error) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
    );
  }
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key, required this.controller});
  final SessionController controller;

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends _VendorPageState<DashboardPage> {
  late Future<DashboardData> _future;
  @override
  SessionController get controller => widget.controller;
  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void didUpdateWidget(covariant DashboardPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _future = _load();
  }

  Future<DashboardData> _load() => controller.api.dashboard(token, locationId);

  Future<void> _refresh() async {
    final future = _load();
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<DashboardData>(
    future: _future,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const Center(child: CircularProgressIndicator());
      }
      if (snapshot.hasError) {
        return _RetryState(
          message: 'Could not load the overview.',
          onRetry: () => setState(() => _future = _load()),
        );
      }
      final data = snapshot.data!;
      return RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Good service starts here.',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              'Today at ${controller.selectedLocation?.name ?? ''}',
              style: const TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 18),
            _SalesCard(sales: data.sales),
            const SizedBox(height: 14),
            GridView.count(
              crossAxisCount: MediaQuery.sizeOf(context).width > 600 ? 4 : 2,
              childAspectRatio: 1.45,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              children: [
                _MetricCard(
                  icon: Icons.receipt_long,
                  label: 'Orders today',
                  value: '${data.ordersToday}',
                  color: const Color(0xfff6a623),
                ),
                _MetricCard(
                  icon: Icons.notifications_active,
                  label: 'Need action',
                  value: '${data.ordersWaiting}',
                  color: const Color(0xffc95028),
                ),
                _MetricCard(
                  icon: Icons.event_seat,
                  label: 'Bookings today',
                  value: '${data.reservationsToday}',
                  color: const Color(0xff4d8c77),
                ),
                _MetricCard(
                  icon: Icons.schedule,
                  label: 'Upcoming guests',
                  value: '${data.upcomingReservations}',
                  color: const Color(0xff6d67c8),
                ),
              ],
            ),
          ],
        ),
      );
    },
  );
}

class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key, required this.controller});
  final SessionController controller;
  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends _VendorPageState<OrdersPage> {
  late Future<List<VendorOrder>> _future;
  @override
  SessionController get controller => widget.controller;
  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void didUpdateWidget(covariant OrdersPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _future = _load();
  }

  Future<List<VendorOrder>> _load() => controller.api.orders(token, locationId);
  Future<void> _refresh() async {
    final future = _load();
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {}
  }

  Future<void> _changeStatus(VendorOrder order) async {
    final status = await _pickStatus(
      context,
      'Update ${order.number}',
      controller.bootstrapData!.orderStatuses
          .where((status) => status.id != order.statusId)
          .toList(),
    );
    if (status == null) return;
    try {
      await controller.api.updateOrderStatus(
        token,
        locationId,
        order.id,
        status.id,
      );
      if (mounted) setState(() => _future = _load());
    } catch (error) {
      reportError(error);
    }
  }

  @override
  Widget build(BuildContext context) => _AsyncList<VendorOrder>(
    future: _future,
    empty: 'No orders for this location yet.',
    onRefresh: _refresh,
    onRetry: () => setState(() => _future = _load()),
    itemBuilder: (context, order) => Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: () => _showOrderDetail(context, order),
        leading: CircleAvatar(
          backgroundColor: const Color(0xffffe3d8),
          child: Text(
            order.number.replaceFirst('#', ''),
            style: const TextStyle(
              color: Color(0xff9d371d),
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        title: Text(
          order.customerName,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          '${order.type} · ${order.itemsCount} item${order.itemsCount == 1 ? '' : 's'}\n${order.statusName}',
        ),
        isThreeLine: true,
        trailing: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${order.total.toStringAsFixed(2)} MAD',
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            OutlinedButton(
              onPressed: () => _changeStatus(order),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(0, 28),
                padding: const EdgeInsets.symmetric(horizontal: 10),
                visualDensity: VisualDensity.compact,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Status'),
            ),
          ],
        ),
      ),
    ),
  );
}

class ReservationsPage extends StatefulWidget {
  const ReservationsPage({super.key, required this.controller});
  final SessionController controller;
  @override
  State<ReservationsPage> createState() => _ReservationsPageState();
}

class _ReservationsPageState extends _VendorPageState<ReservationsPage> {
  late Future<List<VendorReservation>> _future;
  @override
  SessionController get controller => widget.controller;
  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void didUpdateWidget(covariant ReservationsPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _future = _load();
  }

  Future<List<VendorReservation>> _load() =>
      controller.api.reservations(token, locationId);
  Future<void> _refresh() async {
    final future = _load();
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {}
  }

  Future<void> _changeStatus(VendorReservation reservation) async {
    final status = await _pickStatus(
      context,
      'Update booking',
      controller.bootstrapData!.reservationStatuses
          .where((status) => status.id != reservation.statusId)
          .toList(),
    );
    if (status == null) return;
    try {
      await controller.api.updateReservationStatus(
        token,
        locationId,
        reservation.id,
        status.id,
      );
      if (mounted) setState(() => _future = _load());
    } catch (error) {
      reportError(error);
    }
  }

  @override
  Widget build(BuildContext context) => _AsyncList<VendorReservation>(
    future: _future,
    empty: 'No reservations found for this location.',
    onRefresh: _refresh,
    onRetry: () => setState(() => _future = _load()),
    itemBuilder: (context, reservation) => Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Color(0xffdceee7),
          child: Icon(Icons.event_seat, color: Color(0xff34745f)),
        ),
        title: Text(
          reservation.guestName,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          '${reservation.date} at ${reservation.time} · ${reservation.guests} guests\n${reservation.statusName}',
        ),
        isThreeLine: true,
        trailing: OutlinedButton(
          onPressed: () => _changeStatus(reservation),
          child: const Text('Status'),
        ),
      ),
    ),
  );
}

class MenuPage extends StatefulWidget {
  const MenuPage({super.key, required this.controller});
  final SessionController controller;
  @override
  State<MenuPage> createState() => _MenuPageState();
}

class _MenuPageState extends _VendorPageState<MenuPage> {
  late Future<List<VendorMenuItem>> _future;
  @override
  SessionController get controller => widget.controller;
  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void didUpdateWidget(covariant MenuPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _future = _load();
  }

  Future<List<VendorMenuItem>> _load() =>
      controller.api.menus(token, locationId);
  Future<void> _refresh() async {
    final future = _load();
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {}
  }

  Future<void> _toggle(VendorMenuItem menu, bool available) async {
    try {
      await controller.api.setMenuAvailability(
        token,
        locationId,
        menu.id,
        available,
      );
      if (mounted) setState(() => _future = _load());
    } catch (error) {
      reportError(error);
    }
  }

  @override
  Widget build(BuildContext context) => _AsyncList<VendorMenuItem>(
    future: _future,
    empty: 'No menu items found for this location.',
    onRefresh: _refresh,
    onRetry: () => setState(() => _future = _load()),
    header: const Card(
      margin: EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(Icons.info_outline),
        title: Text('Shared availability'),
        subtitle: Text(
          'Changing an item here affects every location that uses it.',
        ),
      ),
    ),
    itemBuilder: (context, menu) => Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: SwitchListTile(
        value: menu.isAvailable,
        onChanged: (value) => _toggle(menu, value),
        title: Text(
          menu.name,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          menu.description.isEmpty
              ? '${menu.price.toStringAsFixed(2)} MAD'
              : '${menu.description}\n${menu.price.toStringAsFixed(2)} MAD',
        ),
        isThreeLine: menu.description.isNotEmpty,
        secondary: Icon(
          menu.isAvailable ? Icons.check_circle : Icons.remove_circle_outline,
          color: menu.isAvailable ? const Color(0xff34745f) : Colors.black38,
        ),
      ),
    ),
  );
}

class MorePage extends StatelessWidget {
  const MorePage({super.key, required this.controller});
  final SessionController controller;
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      Card(
        child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.person)),
          title: Text(
            controller.bootstrapData!.staffName,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          subtitle: Text(controller.bootstrapData!.staffEmail),
        ),
      ),
      const SizedBox(height: 12),
      const Card(
        child: ListTile(
          leading: Icon(Icons.notifications_outlined),
          title: Text('Notifications'),
          subtitle: Text('Push alerts arrive in the next release.'),
        ),
      ),
      const SizedBox(height: 12),
      Card(
        child: ListTile(
          leading: const Icon(Icons.logout, color: Color(0xffc95028)),
          title: const Text('Sign out'),
          onTap: controller.logout,
        ),
      ),
    ],
  );
}

class _AsyncList<T> extends StatelessWidget {
  const _AsyncList({
    required this.future,
    required this.empty,
    required this.onRefresh,
    required this.onRetry,
    required this.itemBuilder,
    this.header,
  });
  final Future<List<T>> future;
  final String empty;
  final Future<void> Function() onRefresh;
  final VoidCallback onRetry;
  final Widget Function(BuildContext, T) itemBuilder;
  final Widget? header;
  @override
  Widget build(BuildContext context) => FutureBuilder<List<T>>(
    future: future,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const Center(child: CircularProgressIndicator());
      }
      if (snapshot.hasError) {
        return _RetryState(
          message: 'Could not load this page.',
          onRetry: onRetry,
        );
      }
      if (snapshot.data!.isEmpty) {
        return _EmptyState(message: empty, onRefresh: onRefresh);
      }
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: snapshot.data!.length + (header == null ? 0 : 1),
          itemBuilder: (context, index) {
            if (header != null && index == 0) return header!;
            final dataIndex = index - (header == null ? 0 : 1);
            return itemBuilder(context, snapshot.data![dataIndex]);
          },
        ),
      );
    },
  );
}

class _SalesCard extends StatelessWidget {
  const _SalesCard({required this.sales});
  final double sales;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: const Color(0xff29231f),
      borderRadius: BorderRadius.circular(22),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Processed sales', style: TextStyle(color: Colors.white70)),
        const SizedBox(height: 7),
        Text(
          '${sales.toStringAsFixed(2)} MAD',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 30,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    ),
  );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Colors.black54),
          ),
        ],
      ),
    ),
  );
}

class _RetryState extends StatelessWidget {
  const _RetryState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off_outlined, size: 44),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Try again'),
          ),
        ],
      ),
    ),
  );
}

class _AccessDeniedState extends StatelessWidget {
  const _AccessDeniedState({required this.resource});
  final String resource;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.lock_outline, size: 44),
          const SizedBox(height: 12),
          Text(
            'Your staff role cannot manage $resource.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message, required this.onRefresh});
  final String message;
  final Future<void> Function() onRefresh;
  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: onRefresh,
    child: ListView(
      children: [
        SizedBox(height: MediaQuery.sizeOf(context).height * .25),
        Center(
          child: Column(
            children: [
              const Icon(Icons.inbox_outlined, size: 46),
              const SizedBox(height: 12),
              Text(message),
            ],
          ),
        ),
      ],
    ),
  );
}

Future<VendorStatus?> _pickStatus(
  BuildContext context,
  String title,
  List<VendorStatus> statuses,
) => showModalBottomSheet<VendorStatus>(
  context: context,
  showDragHandle: true,
  builder: (context) => SafeArea(
    child: ListView(
      shrinkWrap: true,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
        ),
        ...statuses.map(
          (status) => ListTile(
            leading: const Icon(Icons.radio_button_checked),
            title: Text(status.name),
            onTap: () => Navigator.pop(context, status),
          ),
        ),
        const SizedBox(height: 12),
      ],
    ),
  ),
);

void _showOrderDetail(BuildContext context, VendorOrder order) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 4, 24, 24),
        child: ListView(
          shrinkWrap: true,
          children: [
            Text(
              '${order.number} - ${order.customerName}',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text('${order.type} - ${order.statusName}'),
            const Divider(height: 28),
            ...order.items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(item),
              ),
            ),
            if (order.comment != null && order.comment!.isNotEmpty) ...[
              const Divider(height: 28),
              Text('Note: ${order.comment}'),
            ],
            const SizedBox(height: 12),
            Text(
              '${order.total.toStringAsFixed(2)} MAD',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
            ),
          ],
        ),
      ),
    ),
  );
}
