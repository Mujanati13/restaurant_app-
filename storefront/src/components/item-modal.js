import { cart } from '../store.js';
import { analytics } from '../analytics.js';

let modalState = {
  item: null,
  quantity: 1,
  selectedOptions: [],
  specialInstructions: ''
};

export function openItemModal(item) {
  modalState = {
    item: item,
    quantity: 1,
    selectedOptions: [],
    specialInstructions: ''
  };

  renderModal();
}

function renderModal() {
  let modalEl = document.getElementById('item-detail-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'item-detail-modal';
    modalEl.className = 'modal-overlay';
    document.body.appendChild(modalEl);
  }

  const { item, quantity, selectedOptions } = modalState;
  if (!item) return;

  const optionSum = selectedOptions.reduce((acc, opt) => acc + (parseFloat(opt.price) || 0), 0);
  const totalPrice = (item.price + optionSum) * quantity;

  modalEl.innerHTML = `
    <div class="modal-content">
      <button class="modal-close-btn" onclick="document.getElementById('item-detail-modal').classList.remove('open')">
        <i class="ri-close-line"></i>
      </button>

      <div style="position:relative;height:240px;overflow:hidden;">
        <img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;" />
        <div style="position:absolute;bottom:0;inset-x:0;height:80px;background:linear-gradient(to top, var(--bg-secondary), transparent);"></div>
      </div>

      <div style="padding:1.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem;">
          <h2 style="font-size:1.5rem;color:#fff;">${item.name}</h2>
          <span class="text-gold" style="font-size:1.4rem;font-weight:800;">$${item.price.toFixed(2)}</span>
        </div>

        <p style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:1.5rem;line-height:1.6;">
          ${item.description}
        </p>

        <!-- Options Section -->
        ${item.options && item.options.length > 0 ? item.options.map((optGroup, gIdx) => `
          <div style="margin-bottom:1.25rem;padding:1rem;background:var(--bg-tertiary);border-radius:var(--radius-md);">
            <label style="font-weight:700;font-size:0.95rem;display:block;margin-bottom:0.75rem;color:var(--text-primary);">
              ${optGroup.name}
            </label>
            <div style="display:flex;flex-direction:column;gap:0.5rem;">
              ${(optGroup.values || []).map((val, vIdx) => {
                const isSelected = selectedOptions.some(o => o.group === optGroup.name && o.name === val.name);
                return `
                  <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;padding:0.5rem 0.75rem;background:var(--bg-secondary);border-radius:var(--radius-sm);border:1px solid ${isSelected ? 'var(--accent-amber)' : 'var(--border-subtle)'}">
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                      <input type="checkbox" class="opt-checkbox" data-group="${optGroup.name}" data-name="${val.name}" data-price="${val.price || 0}" ${isSelected ? 'checked' : ''} style="accent-color:var(--accent-amber);" />
                      <span style="font-size:0.9rem;color:var(--text-primary);">${val.name}</span>
                    </div>
                    ${val.price ? `<span class="text-gold" style="font-size:0.85rem;font-weight:700;">+$${parseFloat(val.price).toFixed(2)}</span>` : ''}
                  </label>
                `;
              }).join('')}
            </div>
          </div>
        `).join('') : ''}

        <!-- Special Instructions -->
        <div class="form-group" style="margin-top:1rem;">
          <label class="form-label">Special Requests / Allergies</label>
          <input type="text" id="modal-special-instructions" class="form-control" placeholder="e.g. Extra sauce, no onions..." value="${modalState.specialInstructions}" />
        </div>

        <!-- Quantity & Add to Cart -->
        <div style="display:flex;align-items:center;gap:1rem;margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border-subtle);">
          <div style="display:flex;align-items:center;gap:0.75rem;background:var(--bg-tertiary);padding:0.5rem 1rem;border-radius:var(--radius-md);border:1px solid var(--border-subtle);">
            <button id="modal-qty-minus" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:1.1rem;">
              <i class="ri-subtract-line"></i>
            </button>
            <span id="modal-qty-val" style="font-weight:800;font-size:1.1rem;min-width:24px;text-align:center;">${quantity}</span>
            <button id="modal-qty-plus" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:1.1rem;">
              <i class="ri-add-line"></i>
            </button>
          </div>

          <button id="modal-add-to-cart-btn" class="btn btn-primary btn-lg" style="flex:1;">
            Add to Order — $${totalPrice.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  `;

  modalEl.classList.add('open');
  bindModalEvents();
}

function bindModalEvents() {
  const modalEl = document.getElementById('item-detail-modal');
  if (!modalEl) return;

  const minusBtn = modalEl.querySelector('#modal-qty-minus');
  const plusBtn = modalEl.querySelector('#modal-qty-plus');
  const addBtn = modalEl.querySelector('#modal-add-to-cart-btn');

  if (minusBtn) {
    minusBtn.onclick = () => {
      if (modalState.quantity > 1) {
        modalState.quantity--;
        renderModal();
      }
    };
  }

  if (plusBtn) {
    plusBtn.onclick = () => {
      modalState.quantity++;
      renderModal();
    };
  }

  modalEl.querySelectorAll('.opt-checkbox').forEach(chk => {
    chk.onchange = (e) => {
      const group = e.target.dataset.group;
      const name = e.target.dataset.name;
      const price = parseFloat(e.target.dataset.price || 0);

      if (e.target.checked) {
        modalState.selectedOptions.push({ group, name, price });
      } else {
        modalState.selectedOptions = modalState.selectedOptions.filter(o => !(o.group === group && o.name === name));
      }
      renderModal();
    };
  });

  if (addBtn) {
    addBtn.onclick = () => {
      const noteInput = modalEl.querySelector('#modal-special-instructions');
      const note = noteInput ? noteInput.value : '';

      cart.addItem(
        modalState.item,
        modalState.quantity,
        modalState.selectedOptions,
        note
      );
      analytics.track('add_to_cart', {menu_id: modalState.item.id, quantity: modalState.quantity});

      modalEl.classList.remove('open');
      document.querySelector('.cart-drawer-overlay')?.classList.add('open');
    };
  }
}
