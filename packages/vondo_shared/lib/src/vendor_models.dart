import 'tenant_theme.dart';

class VendorBrand {
  const VendorBrand({
    required this.name,
    required this.primary,
    required this.surface,
    required this.background,
    required this.text,
  });
  final String name;
  final String primary;
  final String surface;
  final String background;
  final String text;

  factory VendorBrand.fromJson(Map<String, dynamic> restaurant) {
    final brand = Map<String, dynamic>.from(
      (restaurant['brand'] as Map?) ?? const {},
    );
    final identity = Map<String, dynamic>.from(
      (brand['identity'] as Map?) ?? const {},
    );
    final theme = TenantTheme.fromBrand(brand);
    return VendorBrand(
      name:
          (identity['name'] ?? restaurant['name'] ?? 'Vondo Vendor') as String,
      primary: theme.primary,
      surface: theme.surface,
      background: theme.background,
      text: theme.text,
    );
  }

  Map<String, dynamic> toJson() => {'identity': {'name': name}, 'theme': {
    'primary': primary, 'surface': surface, 'background': background, 'text': text,
  }};
}

class VendorLocation {
  const VendorLocation({
    required this.id,
    required this.name,
    required this.address,
    required this.isOpen,
  });

  final int id;
  final String name;
  final String address;
  final bool isOpen;

  factory VendorLocation.fromJson(Map<String, dynamic> json) => VendorLocation(
    id: json['id'] as int,
    name: (json['name'] ?? '') as String,
    address: (json['address'] ?? '') as String,
    isOpen: json['is_open'] == true,
  );
  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'address': address, 'is_open': isOpen};
}

class VendorStatus {
  const VendorStatus({required this.id, required this.name, this.color});

  final int id;
  final String name;
  final String? color;

  factory VendorStatus.fromJson(Map<String, dynamic> json) => VendorStatus(
    id: json['id'] as int,
    name: (json['name'] ?? '') as String,
    color: json['color'] as String?,
  );
  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'color': color};
}

class VendorBootstrap {
  const VendorBootstrap({
    required this.staffName,
    required this.staffEmail,
    required this.locations,
    required this.orderStatuses,
    required this.reservationStatuses,
    required this.canManageOrders,
    required this.canManageReservations,
    required this.canManageMenus,
    required this.brand,
  });

  final String staffName;
  final String staffEmail;
  final List<VendorLocation> locations;
  final List<VendorStatus> orderStatuses;
  final List<VendorStatus> reservationStatuses;
  final bool canManageOrders;
  final bool canManageReservations;
  final bool canManageMenus;
  final VendorBrand brand;

  factory VendorBootstrap.fromJson(Map<String, dynamic> json) {
    final staff = Map<String, dynamic>.from(json['staff'] as Map);
    final capabilities = Map<String, dynamic>.from(
      (json['capabilities'] as Map?) ?? const {},
    );
    final restaurant = Map<String, dynamic>.from(
      (json['restaurant'] as Map?) ?? const {},
    );
    List<T> list<T>(String key, T Function(Map<String, dynamic>) mapper) =>
        ((json[key] as List?) ?? const [])
            .map((value) => mapper(Map<String, dynamic>.from(value as Map)))
            .toList();
    return VendorBootstrap(
      staffName: (staff['name'] ?? '') as String,
      staffEmail: (staff['email'] ?? '') as String,
      locations: list('locations', VendorLocation.fromJson),
      orderStatuses: list('order_statuses', VendorStatus.fromJson),
      reservationStatuses: list('reservation_statuses', VendorStatus.fromJson),
      canManageOrders: capabilities['orders'] == true,
      canManageReservations: capabilities['reservations'] == true,
      canManageMenus: capabilities['menus'] == true,
      brand: VendorBrand.fromJson(restaurant),
    );
  }

  Map<String, dynamic> toJson() => {
    'staff': {'name': staffName, 'email': staffEmail},
    'restaurant': {'name': brand.name, 'brand': brand.toJson()},
    'locations': locations.map((item) => item.toJson()).toList(),
    'order_statuses': orderStatuses.map((item) => item.toJson()).toList(),
    'reservation_statuses': reservationStatuses.map((item) => item.toJson()).toList(),
    'capabilities': {'orders': canManageOrders, 'reservations': canManageReservations, 'menus': canManageMenus},
  };
}

class DashboardData {
  const DashboardData({
    required this.sales,
    required this.ordersToday,
    required this.ordersWaiting,
    required this.reservationsToday,
    required this.upcomingReservations,
  });

  final double sales;
  final int ordersToday;
  final int ordersWaiting;
  final int reservationsToday;
  final int upcomingReservations;

  factory DashboardData.fromJson(Map<String, dynamic> json) => DashboardData(
    sales: (json['today_sales'] as num? ?? 0).toDouble(),
    ordersToday: (json['orders_today'] as num? ?? 0).toInt(),
    ordersWaiting: (json['orders_waiting'] as num? ?? 0).toInt(),
    reservationsToday: (json['reservations_today'] as num? ?? 0).toInt(),
    upcomingReservations: (json['upcoming_reservations'] as num? ?? 0).toInt(),
  );
}

class VendorOrder {
  const VendorOrder({
    required this.id,
    required this.number,
    required this.customerName,
    required this.customerPhone,
    required this.type,
    required this.statusId,
    required this.statusName,
    required this.total,
    required this.itemsCount,
    required this.items,
    this.comment,
  });

  final int id;
  final String number;
  final String customerName;
  final String customerPhone;
  final String type;
  final int statusId;
  final String statusName;
  final double total;
  final int itemsCount;
  final List<String> items;
  final String? comment;

  factory VendorOrder.fromJson(Map<String, dynamic> json) => VendorOrder(
    id: json['id'] as int,
    number: (json['number'] ?? '') as String,
    customerName: (json['customer_name'] ?? 'Walk-in') as String,
    customerPhone: (json['customer_phone'] ?? '') as String,
    type: (json['type'] ?? 'Order') as String,
    statusId: (json['status_id'] as num? ?? 0).toInt(),
    statusName: (json['status_name'] ?? 'New') as String,
    total: (json['total'] as num? ?? 0).toDouble(),
    itemsCount: (json['items_count'] as num? ?? 0).toInt(),
    items: ((json['items'] as List?) ?? const []).map((item) {
      final data = Map<String, dynamic>.from(item as Map);
      return '${data['quantity'] ?? 1} × ${data['name'] ?? 'Item'}';
    }).toList(),
    comment: json['comment'] as String?,
  );
}

class VendorReservation {
  const VendorReservation({
    required this.id,
    required this.guestName,
    required this.telephone,
    required this.guests,
    required this.date,
    required this.time,
    required this.statusId,
    required this.statusName,
    this.comment,
  });

  final int id;
  final String guestName;
  final String telephone;
  final int guests;
  final String date;
  final String time;
  final int statusId;
  final String statusName;
  final String? comment;

  factory VendorReservation.fromJson(Map<String, dynamic> json) =>
      VendorReservation(
        id: json['id'] as int,
        guestName: (json['guest_name'] ?? 'Guest') as String,
        telephone: (json['telephone'] ?? '') as String,
        guests: (json['guests'] as num? ?? 0).toInt(),
        date: (json['date'] ?? '') as String,
        time: (json['time'] ?? '') as String,
        statusId: (json['status_id'] as num? ?? 0).toInt(),
        statusName: (json['status_name'] ?? 'New') as String,
        comment: json['comment'] as String?,
      );
}

class VendorMenuItem {
  const VendorMenuItem({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.isAvailable,
  });

  final int id;
  final String name;
  final String description;
  final double price;
  final bool isAvailable;

  factory VendorMenuItem.fromJson(Map<String, dynamic> json) => VendorMenuItem(
    id: json['id'] as int,
    name: (json['name'] ?? '') as String,
    description: (json['description'] ?? '') as String,
    price: (json['price'] as num? ?? 0).toDouble(),
    isAvailable: json['is_available'] == true,
  );
}
