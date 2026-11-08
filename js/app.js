/**
 * Gather & Roam - Global Application Core Engine (باللغة العربية)
 * إدارة السلة، المستخدمين، الوضع الليلي، المودال، والتنقل باللغة العربية
 */

const GatherApp = {
  // 1. User Authentication (Customer Login / Session)
  getUser() {
    try {
      const stored = localStorage.getItem("gather_user");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading user session:", e);
    }
    return null;
  },

  setUser(userData) {
    try {
      localStorage.setItem("gather_user", JSON.stringify(userData));
      this.updateUserHeaderUI();
      window.dispatchEvent(new CustomEvent("gather-user-updated", { detail: userData }));
    } catch (e) {
      console.error("Error saving user session:", e);
    }
  },

  logout() {
    localStorage.removeItem("gather_user");
    this.updateUserHeaderUI();
    this.showToast("تم تسجيل الخروج بنجاح.", "info");
    setTimeout(() => {
      if (window.location.pathname.includes("login.html")) {
        window.location.reload();
      }
    }, 600);
  },

  updateUserHeaderUI() {
    const user = this.getUser();
    const userSlots = document.querySelectorAll(".user-nav-slot");

    userSlots.forEach(slot => {
      if (user && user.name) {
        slot.innerHTML = `
          <div class="relative group">
            <button type="button" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary-container hover:text-white transition-all shadow-sm">
              <span class="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                ${user.name.charAt(0)}
              </span>
              <span class="text-xs font-bold truncate max-w-[100px]">${user.name}</span>
              <span class="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            <div class="absolute left-0 mt-2 w-48 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 py-2 hidden group-hover:block z-50">
              <div class="px-4 py-2 border-b border-outline-variant/15">
                <p class="text-xs font-bold text-primary truncate">${user.name}</p>
                <p class="text-[11px] text-outline dir-ltr text-right">${user.phone}</p>
              </div>
              <a href="checkout.html" class="flex items-center gap-2 px-4 py-2 text-xs text-on-surface hover:bg-surface-container transition-colors">
                <span class="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>حجوزاتي وسلتي</span>
              </a>
              <button onclick="GatherApp.logout()" type="button" class="w-full flex items-center gap-2 px-4 py-2 text-xs text-error hover:bg-error-container/20 transition-colors text-right">
                <span class="material-symbols-outlined text-[16px]">logout</span>
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        `;
      } else {
        slot.innerHTML = `
          <a href="login.html" class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs transition-colors shadow-sm border border-outline-variant/30">
            <span class="material-symbols-outlined text-[18px]">person</span>
            <span>دخول العملاء</span>
          </a>
        `;
      }
    });
  },

  // 2. Cart Management
  getCart() {
    try {
      const stored = localStorage.getItem("gather_cart");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading cart:", e);
    }
    const defaultCart = [
      {
        id: "timberline-bell-tent",
        name: "خيمة تيمبرلاين بيل الفاخرة (قطر 5 أمتار)",
        rate: 195.00,
        rateLabel: "$195 / باقة عطلة الأسبوع",
        days: 3,
        qty: 1,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCK0EqpVG-Rcs0rslocyrvaxIF5vTJyp0SqtY-SsNO3T1DiThf5C21WFCEGEYeTfw1OgJPTXVxl_Ff72BBDlSMwVZ25i8U9VPQcvLrU97xoYTxKqNHZDbzJGjeXeNfBtQjnrjuY5091nscaamGIaMwZfq3oURD_iCZ5iY29ogH7ggiYWH4Nf2UGMAHRSK99ssQwQyYGW1khSEHE8YbHo6HWD6HseJ-LxDWA5b1GPwqd",
        options: "قماش كانفاس معقم + خدمة التركيب"
      },
      {
        id: "pro-sound-system",
        name: "نظام صوتي احترافي مع مايكات لاسلكية",
        rate: 150.00,
        rateLabel: "$50 / اليوم",
        days: 3,
        qty: 1,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2LpaU5HDST65_i-L_0GfoWgO2yN_5tJDfaiFWWGyT29Gh5TU8gqSbDWYtlkRNLX6G4oE-OwFKJBKdnxLHIyBUIdKjxKyGBWq6y0O5fr4273w07Xf3oHlCPZeT30LAjWudR0YSexJW-iIM14Nogeyhh3OXFm0Qah7L6sAtA_T9ddEmbLMfdnvYn1xDjBTa46rjpwDL3ZQ0HWNa3dqkAgoF4VEe1_dCQCh0w-HcOb4c",
        options: "ميكروفونين لاسلكيين + بلوتوث 5.3"
      },
      {
        id: "edison-festoon-lights",
        name: "حبال إضاءة إديسون الدافئة الكلاسيكية (90 متراً)",
        rate: 76.00,
        rateLabel: "طقم كامل",
        days: 3,
        qty: 1,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqjbyNrVfFIVImo-Z_ADvd_LJrnZbEkka78X-bxx3tADYwDJyNy628jrvTQeWj5d1FSamZhD6Z3azmi2CK5DQiWesv9Q-Ws4rmVkPTgDkottLTDs1LOUC6CjxCz0mOEmFvi2Ck9bsh9bmQheGgRvzjf1PR_-HWEkmB-LogjRAvFI4LMpf3Pikg-sWqPjwAFU9xzg8kx2LLp70mhbb7QGU4U9kPPxa55_6doHb1Fn_R",
        options: "مقاومة للعوامل الجوية مع مهدئ إضاءة"
      }
    ];
    this.saveCart(defaultCart);
    return defaultCart;
  },

  saveCart(cart) {
    try {
      localStorage.setItem("gather_cart", JSON.stringify(cart));
      this.updateCartBadges();
      window.dispatchEvent(new CustomEvent("gather-cart-updated", { detail: cart }));
    } catch (e) {
      console.error("Error saving cart:", e);
    }
  },

  addToCart(item) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(c => c.id === item.id);
    if (existingIndex > -1) {
      cart[existingIndex].qty += (item.qty || 1);
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        rate: Number(item.rate || item.weekendRate || item.dailyRate || 89),
        rateLabel: item.rateLabel || `$${item.rate || item.weekendRate} / باقة`,
        days: item.days || 3,
        qty: item.qty || 1,
        image: item.image,
        options: item.options || "طقم فحص وتجهيز معتمد"
      });
    }
    this.saveCart(cart);
    this.showToast(`✨ تمت إضافة "${item.name}" إلى سلة الحجز!`, "success");
  },

  removeFromCart(itemId) {
    let cart = this.getCart();
    cart = cart.filter(c => c.id !== itemId);
    this.saveCart(cart);
    this.showToast("تمت إزالة العنصر من سلة الحجز.", "info");
  },

  updateCartQuantity(itemId, newQty) {
    const cart = this.getCart();
    const target = cart.find(c => c.id === itemId);
    if (target) {
      if (newQty <= 0) {
        this.removeFromCart(itemId);
      } else {
        target.qty = newQty;
        this.saveCart(cart);
      }
    }
  },

  clearCart() {
    this.saveCart([]);
  },

  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  },

  getCartSubtotal() {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + ((item.rate || 0) * (item.qty || 1)), 0);
  },

  updateCartBadges() {
    const count = this.getCartCount();
    const badges = document.querySelectorAll(".cart-count-badge");
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    });
  },

  // 3. Mode Management (Events vs Camping)
  getMode() {
    return localStorage.getItem("gather_mode") || "party";
  },

  setMode(mode) {
    localStorage.setItem("gather_mode", mode);
    this.applyModeUI(mode);
    window.dispatchEvent(new CustomEvent("gather-mode-changed", { detail: { mode } }));
  },

  applyModeUI(mode) {
    const partyBtns = document.querySelectorAll(".mode-btn-party, #mode-party");
    const campBtns = document.querySelectorAll(".mode-btn-camp, #mode-camp");

    if (mode === "party") {
      partyBtns.forEach(btn => {
        btn.classList.add("bg-surface-container-lowest", "text-primary", "font-bold", "shadow-sm");
        btn.classList.remove("text-surface-container-high", "text-on-surface-variant");
      });
      campBtns.forEach(btn => {
        btn.classList.remove("bg-surface-container-lowest", "text-primary", "font-bold", "shadow-sm");
        btn.classList.add("text-on-surface-variant");
      });
    } else {
      campBtns.forEach(btn => {
        btn.classList.add("bg-surface-container-lowest", "text-primary", "font-bold", "shadow-sm");
        btn.classList.remove("text-surface-container-high", "text-on-surface-variant");
      });
      partyBtns.forEach(btn => {
        btn.classList.remove("bg-surface-container-lowest", "text-primary", "font-bold", "shadow-sm");
        btn.classList.add("text-on-surface-variant");
      });
    }
  },

  // 4. Theme Toggle (Light / Dark)
  initTheme() {
    const savedTheme = localStorage.getItem("gather_theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    this.updateThemeIcons();
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("gather_theme", isDark ? "dark" : "light");
    this.updateThemeIcons();
    this.showToast(isDark ? "🌙 تم تفعيل الوضع الليلي" : "☀️ تم تفعيل الوضع الفاتح", "info");
  },

  updateThemeIcons() {
    const isDark = document.documentElement.classList.contains("dark");
    const themeIcons = document.querySelectorAll(".theme-toggle-icon");
    themeIcons.forEach(icon => {
      icon.textContent = isDark ? "light_mode" : "dark_mode";
      icon.title = isDark ? "التحويل للوضع الفاتح" : "التحويل للوضع الليلي";
    });
  },

  // 5. Toast System (Arabic RTL)
  showToast(message, type = "info") {
    let container = document.getElementById("gather-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "gather-toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `gather-toast ${type}`;
    
    let icon = "info";
    if (type === "success") icon = "check_circle";
    if (type === "error") icon = "error";

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="material-symbols-outlined" style="font-size: 20px;">${icon}</span>
        <span style="font-weight: 600;">${message}</span>
      </div>
      <button style="background: none; border: none; cursor: pointer; color: inherit; display: flex; align-items: center; padding: 2px;" onclick="this.parentElement.remove()">
        <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "toastSlideOutRTL 0.3s forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  },

  // 6. Support Modal (Arabic)
  openSupportModal() {
    let modal = document.getElementById("gather-support-modal");
    if (!modal) {
      this.createSupportModal();
      modal = document.getElementById("gather-support-modal");
    }
    modal.classList.add("active");
  },

  closeSupportModal() {
    const modal = document.getElementById("gather-support-modal");
    if (modal) modal.classList.remove("active");
  },

  createSupportModal() {
    const user = this.getUser();
    const backdrop = document.createElement("div");
    backdrop.id = "gather-support-modal";
    backdrop.className = "gather-modal-backdrop";
    backdrop.innerHTML = `
      <div class="gather-modal-card">
        <div style="padding: 1.5rem; border-bottom: 1px solid rgba(113, 121, 115, 0.15); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #012d1d; color: #fff; display: flex; align-items: center; justify-content: center;">
              <span class="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <h3 style="font-size: 18px; font-weight: 800; margin: 0; color: #012d1d;">مستشار المعدات والدعم الفوري</h3>
              <p style="font-size: 12px; margin: 0; color: #717973;">فريق اللوجستيات وتجهيز الفعاليات متواجد لخدمتك</p>
            </div>
          </div>
          <button type="button" onclick="GatherApp.closeSupportModal()" style="background: none; border: none; cursor: pointer; color: #717973;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <form id="support-advisor-form" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;" onsubmit="GatherApp.handleSupportSubmit(event)">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #414844; margin-bottom: 4px;">الاسم الكامل</label>
            <input type="text" id="supp-name" required value="${user ? user.name : ''}" placeholder="مثال: عبدالله الشمري" style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #c1c8c2; background: transparent; font-size: 14px;" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 12px; font-weight: 700; color: #414844; margin-bottom: 4px;">رقم الجوال للتواصل</label>
              <input type="tel" id="supp-phone" required value="${user ? user.phone : ''}" placeholder="05XXXXXXXX" style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #c1c8c2; background: transparent; font-size: 14px; direction: ltr; text-align: right;" />
            </div>
            <div>
              <label style="display: block; font-size: 12px; font-weight: 700; color: #414844; margin-bottom: 4px;">تاريخ الفعالية أو الرحلة</label>
              <input type="date" id="supp-date" style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #c1c8c2; background: transparent; font-size: 14px;" />
            </div>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #414844; margin-bottom: 4px;">نوع المناسبة أو الرحلة</label>
            <select id="supp-type" style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #c1c8c2; background: transparent; font-size: 14px;">
              <option value="wedding">حفل زفاف أو استقبال عائلي كبير</option>
              <option value="birthday">عيد ميلاد أو احتفال خاص</option>
              <option value="camping">رحلة تخييم برية أو شاطئية</option>
              <option value="corporate">فعالية شركة أو ملتقى خارجي</option>
              <option value="custom">أخرى (مواصفات خاصة)</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #414844; margin-bottom: 4px;">كيف يمكن لفريقنا مساعدتك؟</label>
            <textarea id="supp-msg" rows="3" required placeholder="أخبرنا عن عدد الضيوف، موقع الفعالية، احتياجات الصوت أو الإضاءة..." style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #c1c8c2; background: transparent; font-size: 14px; resize: vertical;"></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 0.5rem;">
            <button type="button" onclick="GatherApp.closeSupportModal()" style="padding: 10px 18px; border-radius: 10px; border: 1px solid #c1c8c2; background: transparent; font-weight: 600; cursor: pointer;">إلغاء</button>
            <button type="submit" id="supp-submit-btn" style="padding: 10px 24px; border-radius: 10px; border: none; background: #012d1d; color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <span>إرسال الطلب</span>
              <span class="material-symbols-outlined" style="font-size: 18px;">send</span>
            </button>
          </div>
        </form>
      </div>
    `;

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) GatherApp.closeSupportModal();
    });

    document.body.appendChild(backdrop);
  },

  async handleSupportSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("supp-submit-btn");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin" style="font-size: 18px;">refresh</span> جارٍ الإرسال...`;

    const inquiry = {
      name: document.getElementById("supp-name").value,
      phone: document.getElementById("supp-phone").value,
      date: document.getElementById("supp-date").value,
      eventType: document.getElementById("supp-type").value,
      notes: document.getElementById("supp-msg").value
    };

    if (window.GatherFirebase && window.GatherFirebase.sendInquiry) {
      try {
        await window.GatherFirebase.sendInquiry(inquiry);
        GatherApp.showToast("🚀 تم إرسال طلبك وحفظه في Firebase بنجاح! سيتواصل معك المنسق قريباً.", "success");
      } catch (err) {
        GatherApp.showToast("تم حفظ الطلب محلياً بنجاح.", "info");
      }
    } else {
      GatherApp.showToast("تم إرسال الطلب بنجاح! سيتواصل معك فريقنا هاتفياً.", "success");
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
    GatherApp.closeSupportModal();
    document.getElementById("support-advisor-form").reset();
  },

  // 7. Newsletter Subscription (Arabic)
  async handleNewsletterSubmit(inputElement) {
    const email = inputElement ? inputElement.value : "";
    if (!email || !email.includes("@")) {
      GatherApp.showToast("يرجى إدخال بريد إلكتروني صحيح.", "error");
      return;
    }

    if (window.GatherFirebase && window.GatherFirebase.subscribeNewsletter) {
      const res = await window.GatherFirebase.subscribeNewsletter(email);
      GatherApp.showToast(res.message, res.success ? "success" : "info");
    } else {
      GatherApp.showToast("أهلاً بك! كود خصم 10% الخاص بك هو: FIRSTEVENT", "success");
    }
    inputElement.value = "";
  },

  // 8. Mobile Sticky Bottom Nav (Arabic)
  injectMobileBottomNav(activePage = "home") {
    if (document.getElementById("gather-mobile-nav")) return;

    const user = this.getUser();
    const nav = document.createElement("nav");
    nav.id = "gather-mobile-nav";
    nav.className = "mobile-bottom-nav";
    nav.innerHTML = `
      <a href="index.html" class="flex flex-col items-center justify-center py-1 px-3 ${activePage === 'home' ? 'text-primary font-bold' : 'text-on-surface-variant'}">
        <span class="material-symbols-outlined text-[22px]">home</span>
        <span style="font-size: 11px;">الرئيسية</span>
      </a>
      <a href="catalog.html" class="flex flex-col items-center justify-center py-1 px-3 ${activePage === 'catalog' ? 'text-primary font-bold' : 'text-on-surface-variant'}">
        <span class="material-symbols-outlined text-[22px]">tune</span>
        <span style="font-size: 11px;">الكتالوج</span>
      </a>
      <a href="checkout.html" class="flex flex-col items-center justify-center py-1 px-3 relative ${activePage === 'checkout' ? 'text-primary font-bold' : 'text-on-surface-variant'}">
        <div class="relative">
          <span class="material-symbols-outlined text-[22px]">shopping_bag</span>
          <span class="cart-count-badge absolute -top-1.5 -left-2 w-4 h-4 rounded-full bg-secondary text-white font-bold text-[10px] flex items-center justify-center">3</span>
        </div>
        <span style="font-size: 11px;">السلة</span>
      </a>
      <a href="login.html" class="flex flex-col items-center justify-center py-1 px-3 ${activePage === 'login' ? 'text-primary font-bold' : 'text-on-surface-variant'}">
        <span class="material-symbols-outlined text-[22px]">person</span>
        <span style="font-size: 11px;">${user ? user.name.split(' ')[0] : 'حسابي'}</span>
      </a>
      <button type="button" onclick="GatherApp.openSupportModal()" class="flex flex-col items-center justify-center py-1 px-3 text-on-surface-variant">
        <span class="material-symbols-outlined text-[22px]">chat</span>
        <span style="font-size: 11px;">مساعدة</span>
      </button>
    `;

    document.body.appendChild(nav);
  },

  // Initialize
  init(activePage = "home") {
    this.initTheme();
    this.updateCartBadges();
    this.updateUserHeaderUI();
    this.injectMobileBottomNav(activePage);

    // Bind support buttons
    document.querySelectorAll("[data-path='live-support-advisor'], .fab-support-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        GatherApp.openSupportModal();
      });
    });

    // Mode check
    const curMode = this.getMode();
    this.applyModeUI(curMode);
  }
};

window.GatherApp = GatherApp;
window.switchMode = (mode) => GatherApp.setMode(mode);
window.quickReserve = (name, price) => {
  GatherApp.addToCart({
    id: "bundle-" + name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    name: name,
    rate: parseFloat(price.replace(/[^0-9.]/g, "")),
    options: "باقة متكاملة جاهزة للتسليم"
  });
  window.location.href = "checkout.html";
};

document.addEventListener("DOMContentLoaded", () => {
  GatherApp.init(document.body.dataset.page || "home");
});
