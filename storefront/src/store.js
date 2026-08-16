/**
 * Reactive Cart & App State Manager
 * Handles local cart state, tax/delivery calculation, and event notifications.
 */

class CartStore {
  constructor() {
    this.tenantId = 'bootstrap';
    this.items = [];
    this.deliveryType = 'delivery';
    this.deliveryFee = 4.99;
    this.taxRate = 0.08; // 8%
    this.listeners = [];
  }

  setTenant(tenantId) {
    this.tenantId = tenantId;
    this.items = JSON.parse(localStorage.getItem(this.key('cart_items')) || '[]');
    this.deliveryType = localStorage.getItem(this.key('delivery_type')) || 'delivery';
    this.notify();
  }

  key(suffix) { return `vondo:${this.tenantId}:${suffix}`; }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    localStorage.setItem(this.key('cart_items'), JSON.stringify(this.items));
    localStorage.setItem(this.key('delivery_type'), this.deliveryType);
    this.listeners.forEach(listener => listener(this.getState()));
  }

  setDeliveryType(type) {
    this.deliveryType = type;
    this.notify();
  }

  addItem(menuItem, quantity = 1, selectedOptions = [], specialInstructions = '') {
    const optionKey = JSON.stringify(selectedOptions);
    const existingIndex = this.items.findIndex(
      item => item.id === menuItem.id && JSON.stringify(item.selectedOptions) === optionKey
    );

    let optionPriceSum = selectedOptions.reduce((acc, opt) => acc + (parseFloat(opt.price) || 0), 0);
    const unitPrice = menuItem.price + optionPriceSum;

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: menuItem.id,
        name: menuItem.name,
        image: menuItem.image,
        unitPrice: unitPrice,
        basePrice: menuItem.price,
        quantity: quantity,
        selectedOptions: selectedOptions,
        specialInstructions: specialInstructions
      });
    }

    this.notify();
    this.showToast(`Added "${menuItem.name}" to cart!`);
  }

  updateQuantity(index, newQty) {
    if (newQty <= 0) {
      this.items.splice(index, 1);
    } else {
      this.items[index].quantity = newQty;
    }
    this.notify();
  }

  clear() {
    this.items = [];
    this.notify();
  }

  getSubtotal() {
    return this.items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  }

  getTax() {
    return this.getSubtotal() * this.taxRate;
  }

  getDeliveryFee() {
    return this.deliveryType === 'delivery' ? (this.items.length > 0 ? this.deliveryFee : 0) : 0;
  }

  getTotal() {
    return this.getSubtotal() + this.getTax() + this.getDeliveryFee();
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  getState() {
    return {
      items: this.items,
      count: this.getItemCount(),
      subtotal: this.getSubtotal(),
      tax: this.getTax(),
      deliveryFee: this.getDeliveryFee(),
      total: this.getTotal(),
      deliveryType: this.deliveryType
    };
  }

  showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="ri-checkbox-circle-fill text-gold" style="font-size:1.2rem"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

export const cart = new CartStore();
