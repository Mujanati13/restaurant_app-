import 'package:vondo_shared/vondo_shared.dart';

class TenantBrand {
  const TenantBrand({
    required this.id,
    required this.name,
    required this.primary,
    required this.background,
    required this.surface,
    required this.text,
    required this.currencySymbol,
    this.defaultCountryId = 1,
  });
  final String id, name, primary, background, surface, text, currencySymbol;
  final int defaultCountryId;
  factory TenantBrand.fromJson(Map<String, dynamic> data) {
    final restaurant = Map<String, dynamic>.from(data['restaurant'] as Map);
    final brand = Map<String, dynamic>.from(data['brand'] as Map);
    final identity = Map<String, dynamic>.from(brand['identity'] as Map);
    final theme = TenantTheme.fromBrand(brand);
    final currency = Map<String, dynamic>.from(data['currency'] as Map);
    final defaults = Map<String, dynamic>.from(
      (data['defaults'] as Map?) ?? const {},
    );
    return TenantBrand(
      id: restaurant['id'] as String,
      name: (identity['name'] ?? restaurant['name']) as String,
      primary: theme.primary,
      background: theme.background,
      surface: theme.surface,
      text: theme.text,
      currencySymbol: (currency['symbol'] ?? '') as String,
      defaultCountryId: (defaults['country_id'] as num? ?? 1).toInt(),
    );
  }

  factory TenantBrand.fromCache(Map<String, dynamic> data) => TenantBrand(
    id: data['id'] as String,
    name: data['name'] as String,
    primary: data['primary'] as String,
    background: data['background'] as String,
    surface: data['surface'] as String,
    text: data['text'] as String,
    currencySymbol: data['currency_symbol'] as String,
    defaultCountryId: (data['default_country_id'] as num? ?? 1).toInt(),
  );

  Map<String, dynamic> toCache() => {
    'id': id,
    'name': name,
    'primary': primary,
    'background': background,
    'surface': surface,
    'text': text,
    'currency_symbol': currencySymbol,
    'default_country_id': defaultCountryId,
  };
}

class MenuItem {
  const MenuItem({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.image,
    this.options = const [],
  });
  final int id;
  final String name, description;
  final double price;
  final String? image;
  final List<MenuOptionGroup> options;
  factory MenuItem.fromJson(Map<String, dynamic> j) => MenuItem(
    id: (j['id'] as num).toInt(),
    name: (j['name'] ?? '') as String,
    description: (j['description'] ?? '') as String,
    price: (j['price'] as num? ?? 0).toDouble(),
    image: j['image'] as String?,
    options: ((j['options'] as List?) ?? const [])
        .map(
          (value) =>
              MenuOptionGroup.fromJson(Map<String, dynamic>.from(value as Map)),
        )
        .toList(),
  );
}

class MenuOptionGroup {
  const MenuOptionGroup({
    required this.id,
    required this.name,
    required this.displayType,
    required this.required,
    required this.minSelected,
    required this.maxSelected,
    required this.values,
  });
  final int id, minSelected, maxSelected;
  final String name, displayType;
  final bool required;
  final List<MenuOptionValue> values;
  bool get singleSelect =>
      displayType == 'radio' || displayType == 'select' || maxSelected == 1;

  factory MenuOptionGroup.fromJson(Map<String, dynamic> j) => MenuOptionGroup(
    id: (j['id'] as num).toInt(),
    name: (j['name'] ?? 'Option') as String,
    displayType: (j['display_type'] ?? 'checkbox') as String,
    required: j['required'] == true,
    minSelected: (j['min_selected'] as num? ?? 0).toInt(),
    maxSelected: (j['max_selected'] as num? ?? 0).toInt(),
    values: ((j['values'] as List?) ?? const [])
        .map(
          (value) =>
              MenuOptionValue.fromJson(Map<String, dynamic>.from(value as Map)),
        )
        .toList(),
  );
}

class MenuOptionValue {
  const MenuOptionValue({
    required this.id,
    required this.name,
    required this.price,
    required this.isDefault,
  });
  final int id;
  final String name;
  final double price;
  final bool isDefault;

  factory MenuOptionValue.fromJson(Map<String, dynamic> j) => MenuOptionValue(
    id: (j['id'] as num).toInt(),
    name: (j['name'] ?? 'Option') as String,
    price: (j['price'] as num? ?? 0).toDouble(),
    isDefault: j['is_default'] == true,
  );
}

class CartOptionSelection {
  CartOptionSelection({required this.group, required Map<int, int> quantities})
    : quantities = Map.unmodifiable(quantities);
  final MenuOptionGroup group;
  final Map<int, int> quantities;
  double get total => quantities.entries.fold(0, (sum, entry) {
    final value = group.values.firstWhere((item) => item.id == entry.key);
    return sum + value.price * entry.value;
  });
  String get label => quantities.entries
      .map((entry) {
        final value = group.values.firstWhere((item) => item.id == entry.key);
        return entry.value > 1 ? '${entry.value} × ${value.name}' : value.name;
      })
      .join(', ');
  Map<String, dynamic> toRequest() => {
    'option_id': group.id,
    'values': quantities.entries
        .map((entry) => {'value_id': entry.key, 'quantity': entry.value})
        .toList(),
  };
}

class RestaurantLocation {
  const RestaurantLocation({
    required this.id,
    required this.name,
    required this.address,
  });
  final int id;
  final String name, address;
  factory RestaurantLocation.fromJson(Map<String, dynamic> j) =>
      RestaurantLocation(
        id: (j['id'] as num).toInt(),
        name: (j['name'] ?? '') as String,
        address: (j['address'] ?? '') as String,
      );
}

class CartLine {
  CartLine({
    required this.menu,
    required this.quantity,
    this.options = const [],
  });
  final MenuItem menu;
  final List<CartOptionSelection> options;
  int quantity;
  double get unitPrice =>
      menu.price + options.fold(0, (sum, option) => sum + option.total);
  double get total => unitPrice * quantity;
  String get signature =>
      '${menu.id}:${options.expand((option) => option.quantities.entries.map((entry) => '${option.group.id}.${entry.key}.${entry.value}')).join('|')}';
}

class OrderStatusEvent {
  const OrderStatusEvent({
    required this.status,
    required this.createdAt,
    this.comment,
  });
  final String status, createdAt;
  final String? comment;

  factory OrderStatusEvent.fromJson(Map<String, dynamic> j) => OrderStatusEvent(
    status: (j['status'] ?? 'Updated') as String,
    createdAt: (j['created_at'] ?? '') as String,
    comment: j['comment'] as String?,
  );
}

class CustomerOrder {
  const CustomerOrder({
    required this.id,
    required this.status,
    required this.total,
    required this.items,
    required this.createdAt,
    required this.timeline,
  });
  final int id;
  final String status, createdAt;
  final double total;
  final List<String> items;
  final List<OrderStatusEvent> timeline;
  factory CustomerOrder.fromJson(Map<String, dynamic> j) => CustomerOrder(
    id: (j['id'] as num).toInt(),
    status: ((j['status'] as Map?)?['name'] ?? 'Received') as String,
    total: (j['total'] as num? ?? 0).toDouble(),
    items: ((j['items'] as List?) ?? const []).map((v) {
      final m = Map<String, dynamic>.from(v as Map);
      final options = ((m['options'] as List?) ?? const [])
          .map((value) {
            final option = Map<String, dynamic>.from(value as Map);
            final quantity = (option['quantity'] as num? ?? 1).toInt();
            return quantity > 1
                ? '$quantity x ${option['name']}'
                : '${option['name']}';
          })
          .join(', ');
      return '${m['quantity']} x ${m['name']}${options.isEmpty ? '' : ' - $options'}';
    }).toList(),
    createdAt: (j['created_at'] ?? '') as String,
    timeline: ((j['timeline'] as List?) ?? const [])
        .map(
          (value) => OrderStatusEvent.fromJson(
            Map<String, dynamic>.from(value as Map),
          ),
        )
        .toList(),
  );
}

class CustomerReservation {
  const CustomerReservation({
    required this.id,
    required this.date,
    required this.time,
    required this.status,
    required this.location,
  });
  final int id;
  final String date, time, status, location;
  factory CustomerReservation.fromJson(Map<String, dynamic> j) =>
      CustomerReservation(
        id: (j['id'] as num).toInt(),
        date: (j['date'] ?? '') as String,
        time: (j['time'] ?? '') as String,
        status: ((j['status'] as Map?)?['name'] ?? 'Received') as String,
        location: (j['location'] ?? 'Restaurant') as String,
      );
}
