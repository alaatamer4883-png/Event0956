/**
 * Gather & Roam - Catalog & Filtering Controller (باللغة العربية)
 */

document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.getElementById("productGrid");
  const searchInput = document.getElementById("catalog-search");
  const sortSelect = document.getElementById("sort-select");
  const priceSlider = document.getElementById("price-range-slider");
  const priceValueDisplay = document.getElementById("price-value-display");
  const viewGridBtn = document.getElementById("viewGridBtn");
  const viewListBtn = document.getElementById("viewListBtn");
  const itemsCountDisplay = document.getElementById("items-count-display");

  let currentView = "grid";
  let activeCategory = "all";
  let activeDurationMode = "weekend"; // day, weekend, week
  let maxPrice = 12000;
  let activeAvailability = "all";

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get("q") || "";
  const initialCat = urlParams.get("cat") || "all";
  if (initialQuery && searchInput) searchInput.value = initialQuery;

  let currentTypeFilter = urlParams.get("type") || GatherApp.getMode() || "all";

  // Category filter buttons
  document.querySelectorAll("[data-cat]").forEach(btn => {
    if (btn.getAttribute("data-cat") === initialCat) {
      document.querySelectorAll("[data-cat]").forEach(b => {
        b.classList.remove("bg-primary", "text-on-primary", "font-bold");
        b.classList.add("bg-surface-container", "text-on-surface");
      });
      btn.classList.add("bg-primary", "text-on-primary", "font-bold");
      btn.classList.remove("bg-surface-container", "text-on-surface");
      activeCategory = initialCat;
    }

    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-cat]").forEach(b => {
        b.classList.remove("bg-primary", "text-on-primary", "font-bold");
        b.classList.add("bg-surface-container", "text-on-surface");
      });
      btn.classList.add("bg-primary", "text-on-primary", "font-bold");
      btn.classList.remove("bg-surface-container", "text-on-surface");
      activeCategory = btn.getAttribute("data-cat");
      renderProducts();
    });
  });

  // Price slider
  if (priceSlider) {
    priceSlider.addEventListener("input", (e) => {
      maxPrice = Number(e.target.value);
      if (priceValueDisplay) priceValueDisplay.textContent = `${maxPrice.toLocaleString('ar-EG')} ج.م`;
      renderProducts();
    });
  }

  // Search input
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderProducts();
    });
  }

  // Sort select
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      renderProducts();
    });
  }

  // Grid / List toggle
  if (viewGridBtn && viewListBtn) {
    viewGridBtn.addEventListener("click", () => {
      currentView = "grid";
      viewGridBtn.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm");
      viewGridBtn.classList.remove("text-on-surface-variant");
      viewListBtn.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm");
      viewListBtn.classList.add("text-on-surface-variant");
      renderProducts();
    });

    viewListBtn.addEventListener("click", () => {
      currentView = "list";
      viewListBtn.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm");
      viewListBtn.classList.remove("text-on-surface-variant");
      viewGridBtn.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm");
      viewGridBtn.classList.add("text-on-surface-variant");
      renderProducts();
    });
  }

  // Availability Radio
  document.querySelectorAll("input[name='avail']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "instant") activeAvailability = "instant";
      else if (val === "limited") activeAvailability = "limited";
      else activeAvailability = "all";
      renderProducts();
    });
  });

  // Duration mode buttons
  document.querySelectorAll("[data-duration]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-duration]").forEach(b => {
        b.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm", "font-bold");
        b.classList.add("text-on-surface-variant");
      });
      btn.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm", "font-bold");
      btn.classList.remove("text-on-surface-variant");
      activeDurationMode = btn.getAttribute("data-duration");
      renderProducts();
    });
  });

  window.addEventListener("gather-mode-changed", (e) => {
    currentTypeFilter = e.detail.mode;
    renderProducts();
  });

  function renderProducts() {
    if (!productGrid || !window.GATHER_PRODUCTS) return;

    let items = [...window.GATHER_PRODUCTS];
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();

    // Filter by type
    if (currentTypeFilter && currentTypeFilter !== "all") {
      items = items.filter(p => p.type === currentTypeFilter || p.type === "both");
    }

    // Filter by category
    if (activeCategory && activeCategory !== "all") {
      items = items.filter(p => p.category === activeCategory);
    }

    // Filter by price
    items = items.filter(p => {
      const rate = activeDurationMode === "day" ? p.dailyRate : (activeDurationMode === "week" ? p.weeklyRate : p.weekendRate);
      return rate <= maxPrice;
    });

    // Filter by availability
    if (activeAvailability === "instant") {
      items = items.filter(p => p.instantBook);
    } else if (activeAvailability === "limited") {
      items = items.filter(p => p.unitsLeft <= 3);
    }

    // Filter by search query
    if (query) {
      items = items.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.categoryLabel.toLowerCase().includes(query) ||
        p.shortDesc.toLowerCase().includes(query) ||
        p.specs.some(s => s.toLowerCase().includes(query))
      );
    }

    // Sorting
    const sortVal = sortSelect ? sortSelect.value : "popular";
    if (sortVal === "price-asc") {
      items.sort((a, b) => a.dailyRate - b.dailyRate);
    } else if (sortVal === "price-desc") {
      items.sort((a, b) => b.dailyRate - a.dailyRate);
    } else if (sortVal === "availability") {
      items.sort((a, b) => b.unitsLeft - a.unitsLeft);
    } else {
      items.sort((a, b) => b.rating - a.rating);
    }

    // Update count display in Arabic
    if (itemsCountDisplay) {
      itemsCountDisplay.innerHTML = `<span class="w-2 h-2 rounded-full bg-primary-fixed-variant animate-pulse"></span> ${items.length} قطعة معدات متاحة`;
    }

    if (items.length === 0) {
      productGrid.className = "w-full py-16 flex flex-col items-center justify-center text-center";
      productGrid.innerHTML = `
        <div class="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-4">
          <span class="material-symbols-outlined text-[32px]">inventory_2</span>
        </div>
        <h3 class="font-headline-sm text-lg font-bold text-primary">لا توجد معدات مطابقة للبحث أو الفلاتر</h3>
        <p class="text-xs text-on-surface-variant max-w-sm mt-1">جرب توسيع نطاق السعر أو اختيار فئة أخرى لاستعراض أسطولنا الكامل.</p>
        <button type="button" onclick="window.resetCatalogFilters()" class="mt-4 px-5 py-2.5 rounded-xl bg-secondary text-white font-bold text-xs">إعادة ضبط الفلاتر</button>
      `;
      return;
    }

    if (currentView === "grid") {
      productGrid.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6";
      productGrid.innerHTML = items.map(p => {
        return `
          <article class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group border border-outline-variant/20">
            <div class="relative w-full aspect-[4/3] bg-surface-container-high overflow-hidden">
              <a href="product-detail.html?id=${p.id}" class="block w-full h-full">
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                     src="${p.image}" alt="${p.name}" loading="lazy" />
              </a>
              <div class="absolute top-3 right-3">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${p.unitsLeft <= 2 ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary text-white'} text-xs font-bold shadow-sm">
                  <span class="w-1.5 h-1.5 rounded-full ${p.unitsLeft <= 2 ? 'bg-secondary' : 'bg-primary-fixed'} animate-pulse"></span>
                  ${p.unitsLeft <= 2 ? `متبقي ${p.unitsLeft} فقط` : (p.badge || 'متوفر بالمخزون')}
                </span>
              </div>
              <button onclick="GatherApp.showToast('تمت الإضافة للمفضلة!', 'info')" aria-label="حفظ في المفضلة" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center text-on-surface hover:text-secondary transition-colors shadow-sm" type="button">
                <span class="material-symbols-outlined text-[18px]">favorite</span>
              </button>
            </div>
            <div class="p-5 flex flex-col flex-1 justify-between gap-4">
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] uppercase tracking-wider text-secondary font-bold">${p.categoryLabel}</span>
                  <span class="flex items-center gap-1 text-xs text-on-surface font-bold">
                    <span class="material-symbols-outlined text-[14px] text-secondary" style="font-variation-settings: 'FILL' 1;">star</span>
                    ${p.rating} (${p.reviewsCount})
                  </span>
                </div>
                <a href="product-detail.html?id=${p.id}" class="block">
                  <h3 class="font-headline-sm text-base font-bold text-primary group-hover:text-secondary transition-colors leading-snug line-clamp-2">
                    ${p.name}
                  </h3>
                </a>
                <div class="flex flex-wrap gap-1.5 pt-1 text-[11px] text-on-surface-variant font-medium">
                  ${p.specs.slice(0, 3).map(s => `<span class="px-2 py-0.5 rounded-lg bg-surface-container">${s}</span>`).join('')}
                </div>
              </div>
              <div class="pt-3 flex items-end justify-between border-t border-outline-variant/15 mt-1">
                <div>
                  <span class="text-[11px] text-on-surface-variant block mb-0.5">سعر الإيجار</span>
                  <div class="flex items-baseline gap-1.5">
                    <span class="font-price-tag text-xl font-bold text-primary">${p.dailyRate.toLocaleString('ar-EG')}</span>
                    <span class="price-egp-currency">ج.م</span>
                    <span class="text-xs text-on-surface-variant">/ يوم</span>
                  </div>
                  <span class="text-[11px] text-secondary font-bold block mt-0.5">${p.weekendRate.toLocaleString('ar-EG')} ج.م / باقة نهاية الأسبوع</span>
                </div>
                <a href="product-detail.html?id=${p.id}" class="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all shadow-sm">
                  تخصيص وتأجير
                </a>
              </div>
            </div>
          </article>
        `;
      }).join('');
    } else {
      // List view
      productGrid.className = "flex flex-col gap-4";
      productGrid.innerHTML = items.map(p => `
        <article class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row group border border-outline-variant/20">
          <div class="relative w-full sm:w-64 aspect-[4/3] sm:aspect-square bg-surface-container-high overflow-hidden shrink-0">
            <a href="product-detail.html?id=${p.id}" class="block w-full h-full">
              <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                   src="${p.image}" alt="${p.name}" loading="lazy" />
            </a>
            <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full ${p.unitsLeft <= 2 ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary text-white'} text-xs font-bold">
              ${p.unitsLeft <= 2 ? `متبقي ${p.unitsLeft}` : 'متوفر'}
            </span>
          </div>
          <div class="p-5 flex flex-col justify-between flex-1 gap-3">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] uppercase tracking-wider text-secondary font-bold">${p.categoryLabel}</span>
                <span class="flex items-center gap-1 text-xs font-bold text-on-surface">
                  <span class="material-symbols-outlined text-secondary text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
                  ${p.rating} (${p.reviewsCount} تقييم)
                </span>
              </div>
              <a href="product-detail.html?id=${p.id}">
                <h3 class="font-headline-sm text-base font-bold text-primary hover:text-secondary transition-colors mb-1">
                  ${p.name}
                </h3>
              </a>
              <p class="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">${p.shortDesc}</p>
              <div class="flex flex-wrap gap-1.5 pt-2 text-[11px] text-on-surface-variant">
                ${p.specs.map(s => `<span class="px-2 py-0.5 rounded-lg bg-surface-container">${s}</span>`).join('')}
              </div>
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-outline-variant/15">
              <div class="flex items-baseline gap-2">
                <span class="font-price-tag text-xl font-bold text-primary">${p.dailyRate.toLocaleString('ar-EG')}</span>
                <span class="price-egp-currency">ج.م</span>
                <span class="text-xs text-on-surface-variant">/ يوم</span>
                <span class="text-secondary font-bold text-xs mr-2">(${p.weekendRate.toLocaleString('ar-EG')} ج.م / عطلة الأسبوع)</span>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="GatherApp.addToCart(window.GATHER_PRODUCTS.find(x => x.id === '${p.id}'))" class="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs">
                  أضف للسلة
                </button>
                <a href="product-detail.html?id=${p.id}" class="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container">
                  تخصيص القطعة
                </a>
              </div>
            </div>
          </div>
        </article>
      `).join('');
    }
  }

  window.resetCatalogFilters = () => {
    if (searchInput) searchInput.value = "";
    if (priceSlider) {
      priceSlider.value = 12000;
      maxPrice = 12000;
      if (priceValueDisplay) priceValueDisplay.textContent = "12,000 ج.م";
    }
    activeCategory = "all";
    activeAvailability = "all";
    document.querySelectorAll("[data-cat]").forEach(b => {
      b.classList.remove("bg-primary", "text-on-primary", "font-bold");
      b.classList.add("bg-surface-container", "text-on-surface");
    });
    const allCatBtn = document.querySelector("[data-cat='all']");
    if (allCatBtn) allCatBtn.classList.add("bg-primary", "text-on-primary", "font-bold");
    renderProducts();
    GatherApp.showToast("تمت إعادة ضبط جميع الفلاتر للوضع الافتراضي.", "info");
  };

  renderProducts();
});
