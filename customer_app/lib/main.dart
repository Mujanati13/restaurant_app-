import 'dart:async';
import 'package:flutter/material.dart';
import 'package:vondo_shared/vondo_shared.dart';

import 'core/app_controller.dart';
import 'core/customer_api.dart';
import 'core/models.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(VondoCustomerApp(controller: AppController(CustomerApi())));
}

class VondoCustomerApp extends StatefulWidget {
  const VondoCustomerApp({super.key, required this.controller});
  final AppController controller;

  @override
  State<VondoCustomerApp> createState() => _VondoCustomerAppState();
}

class _VondoCustomerAppState extends State<VondoCustomerApp> {
  VondoMobileServices? _mobileServices;
  int _deepLinkIndex = 0;
  bool _pushSynced = false;

  @override
  void initState() {
    super.initState();
    _mobileServices = VondoMobileServices(tenant: widget.controller.api.restaurantKey,
      onLink: (link) { if (!mounted) return; setState(() => _deepLinkIndex = switch (link.target) {
        VondoLinkTarget.menu => 0, VondoLinkTarget.order => 2, VondoLinkTarget.reservation => 3, _ => 0 }); },
      onPushToken: (token, platform) async { if (widget.controller.api.session != null) {
        await widget.controller.api.registerPushToken(endpointPrefix: 'storefront', token: token, platform: platform,
          topics: ['restaurant.${widget.controller.api.restaurantKey}.customer']);
      } });
    unawaited(_mobileServices!.start());
  }

  @override
  void dispose() { final service = _mobileServices; if (service != null) unawaited(service.dispose()); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: widget.controller,
    builder: (context, _) {
      final controller = widget.controller;
      if (controller.signedIn && !_pushSynced) { _pushSynced = true; final service = _mobileServices; if (service != null) unawaited(service.syncPushToken()); }
      if (!controller.signedIn) _pushSynced = false;
      final brand = controller.brand;
      final sharedTheme = brand == null ? null : TenantTheme(primary: brand.primary,
        background: brand.background, surface: brand.surface, text: brand.text);
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        title: brand?.name ?? 'Vondo',
        theme: tenantThemeData(sharedTheme),
        home: CustomerShell(controller: controller, initialIndex: _deepLinkIndex),
      );
    },
  );
}

class CustomerShell extends StatefulWidget {
  const CustomerShell({super.key, required this.controller, this.initialIndex = 0});
  final AppController controller;
  final int initialIndex;

  @override
  State<CustomerShell> createState() => _CustomerShellState();
}

class _CustomerShellState extends State<CustomerShell> {
  late int index = widget.initialIndex;

  @override
  void didUpdateWidget(covariant CustomerShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialIndex != widget.initialIndex) index = widget.initialIndex;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.controller.initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = widget.controller;
    if (controller.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (controller.brand == null) {
      return Scaffold(
        body: RetryState(
          message: controller.error ?? 'Restaurant configuration unavailable.',
          retry: controller.initialize,
        ),
      );
    }

    final pages = [
      MenuPage(controller: controller),
      CartPage(
        controller: controller,
        onOrdered: () => setState(() => index = 2),
      ),
      OrdersPage(controller: controller),
      BookingsPage(controller: controller),
      AccountPage(controller: controller),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          controller.brand!.name,
          style: const TextStyle(fontWeight: FontWeight.w900),
        ),
        actions: [
          IconButton(
            onPressed: () => setState(() => index = 1),
            icon: Badge(
              label: Text('${controller.cartCount}'),
              isLabelVisible: controller.cartCount > 0,
              child: const Icon(Icons.shopping_bag_outlined),
            ),
          ),
        ],
      ),
      body: IndexedStack(index: index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.restaurant_menu),
            label: 'Menu',
          ),
          NavigationDestination(
            icon: Icon(Icons.shopping_bag_outlined),
            label: 'Cart',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            label: 'Orders',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_seat_outlined),
            label: 'Bookings',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}

class MenuPage extends StatelessWidget {
  const MenuPage({super.key, required this.controller});
  final AppController controller;

  @override
  Widget build(BuildContext context) {
    if (controller.menus.isEmpty) {
      return const EmptyState(
        icon: Icons.restaurant_menu,
        message: 'The menu is being prepared.',
      );
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth > 900
            ? 4
            : constraints.maxWidth > 600
            ? 3
            : 2;
        return RefreshIndicator(
          onRefresh: controller.initialize,
          child: GridView.builder(
            padding: const EdgeInsets.all(14),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: .72,
            ),
            itemCount: controller.menus.length,
            itemBuilder: (context, index) {
              final menu = controller.menus[index];
              return MenuCard(
                menu: menu,
                symbol: controller.brand!.currencySymbol,
                add: () => showMenuConfiguration(context, controller, menu),
              );
            },
          ),
        );
      },
    );
  }
}

class MenuCard extends StatelessWidget {
  const MenuCard({
    super.key,
    required this.menu,
    required this.symbol,
    required this.add,
  });
  final MenuItem menu;
  final String symbol;
  final VoidCallback add;

  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: menu.image == null
              ? ColoredBox(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  child: const Icon(Icons.restaurant, size: 42),
                )
              : Image.network(
                  menu.image!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const ColoredBox(
                    color: Color(0xffffe7db),
                    child: Icon(Icons.restaurant, size: 42),
                  ),
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                menu.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                menu.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '$symbol${menu.price.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.w900),
                    ),
                  ),
                  IconButton.filled(
                    onPressed: add,
                    tooltip: 'Add to cart',
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

Future<void> showMenuConfiguration(
  BuildContext context,
  AppController controller,
  MenuItem summary,
) async {
  MenuItem menu;
  try {
    menu = await controller.api.menu(summary.id);
  } catch (error) {
    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    }
    return;
  }
  if (!context.mounted) return;
  if (menu.options.isEmpty) {
    controller.add(menu);
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('${menu.name} added to your cart.')));
    return;
  }

  final selected = <int, Map<int, int>>{
    for (final group in menu.options)
      group.id: {
        for (final value in group.values.where((value) => value.isDefault))
          value.id: 1,
      },
  };
  String? validationError;
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setState) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: ListView(
            shrinkWrap: true,
            children: [
              Text(
                menu.name,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              if (menu.description.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(menu.description),
              ],
              const SizedBox(height: 14),
              ...menu.options.map((group) {
                final quantities = selected[group.id]!;
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${group.name}${group.required ? ' *' : ''}',
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                        if (group.minSelected > 0 || group.maxSelected > 0)
                          Text(
                            'Choose ${group.minSelected > 0 ? 'at least ${group.minSelected}' : ''}${group.minSelected > 0 && group.maxSelected > 0 ? ', ' : ''}${group.maxSelected > 0 ? 'up to ${group.maxSelected}' : ''}.',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        const SizedBox(height: 8),
                        ...group.values.map((value) {
                          final quantity = quantities[value.id] ?? 0;
                          final price = value.price == 0
                              ? ''
                              : ' (+${controller.brand!.currencySymbol}${value.price.toStringAsFixed(2)})';
                          if (group.displayType == 'quantity') {
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text('${value.name}$price'),
                              trailing: Wrap(
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  IconButton(
                                    onPressed: quantity == 0
                                        ? null
                                        : () => setState(() {
                                            if (quantity == 1) {
                                              quantities.remove(value.id);
                                            } else {
                                              quantities[value.id] =
                                                  quantity - 1;
                                            }
                                          }),
                                    icon: const Icon(Icons.remove),
                                  ),
                                  Text(
                                    '$quantity',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  IconButton(
                                    onPressed: () => setState(
                                      () => quantities[value.id] = quantity + 1,
                                    ),
                                    icon: const Icon(Icons.add),
                                  ),
                                ],
                              ),
                            );
                          }
                          return CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            value: quantity > 0,
                            title: Text('${value.name}$price'),
                            onChanged: (checked) => setState(() {
                              if (checked == true) {
                                if (group.singleSelect) quantities.clear();
                                quantities[value.id] = 1;
                              } else {
                                quantities.remove(value.id);
                              }
                            }),
                          );
                        }),
                      ],
                    ),
                  ),
                );
              }),
              if (validationError != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(
                    validationError!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
              FilledButton.icon(
                onPressed: () {
                  for (final group in menu.options) {
                    final quantities = selected[group.id]!;
                    final count = group.displayType == 'quantity'
                        ? quantities.values.fold(
                            0,
                            (sum, quantity) => sum + quantity,
                          )
                        : quantities.length;
                    if ((group.required && count == 0) ||
                        (group.minSelected > 0 && count < group.minSelected) ||
                        (group.maxSelected > 0 && count > group.maxSelected)) {
                      setState(
                        () => validationError =
                            'Check your selection for ${group.name}.',
                      );
                      return;
                    }
                  }
                  final selections = menu.options
                      .where((group) => selected[group.id]!.isNotEmpty)
                      .map(
                        (group) => CartOptionSelection(
                          group: group,
                          quantities: selected[group.id]!,
                        ),
                      )
                      .toList();
                  controller.add(menu, selections);
                  Navigator.pop(sheetContext);
                },
                icon: const Icon(Icons.add_shopping_cart),
                label: Text(
                  'Add · ${controller.brand!.currencySymbol}${(menu.price + menu.options.fold<double>(0, (sum, group) => sum + CartOptionSelection(group: group, quantities: selected[group.id]!).total)).toStringAsFixed(2)}',
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class CartPage extends StatelessWidget {
  const CartPage({
    super.key,
    required this.controller,
    required this.onOrdered,
  });
  final AppController controller;
  final VoidCallback onOrdered;

  @override
  Widget build(BuildContext context) {
    if (controller.cart.isEmpty) {
      return const EmptyState(
        icon: Icons.shopping_bag_outlined,
        message: 'Your cart is empty.',
      );
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ...controller.cart.map(
          (line) => Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: ListTile(
              title: Text(
                line.menu.name,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: Text(
                [
                  ...line.options.map(
                    (option) => '${option.group.name}: ${option.label}',
                  ),
                  '${controller.brand!.currencySymbol}${line.total.toStringAsFixed(2)}',
                ].join('\n'),
              ),
              trailing: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  IconButton(
                    onPressed: () =>
                        controller.quantity(line, line.quantity - 1),
                    icon: const Icon(Icons.remove),
                  ),
                  Text(
                    '${line.quantity}',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  IconButton(
                    onPressed: () =>
                        controller.quantity(line, line.quantity + 1),
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
            ),
          ),
        ),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      '${controller.brand!.currencySymbol}${controller.total.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: controller.signedIn
                      ? () => showCheckout(context, controller, onOrdered)
                      : () => ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Open Account and sign in first.'),
                          ),
                        ),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                  ),
                  icon: const Icon(Icons.lock_outline),
                  label: Text(
                    controller.signedIn
                        ? 'Continue to checkout'
                        : 'Sign in to checkout',
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

Future<void> showCheckout(
  BuildContext context,
  AppController controller,
  VoidCallback onOrdered,
) async {
  final formKey = GlobalKey<FormState>();
  final first = TextEditingController();
  final last = TextEditingController();
  final phone = TextEditingController();
  final address = TextEditingController();
  final city = TextEditingController();
  final postcode = TextEditingController();
  var locationId = controller.locations.firstOrNull?.id;
  var orderType = 'collection';
  var busy = false;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setState) => SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            0,
            20,
            MediaQuery.viewInsetsOf(context).bottom + 20,
          ),
          child: Form(
            key: formKey,
            child: ListView(
              shrinkWrap: true,
              children: [
                Text(
                  orderType == 'delivery'
                      ? 'Delivery details'
                      : 'Collection details',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 16),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(
                      value: 'collection',
                      label: Text('Collection'),
                      icon: Icon(Icons.storefront_outlined),
                    ),
                    ButtonSegment(
                      value: 'delivery',
                      label: Text('Delivery'),
                      icon: Icon(Icons.delivery_dining_outlined),
                    ),
                  ],
                  selected: {orderType},
                  onSelectionChanged: (value) =>
                      setState(() => orderType = value.first),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: first,
                  decoration: const InputDecoration(labelText: 'First name'),
                  validator: requiredField,
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: last,
                  decoration: const InputDecoration(labelText: 'Last name'),
                  validator: requiredField,
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Phone'),
                  validator: requiredField,
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<int>(
                  initialValue: locationId,
                  decoration: InputDecoration(
                    labelText: orderType == 'delivery'
                        ? 'Preparing branch'
                        : 'Pickup branch',
                  ),
                  items: controller.locations
                      .map(
                        (location) => DropdownMenuItem(
                          value: location.id,
                          child: Text(location.name),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => locationId = value,
                  validator: (value) =>
                      value == null ? 'Choose a branch.' : null,
                ),
                if (orderType == 'delivery') ...[
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: address,
                    decoration: const InputDecoration(labelText: 'Address'),
                    validator: requiredField,
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: city,
                    decoration: const InputDecoration(labelText: 'City'),
                    validator: requiredField,
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: postcode,
                    decoration: const InputDecoration(labelText: 'Postcode'),
                    validator: requiredField,
                  ),
                ],
                const SizedBox(height: 18),
                FilledButton(
                  onPressed: busy
                      ? null
                      : () async {
                          if (!formKey.currentState!.validate()) return;
                          setState(() => busy = true);
                          try {
                            await controller.api.createOrder(
                              controller.token!,
                              locationId: locationId!,
                              firstName: first.text,
                              lastName: last.text,
                              phone: phone.text,
                              lines: controller.cart,
                              orderType: orderType,
                              address: orderType == 'delivery'
                                  ? {
                                      'address_1': address.text,
                                      'city': city.text,
                                      'postcode': postcode.text,
                                      'country_id':
                                          controller.brand!.defaultCountryId,
                                    }
                                  : null,
                            );
                            await controller.clearCart();
                            if (sheetContext.mounted) {
                              Navigator.pop(sheetContext);
                            }
                            onOrdered();
                          } catch (error) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(error.toString())),
                              );
                            }
                            setState(() => busy = false);
                          }
                        },
                  child: Text(busy ? 'Placing order…' : 'Confirm order'),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
  first.dispose();
  last.dispose();
  phone.dispose();
}

class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key, required this.controller});
  final AppController controller;

  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  Future<List<CustomerOrder>>? future;

  void load() {
    future = widget.controller.signedIn
        ? widget.controller.api.orders(widget.controller.token!)
        : null;
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void didUpdateWidget(covariant OrdersPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    load();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.controller.signedIn) {
      return const EmptyState(
        icon: Icons.lock_outline,
        message: 'Sign in to see your orders.',
      );
    }
    return FutureBuilder<List<CustomerOrder>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return RetryState(
            message: snapshot.error.toString(),
            retry: () => setState(load),
          );
        }
        if (snapshot.data!.isEmpty) {
          return const EmptyState(
            icon: Icons.receipt_long_outlined,
            message: 'No orders yet.',
          );
        }
        return RefreshIndicator(
          onRefresh: () async => setState(load),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: snapshot.data!.length,
            itemBuilder: (context, index) {
              final order = snapshot.data![index];
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ExpansionTile(
                  title: Text(
                    'Order #${order.id}',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  subtitle: Text(order.status),
                  trailing: Text(
                    '${widget.controller.brand!.currencySymbol}${order.total.toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  children: [
                    ...order.items.map(
                      (item) => ListTile(dense: true, title: Text(item)),
                    ),
                    if (order.timeline.isNotEmpty) const Divider(),
                    if (order.timeline.isNotEmpty)
                      const ListTile(
                        dense: true,
                        title: Text(
                          'Order progress',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ...order.timeline.map(
                      (event) => ListTile(
                        dense: true,
                        leading: const Icon(Icons.check_circle_outline),
                        title: Text(event.status),
                        subtitle: Text(
                          [
                            if ((event.comment ?? '').isNotEmpty)
                              event.comment!,
                            event.createdAt,
                          ].join('\n'),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class BookingsPage extends StatefulWidget {
  const BookingsPage({super.key, required this.controller});
  final AppController controller;

  @override
  State<BookingsPage> createState() => _BookingsPageState();
}

class _BookingsPageState extends State<BookingsPage> {
  Future<List<CustomerReservation>>? future;

  void load() {
    future = widget.controller.signedIn
        ? widget.controller.api.reservations(widget.controller.token!)
        : null;
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void didUpdateWidget(covariant BookingsPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    load();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.controller.signedIn) {
      return const EmptyState(
        icon: Icons.lock_outline,
        message: 'Sign in to manage bookings.',
      );
    }
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () =>
            showReservation(context, widget.controller, () => setState(load)),
        icon: const Icon(Icons.add),
        label: const Text('Reserve'),
      ),
      body: FutureBuilder<List<CustomerReservation>>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return RetryState(
              message: snapshot.error.toString(),
              retry: () => setState(load),
            );
          }
          if (snapshot.data!.isEmpty) {
            return const EmptyState(
              icon: Icons.event_seat_outlined,
              message: 'No reservations yet.',
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: snapshot.data!.length,
            itemBuilder: (context, index) {
              final reservation = snapshot.data![index];
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.event_seat)),
                  title: Text(
                    '${reservation.date} at ${reservation.time}',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  subtitle: Text(
                    '${reservation.location} · ${reservation.status}',
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

Future<void> showReservation(
  BuildContext context,
  AppController controller,
  VoidCallback onSaved,
) async {
  final formKey = GlobalKey<FormState>();
  final first = TextEditingController();
  final last = TextEditingController();
  final phone = TextEditingController();
  final date = TextEditingController(
    text: DateTime.now()
        .add(const Duration(days: 1))
        .toIso8601String()
        .split('T')
        .first,
  );
  final time = TextEditingController(text: '19:00');
  var locationId = controller.locations.first.id;
  var guests = 2;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (sheetContext) => SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          0,
          20,
          MediaQuery.viewInsetsOf(sheetContext).bottom + 20,
        ),
        child: Form(
          key: formKey,
          child: ListView(
            shrinkWrap: true,
            children: [
              Text(
                'Reserve a table',
                style: Theme.of(sheetContext).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: first,
                decoration: const InputDecoration(labelText: 'First name'),
                validator: requiredField,
              ),
              const SizedBox(height: 9),
              TextFormField(
                controller: last,
                decoration: const InputDecoration(labelText: 'Last name'),
                validator: requiredField,
              ),
              const SizedBox(height: 9),
              TextFormField(
                controller: phone,
                decoration: const InputDecoration(labelText: 'Phone'),
                validator: requiredField,
              ),
              const SizedBox(height: 9),
              DropdownButtonFormField<int>(
                initialValue: locationId,
                decoration: const InputDecoration(labelText: 'Location'),
                items: controller.locations
                    .map(
                      (location) => DropdownMenuItem(
                        value: location.id,
                        child: Text(location.name),
                      ),
                    )
                    .toList(),
                onChanged: (value) => locationId = value!,
              ),
              const SizedBox(height: 9),
              DropdownButtonFormField<int>(
                initialValue: guests,
                decoration: const InputDecoration(labelText: 'Guests'),
                items: List.generate(
                  12,
                  (index) => DropdownMenuItem(
                    value: index + 1,
                    child: Text('${index + 1} guests'),
                  ),
                ),
                onChanged: (value) => guests = value!,
              ),
              const SizedBox(height: 9),
              TextFormField(
                controller: date,
                decoration: const InputDecoration(
                  labelText: 'Date (YYYY-MM-DD)',
                ),
                validator: requiredField,
              ),
              const SizedBox(height: 9),
              TextFormField(
                controller: time,
                decoration: const InputDecoration(labelText: 'Time (HH:MM)'),
                validator: requiredField,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () async {
                  if (!formKey.currentState!.validate()) return;
                  try {
                    await controller.api.createReservation(
                      controller.token!,
                      locationId: locationId,
                      guests: guests,
                      date: date.text,
                      time: time.text,
                      firstName: first.text,
                      lastName: last.text,
                      phone: phone.text,
                    );
                    if (sheetContext.mounted) Navigator.pop(sheetContext);
                    onSaved();
                  } catch (error) {
                    if (sheetContext.mounted) {
                      ScaffoldMessenger.of(
                        sheetContext,
                      ).showSnackBar(SnackBar(content: Text(error.toString())));
                    }
                  }
                },
                child: const Text('Confirm reservation'),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  for (final controller in [first, last, phone, date, time]) {
    controller.dispose();
  }
}

class AccountPage extends StatefulWidget {
  const AccountPage({super.key, required this.controller});
  final AppController controller;

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final formKey = GlobalKey<FormState>();
  final email = TextEditingController();
  final password = TextEditingController();
  final first = TextEditingController();
  final last = TextEditingController();
  final phone = TextEditingController();
  bool register = false;
  bool busy = false;

  @override
  void dispose() {
    for (final controller in [email, password, first, last, phone]) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.controller.signedIn) {
      return Center(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircleAvatar(
                  radius: 34,
                  child: Icon(Icons.person, size: 36),
                ),
                const SizedBox(height: 16),
                const Text(
                  'You are signed in.',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 18),
                OutlinedButton.icon(
                  onPressed: widget.controller.logout,
                  icon: const Icon(Icons.logout),
                  label: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Form(
                  key: formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        register ? 'Create account' : 'Welcome back',
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 18),
                      if (register) ...[
                        TextFormField(
                          controller: first,
                          decoration: const InputDecoration(
                            labelText: 'First name',
                          ),
                          validator: requiredField,
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: last,
                          decoration: const InputDecoration(
                            labelText: 'Last name',
                          ),
                          validator: requiredField,
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: phone,
                          decoration: const InputDecoration(labelText: 'Phone'),
                          validator: requiredField,
                        ),
                        const SizedBox(height: 10),
                      ],
                      TextFormField(
                        controller: email,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(labelText: 'Email'),
                        validator: (value) =>
                            value != null && value.contains('@')
                            ? null
                            : 'Enter a valid email.',
                      ),
                      const SizedBox(height: 10),
                      TextFormField(
                        controller: password,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                        ),
                        validator: (value) => (value?.length ?? 0) >= 8
                            ? null
                            : 'Use at least 8 characters.',
                      ),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: busy ? null : submit,
                        child: Text(
                          busy
                              ? 'Please wait…'
                              : register
                              ? 'Create account'
                              : 'Sign in',
                        ),
                      ),
                      TextButton(
                        onPressed: () => setState(() => register = !register),
                        child: Text(
                          register
                              ? 'Already have an account? Sign in'
                              : 'New here? Create an account',
                        ),
                      ),
                      if (widget.controller.error != null)
                        Text(
                          widget.controller.error!,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    setState(() => busy = true);
    final success = register
        ? await widget.controller.register(
            first.text,
            last.text,
            email.text,
            phone.text,
            password.text,
          )
        : await widget.controller.login(email.text, password.text);
    if (mounted) setState(() => busy = false);
    if (success && mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Signed in successfully.')));
    }
  }
}

String? requiredField(String? value) =>
    value == null || value.trim().isEmpty ? 'This field is required.' : null;

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.message});
  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 54, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
        ],
      ),
    ),
  );
}

class RetryState extends StatelessWidget {
  const RetryState({super.key, required this.message, required this.retry});
  final String message;
  final VoidCallback retry;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off, size: 48),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: retry,
            icon: const Icon(Icons.refresh),
            label: const Text('Try again'),
          ),
        ],
      ),
    ),
  );
}
