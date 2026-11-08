/**
 * Gather & Roam - Product Detail & Customizer Controller (باللغة العربية)
 */

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id") || "timberline-bell-tent";

  const product = (window.GATHER_PRODUCTS || []).find(p => p.id === productId) || window.GATHER_PRODUCTS[0];

  let fulfillmentFee = 350.00;
  let activeDurationMode = "weekend"; // "day", "weekend", "week"
  let baseRate = product.weekendRate || 4200.00;
  const promoDiscount = 500.00;

  initProductUI(product);

  function initProductUI(p) {
    if (!p) return;

    document.title = `${p.name} — Gather & Roam`;

    const breadcrumbName = document.getElementById("p-breadcrumb-name");
    if (breadcrumbName) breadcrumbName.textContent = p.name;
    const breadcrumbCat = document.getElementById("p-breadcrumb-cat");
    if (breadcrumbCat) breadcrumbCat.textContent = p.categoryLabel;

    const titleEl = document.getElementById("p-title");
    if (titleEl) titleEl.textContent = p.name;
    const descEl = document.getElementById("p-desc");
    if (descEl) descEl.textContent = p.shortDesc;
    const ratingEl = document.getElementById("p-rating");
    if (ratingEl) ratingEl.textContent = p.rating;
    const reviewsEl = document.getElementById("p-reviews-count");
    if (reviewsEl) reviewsEl.textContent = `(${p.reviewsCount} تقييم موثق لفعاليات حقيقية بمصر)`;

    // Update dynamic duration buttons rates
    const rateDayEl = document.getElementById("p-rate-day");
    if (rateDayEl) rateDayEl.innerHTML = `${(p.dailyRate || 1800).toLocaleString('ar-EG')} <span class="text-[10px] font-normal">ج.م/يوم</span>`;
    const rateWeekendEl = document.getElementById("p-rate-weekend");
    if (rateWeekendEl) rateWeekendEl.textContent = `${(p.weekendRate || 4200).toLocaleString('ar-EG')} ج.م`;
    const rateWeekEl = document.getElementById("p-rate-week");
    if (rateWeekEl) rateWeekEl.textContent = `${(p.weeklyRate || 8500).toLocaleString('ar-EG')} ج.م`;

    if (p.gallery && p.gallery.length > 0) {
      const heroImg = document.getElementById("main-hero-image");
      if (heroImg) {
        heroImg.src = p.gallery[0];
        heroImg.alt = p.name;
      }

      const thumbsContainer = document.getElementById("gallery-thumbs-row");
      if (thumbsContainer) {
        thumbsContainer.innerHTML = p.gallery.map((imgUrl, idx) => `
          <button class="gallery-thumb ${idx === 0 ? 'active opacity-100 ring-2 ring-primary' : 'opacity-70'} aspect-[4/3] rounded-xl overflow-hidden relative shadow-sm hover:opacity-100 transition-all bg-surface-container focus:outline-none" 
                  onclick="swapGallery(${idx}, '${imgUrl}')" type="button">
            <img class="w-full h-full object-cover" src="${imgUrl}" alt="${p.name} صورة ${idx + 1}" />
            <span class="absolute inset-0 ${idx === 0 ? 'bg-primary/20' : 'bg-transparent'} pointer-events-none active-indicator"></span>
          </button>
        `).join('');
      }
    }

    baseRate = p.weekendRate || 4200;
    updateSummary();
  }

  window.swapGallery = (index, imgSrc) => {
    const mainImg = document.getElementById("main-hero-image");
    if (mainImg) mainImg.src = imgSrc;

    const thumbs = document.querySelectorAll(".gallery-thumb");
    thumbs.forEach((t, i) => {
      const overlay = t.querySelector(".active-indicator");
      if (i === index) {
        t.classList.remove("opacity-70");
        t.classList.add("opacity-100", "ring-2", "ring-primary");
        if (overlay) overlay.className = "absolute inset-0 bg-primary/20 pointer-events-none active-indicator";
      } else {
        t.classList.remove("opacity-100", "ring-2", "ring-primary");
        t.classList.add("opacity-70");
        if (overlay) overlay.className = "absolute inset-0 bg-transparent pointer-events-none active-indicator";
      }
    });

    const counter = document.getElementById("gallery-counter");
    if (counter && product.gallery) {
      counter.textContent = `صورة ${index + 1} من ${product.gallery.length}`;
    }
  };

  window.toggleFulfillment = (fee) => {
    fulfillmentFee = Number(fee);
    updateSummary();
  };

  document.querySelectorAll("[data-rental-duration]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-rental-duration]").forEach(b => {
        b.classList.remove("border-primary", "bg-primary-fixed/20", "font-bold");
      });
      btn.classList.add("border-primary", "bg-primary-fixed/20", "font-bold");
      activeDurationMode = btn.getAttribute("data-rental-duration");

      if (activeDurationMode === "day") {
        baseRate = product.dailyRate;
      } else if (activeDurationMode === "week") {
        baseRate = product.weeklyRate;
      } else {
        baseRate = product.weekendRate;
      }

      updateSummary();
    });
  });

  window.updateSummary = () => {
    let addonsTotal = 0;
    const addonMattress = document.getElementById("addon-mattress");
    const addonSetup = document.getElementById("addon-setup");
    const addonLights = document.getElementById("addon-lights");
    const addonHeater = document.getElementById("addon-heater");
    const addonWaiver = document.getElementById("addon-waiver");

    if (addonMattress && addonMattress.checked) addonsTotal += 500;
    if (addonSetup && addonSetup.checked) addonsTotal += 1200;
    if (addonLights && addonLights.checked) addonsTotal += 300;
    if (addonHeater && addonHeater.checked) addonsTotal += 450;

    let waiverTotal = (addonWaiver && addonWaiver.checked) ? 250 : 0;

    const summaryBase = document.getElementById("summary-base");
    const summaryShipping = document.getElementById("summary-shipping");
    const summaryAddons = document.getElementById("summary-addons");
    const summaryWaiver = document.getElementById("summary-waiver");
    const summaryTotal = document.getElementById("summary-total");

    if (summaryBase) summaryBase.textContent = `${baseRate.toLocaleString('ar-EG')} ج.م`;
    if (summaryShipping) summaryShipping.textContent = `${fulfillmentFee.toLocaleString('ar-EG')} ج.م`;
    if (summaryAddons) summaryAddons.textContent = `${addonsTotal.toLocaleString('ar-EG')} ج.م`;
    if (summaryWaiver) summaryWaiver.textContent = `${waiverTotal.toLocaleString('ar-EG')} ج.م`;

    const grandTotal = Math.max(0, (baseRate + fulfillmentFee + addonsTotal + waiverTotal) - promoDiscount);
    if (summaryTotal) summaryTotal.textContent = `${grandTotal.toLocaleString('ar-EG')} ج.م`;

    const startDateInput = document.getElementById("date-start");
    const endDateInput = document.getElementById("date-end");
    const ctaText = document.getElementById("cta-button-text");
    if (startDateInput && endDateInput && ctaText && startDateInput.value && endDateInput.value) {
      ctaText.textContent = `احجز المعدات للفترة من ${startDateInput.value} إلى ${endDateInput.value}`;
    }
  };

  ["addon-mattress", "addon-setup", "addon-lights", "addon-heater", "addon-waiver", "date-start", "date-end"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", window.updateSummary);
  });

  const addToCartBtn = document.getElementById("p-add-to-cart-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      const configuredItem = buildConfiguredCartItem();
      GatherApp.addToCart(configuredItem);
    });
  }

  const reserveBtn = document.getElementById("p-reserve-cta-btn");
  if (reserveBtn) {
    reserveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const configuredItem = buildConfiguredCartItem();
      GatherApp.addToCart(configuredItem);
      window.location.href = "checkout.html";
    });
  }

  function buildConfiguredCartItem() {
    const selectedAddons = [];
    if (document.getElementById("addon-mattress")?.checked) selectedAddons.push("طقم أسرّة ومفارش (+500 ج.م)");
    if (document.getElementById("addon-setup")?.checked) selectedAddons.push("تركيب وفك احترافي (+1,200 ج.م)");
    if (document.getElementById("addon-lights")?.checked) selectedAddons.push("إضاءة دافئة (+300 ج.م)");
    if (document.getElementById("addon-heater")?.checked) selectedAddons.push("مدفأة تخييم (+450 ج.م)");
    if (document.getElementById("addon-waiver")?.checked) selectedAddons.push("وثيقة حماية من التلف (+250 ج.م)");

    return {
      id: product.id,
      name: product.name,
      rate: baseRate,
      rateLabel: `${baseRate.toLocaleString('ar-EG')} ج.م / ${activeDurationMode === "day" ? "يوم" : (activeDurationMode === "week" ? "أسبوع" : "باقة نهاية الأسبوع")}`,
      days: activeDurationMode === "day" ? 1 : (activeDurationMode === "week" ? 7 : 3),
      qty: 1,
      image: product.image,
      options: selectedAddons.length > 0 ? selectedAddons.join("، ") : "باقة قياسية معتمدة"
    };
  }

  updateSummary();
});
