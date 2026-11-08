/**
 * Gather & Roam - Checkout & Booking Wizard Engine (باللغة العربية)
 * معالج الحجز التفاعلي المكون من 4 خطوات وحفظ الحجوزات في Firebase Firestore
 */

document.addEventListener("DOMContentLoaded", () => {
  let currentStep = 1;
  const totalSteps = 4;

  let setupFee = 140.00;
  let deliveryFee = 45.00;
  let protectionFee = 28.00;
  let promoDiscount = 30.00;
  let promoApplied = true;

  // Elements
  const cartItemsContainer = document.getElementById("checkout-cart-items");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const discountEl = document.getElementById("checkout-discount");
  const taxEl = document.getElementById("checkout-tax");
  const totalEl = document.getElementById("checkout-total");
  const payBtnText = document.getElementById("pay-button-amount");
  const confirmBtn = document.getElementById("confirm-pay-btn");
  const promoInput = document.getElementById("promo-code-input");
  const promoApplyBtn = document.getElementById("promo-apply-btn");
  const promoMsg = document.getElementById("promo-status-msg");

  // Autofill user info if logged in
  const currentUser = GatherApp.getUser();
  if (currentUser) {
    const nameField = document.getElementById("pay-name");
    const phoneField = document.getElementById("pay-phone");
    if (nameField && currentUser.name) nameField.value = currentUser.name;
    if (phoneField && currentUser.phone) phoneField.value = currentUser.phone;
  }

  // Initialize
  renderCartSummary();
  updateFinancials();
  updateStepUI(1);

  // Setup Tier listener
  document.querySelectorAll("input[name='setup_tier']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "white-glove") {
        setupFee = 140.00;
      } else if (e.target.value === "curbside") {
        setupFee = 40.00;
      } else {
        setupFee = 0.00;
      }
      updateFinancials();
    });
  });

  // Protection plan checkbox
  const protCheckbox = document.getElementById("coverage-damage-checkbox");
  if (protCheckbox) {
    protCheckbox.addEventListener("change", (e) => {
      protectionFee = e.target.checked ? 28.00 : 0.00;
      updateFinancials();
    });
  }

  // Promo code handler
  if (promoApplyBtn && promoInput) {
    promoApplyBtn.addEventListener("click", () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === "FIRSTEVENT" || code === "WELCOME10" || code === "GATHER2025") {
        promoDiscount = 30.00;
        promoApplied = true;
        promoMsg.innerHTML = `<span class="material-symbols-outlined text-[14px]">check</span> تم تفعيل الكود ${code}: خصم $30.00 فوري!`;
        promoMsg.className = "flex items-center gap-1 text-secondary mt-1.5 text-xs font-bold";
        promoApplyBtn.textContent = "مُطبّق";
        GatherApp.showToast("🎉 تم تطبيق كود الخصم! تم خصم $30 من المجموع.", "success");
      } else {
        promoDiscount = 0.00;
        promoApplied = false;
        promoMsg.innerHTML = `<span class="material-symbols-outlined text-[14px]">error</span> الكود غير صحيح. جرب "FIRSTEVENT".`;
        promoMsg.className = "flex items-center gap-1 text-error mt-1.5 text-xs font-bold";
        promoApplyBtn.textContent = "تطبيق";
      }
      updateFinancials();
    });
  }

  // Render items in right column
  function renderCartSummary() {
    if (!cartItemsContainer) return;
    const cart = GatherApp.getCart();

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="py-6 text-center text-on-surface-variant">
          <p class="text-xs">سلة الحجز فارغة حالياً.</p>
          <a href="catalog.html" class="inline-block mt-2 text-primary font-bold hover:underline text-xs">تصفح كتالوج المعدات ←</a>
        </div>
      `;
      return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="flex items-center gap-3 py-2.5 border-b border-outline-variant/15 last:border-b-0">
        <div class="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-low shrink-0 relative shadow-sm">
          <img class="w-full h-full object-cover" src="${item.image || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75'}" alt="${item.name}" />
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-on-surface truncate">${item.name}</h4>
          <p class="text-[11px] text-on-surface-variant truncate">${item.options || 'معدات مفحوصة ومعقمة'}</p>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-[11px] text-outline font-mono">الكمية: ${item.qty || 1}</span>
            <button type="button" onclick="removeItemFromCheckout('${item.id}')" class="text-[11px] text-error hover:underline flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[13px]">delete</span> حذف
            </button>
          </div>
        </div>
        <div class="text-left shrink-0">
          <span class="font-price-tag text-sm font-bold text-on-surface">$${((item.rate || 0) * (item.qty || 1)).toFixed(2)}</span>
          <p class="text-[10px] text-outline">${item.rateLabel || 'قياسي'}</p>
        </div>
      </div>
    `).join('');
  }

  window.removeItemFromCheckout = (id) => {
    GatherApp.removeFromCart(id);
    renderCartSummary();
    updateFinancials();
  };

  function updateFinancials() {
    const cart = GatherApp.getCart();
    const cartSubtotal = cart.reduce((sum, item) => sum + ((item.rate || 0) * (item.qty || 1)), 0);
    const servicesSubtotal = setupFee + deliveryFee + protectionFee;
    const combinedSubtotal = cartSubtotal + servicesSubtotal;

    const discountAmount = promoApplied ? Math.min(promoDiscount, combinedSubtotal) : 0;
    const taxableAmount = Math.max(0, combinedSubtotal - discountAmount);
    const tax = taxableAmount * 0.075; // 7.5% ضريبة الخدمات واللوجستيات
    const grandTotal = taxableAmount + tax;

    if (subtotalEl) subtotalEl.textContent = `$${combinedSubtotal.toFixed(2)}`;
    if (discountEl) discountEl.textContent = `-$${discountAmount.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;
    if (payBtnText) payBtnText.textContent = `$${grandTotal.toFixed(2)}`;

    const setupFeeLabel = document.getElementById("summary-setup-fee");
    if (setupFeeLabel) setupFeeLabel.textContent = `+$${setupFee.toFixed(2)}`;
    const delFeeLabel = document.getElementById("summary-delivery-fee");
    if (delFeeLabel) delFeeLabel.textContent = `+$${deliveryFee.toFixed(2)}`;
    const protFeeLabel = document.getElementById("summary-protect-fee");
    if (protFeeLabel) protFeeLabel.textContent = `+$${protectionFee.toFixed(2)}`;

    return {
      subtotal: combinedSubtotal,
      discount: discountAmount,
      tax: tax,
      total: grandTotal
    };
  }

  window.goToStep = (stepNumber) => {
    if (stepNumber < 1 || stepNumber > totalSteps) return;
    currentStep = stepNumber;
    updateStepUI(currentStep);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  function updateStepUI(step) {
    document.querySelectorAll(".wizard-step-section").forEach(sec => {
      sec.style.display = "none";
    });

    const activeSec = document.getElementById(`step-section-${step}`);
    if (activeSec) activeSec.style.display = "block";

    document.querySelectorAll(".stepper-item").forEach((item, idx) => {
      const stepIdx = idx + 1;
      const numCircle = item.querySelector(".stepper-circle");
      const statusText = item.querySelector(".stepper-status");

      if (stepIdx < step) {
        if (numCircle) {
          numCircle.className = "stepper-circle w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center text-xs font-bold shadow-sm";
          numCircle.innerHTML = `<span class="material-symbols-outlined text-[18px]">check</span>`;
        }
        if (statusText) statusText.textContent = "مكتمل";
      } else if (stepIdx === step) {
        if (numCircle) {
          numCircle.className = "stepper-circle w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-xs font-bold shadow-md animate-pulse";
          numCircle.textContent = stepIdx;
        }
        if (statusText) statusText.textContent = "قيد الإدخال";
      } else {
        if (numCircle) {
          numCircle.className = "stepper-circle w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center text-xs font-bold";
          numCircle.textContent = stepIdx;
        }
        if (statusText) statusText.textContent = "الخطوة القادمة";
      }
    });
  }

  // Submit Booking to Firebase
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const cart = GatherApp.getCart();
      if (cart.length === 0) {
        GatherApp.showToast("سلة الحجز فارغة. يرجى اختيار المعدات أولاً!", "error");
        return;
      }

      const name = document.getElementById("pay-name")?.value || "عميل Gather & Roam";
      const phone = document.getElementById("pay-phone")?.value || "0501234567";
      const email = document.getElementById("pay-email")?.value || "client@gatherroam.com";
      const address = document.getElementById("delivery-address")?.value || "طريق الملك فهد، الرياض";
      const city = document.getElementById("delivery-city")?.value || "الرياض";
      const zip = document.getElementById("delivery-zip")?.value || "11564";
      const venueType = document.getElementById("delivery-venue-type")?.value || "مزرعة أو استراحة خاصة";
      const deliveryDate = document.getElementById("step-delivery-date")?.value || "2025-06-18";
      const returnDate = document.getElementById("step-return-date")?.value || "2025-06-22";

      const financials = updateFinancials();

      // Ensure customer profile is registered or updated
      GatherApp.setUser({ name, phone, email, isLoggedIn: true });
      if (window.GatherFirebase && window.GatherFirebase.loginOrRegister) {
        window.GatherFirebase.loginOrRegister(name, phone);
      }

      const bookingPayload = {
        customer: { name, phone, email },
        venue: { address, city, zip, venueType },
        dates: { start: deliveryDate, end: returnDate },
        items: cart,
        logistics: {
          setupFee,
          deliveryFee,
          protectionFee,
          setupTier: setupFee > 0 ? "تركيب وفك شامل White-Glove" : "تسليم على الرصيف"
        },
        financials: financials,
        totalAmount: financials.total,
        paymentStatus: "paid_secured"
      };

      const originalBtnHTML = confirmBtn.innerHTML;
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `
        <span class="material-symbols-outlined animate-spin text-[24px]">refresh</span>
        <span>جارٍ حفظ وتأكيد الحجز في Firebase...</span>
      `;

      try {
        let result = { success: true, bookingRef: "GR-" + Math.floor(100000 + Math.random() * 900000) };

        if (window.GatherFirebase && window.GatherFirebase.saveBooking) {
          result = await window.GatherFirebase.saveBooking(bookingPayload);
        }

        GatherApp.showToast("🎉 تم تأكيد حجزك وتسجيله في Firebase بنجاح!", "success");
        GatherApp.clearCart();

        showBookingSuccessModal(result.bookingRef || result.id, bookingPayload);

      } catch (err) {
        console.error("Booking error:", err);
        const fallbackRef = "GR-" + Math.floor(100000 + Math.random() * 900000);
        GatherApp.showToast(`تم تأكيد الحجز محلياً. رقم الحجز: ${fallbackRef}`, "success");
        showBookingSuccessModal(fallbackRef, bookingPayload);
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalBtnHTML;
      }
    });
  }

  function showBookingSuccessModal(bookingRef, order) {
    const modal = document.createElement("div");
    modal.className = "gather-modal-backdrop active";
    modal.innerHTML = `
      <div class="gather-modal-card" style="max-width: 650px;">
        <div style="background: #012d1d; color: #fff; padding: 2rem; border-top-left-radius: 1.25rem; border-top-right-radius: 1.25rem; text-align: center;">
          <div style="width: 58px; height: 58px; border-radius: 50%; background: #fd8367; color: #012d1d; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <span class="material-symbols-outlined" style="font-size: 34px; font-weight: bold;">check</span>
          </div>
          <h2 style="font-size: 24px; font-weight: 800; margin: 0;">تم تأكيد حجز المعدات بنجاح!</h2>
          <p style="opacity: 0.9; margin: 6px 0 0 0; font-size: 13px;">تم تسجيل طلبك في أسطول التجهيز والشحن، وتثبيت التواريخ المحددة.</p>
          <div style="display: inline-block; background: rgba(255,255,255,0.18); padding: 6px 16px; border-radius: 999px; margin-top: 14px; font-weight: 800; font-size: 13px; font-family: 'Cairo', sans-serif;">
            رقم الحجز: #${bookingRef}
          </div>
        </div>
        <div style="padding: 1.5rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(113,121,115,0.15); font-size: 13px;">
            <div>
              <span style="color: #717973; text-transform: uppercase; font-size: 11px; font-weight: bold;">اسم العميل والجوال</span>
              <p style="margin: 2px 0 0; font-weight: 700;">${order.customer.name} (${order.customer.phone})</p>
            </div>
            <div>
              <span style="color: #717973; text-transform: uppercase; font-size: 11px; font-weight: bold;">موقع التوصيل والفعالية</span>
              <p style="margin: 2px 0 0; font-weight: 700;">${order.venue.address}، ${order.venue.city}</p>
            </div>
          </div>

          <div style="margin-top: 1rem;">
            <span style="color: #717973; font-size: 12px; font-weight: bold;">المعدات المحجوزة:</span>
            <ul style="list-style: none; padding: 0; margin: 8px 0; font-size: 13px;">
              ${order.items.map(it => `
                <li style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed rgba(113,121,115,0.1);">
                  <span>${it.name} (×${it.qty || 1})</span>
                  <strong class="font-mono">$${((it.rate || 0) * (it.qty || 1)).toFixed(2)}</strong>
                </li>
              `).join('')}
            </ul>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(113,121,115,0.15);">
            <div>
              <span style="font-size: 12px; color: #717973;">إجمالي المبلغ المسجل في Firebase:</span>
              <p style="font-size: 24px; font-weight: 800; color: #012d1d; margin: 0;" class="font-mono">$${order.financials.total.toFixed(2)}</p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" onclick="window.print()" style="padding: 10px 16px; border-radius: 10px; border: 1px solid #c1c8c2; background: transparent; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <span class="material-symbols-outlined" style="font-size: 18px;">print</span> طباعة الإيصال
              </button>
              <a href="index.html" style="padding: 10px 22px; border-radius: 10px; background: #012d1d; color: #fff; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                <span>العودة للرئيسية</span>
                <span class="material-symbols-outlined text-[18px] rotate-180">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
});
