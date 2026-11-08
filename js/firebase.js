// Firebase Integration for Gather & Roam Event & Trip Supplies Rental
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  setDoc,
  doc,
  query,
  where,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjPTdoEJcWd7Y4zGkkfQmace3TXVWgNHg",
  authDomain: "tast-b91f3.firebaseapp.com",
  projectId: "tast-b91f3",
  storageBucket: "tast-b91f3.firebasestorage.app",
  messagingSenderId: "129487182461",
  appId: "1:129487182461:web:8220dbc061305bf65a2f14",
  measurementId: "G-7X0N67D10R"
};

// Initialize Firebase App
let app = null;
let analytics = null;
let db = null;
let isFirebaseConnected = false;

try {
  app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined" && location.protocol.startsWith("http")) {
    try {
      analytics = getAnalytics(app);
    } catch (anErr) {
      console.warn("Firebase Analytics could not initialize on non-http origin:", anErr);
    }
  }
  db = getFirestore(app);
  isFirebaseConnected = true;
  console.log("🔥 Firebase initialized successfully with Project ID:", firebaseConfig.projectId);
} catch (error) {
  console.error("🔥 Error initializing Firebase:", error);
}

/**
 * Customer Login / Registration with Name and Phone
 * @param {string} name 
 * @param {string} phone 
 * @returns {Promise<{success: boolean, user: Object, message: string}>}
 */
export async function loginOrRegisterCustomer(name, phone) {
  const cleanName = (name || "").trim();
  const cleanPhone = (phone || "").replace(/[^0-9+]/g, "").trim();

  if (!cleanName || cleanName.length < 2) {
    return { success: false, message: "يرجى كتابة الاسم بشكل صحيح." };
  }
  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, message: "يرجى إدخال رقم هاتف صحيح." };
  }

  const userData = {
    name: cleanName,
    phone: cleanPhone,
    lastLogin: new Date().toISOString(),
    isLoggedIn: true
  };

  // Local storage cache
  try {
    localStorage.setItem("gather_user", JSON.stringify(userData));
  } catch (e) {
    console.error("Local storage error:", e);
  }

  if (!db) {
    return { success: true, user: userData, message: `أهلاً بك يا ${cleanName}! تم تسجيل الدخول بنجاح.` };
  }

  try {
    // Custom phone document ID for quick upsert
    const phoneDocId = "cust_" + cleanPhone.replace(/[^0-9]/g, "");
    await setDoc(doc(db, "customers", phoneDocId), {
      ...userData,
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (analytics) {
      logEvent(analytics, "login", { method: "phone_name" });
    }

    return { 
      success: true, 
      user: userData, 
      message: `أهلاً وسهلاً بك يا ${cleanName}! تم تسجيل الدخول وتوثيق حسابك في Firebase.` 
    };
  } catch (err) {
    console.warn("Customer Firestore write error (fallback to local):", err);
    return { 
      success: true, 
      user: userData, 
      message: `أهلاً بك يا ${cleanName}! تم حفظ الجلسة بنجاح.` 
    };
  }
}

/**
 * Save new customer booking to Firestore
 * @param {Object} bookingData 
 * @returns {Promise<{success: boolean, id: string, message: string}>}
 */
export async function saveBookingToFirestore(bookingData) {
  const localBookingId = "GR-" + Math.floor(100000 + Math.random() * 900000);
  
  const payload = {
    ...bookingData,
    bookingRef: localBookingId,
    createdAt: new Date().toISOString(),
    status: "confirmed",
    platform: "Gather & Roam Arabic Web",
    clientTimestamp: Date.now()
  };

  if (!db) {
    console.warn("Firestore not available. Saving booking locally.");
    saveBookingLocally(payload);
    return { success: true, id: localBookingId, isLocalFallback: true };
  }

  try {
    const docRef = await addDoc(collection(db, "bookings"), {
      ...payload,
      serverTime: serverTimestamp()
    });

    console.log("✅ Booking successfully saved to Firestore! Doc ID:", docRef.id);
    if (analytics) {
      logEvent(analytics, "purchase", {
        transaction_id: docRef.id,
        value: bookingData.totalAmount || 0,
        currency: "USD"
      });
    }

    saveBookingLocally({ ...payload, firestoreDocId: docRef.id });

    return { 
      success: true, 
      id: docRef.id, 
      bookingRef: localBookingId,
      message: "تم تأكيد الحجز وحفظه في قاعدة بيانات Firebase بنجاح!" 
    };
  } catch (err) {
    console.error("❌ Failed to write booking to Firestore (falling back to local storage):", err);
    saveBookingLocally(payload);
    return { 
      success: true, 
      id: localBookingId, 
      bookingRef: localBookingId,
      isLocalFallback: true,
      message: "تم حفظ الحجز محلياً بنجاح." 
    };
  }
}

/**
 * Save newsletter subscriber to Firestore
 */
export async function subscribeNewsletterToFirestore(email) {
  if (!email || !email.includes("@")) {
    return { success: false, message: "يرجى إدخال بريد إلكتروني صحيح." };
  }

  const payload = {
    email: email.trim().toLowerCase(),
    subscribedAt: new Date().toISOString(),
    source: "welcome_discount_banner"
  };

  if (!db) {
    return { success: true, message: "شكراً لاشتراكك! كود الخصم 10% الخاص بك: FIRSTEVENT" };
  }

  try {
    await addDoc(collection(db, "newsletter_subscribers"), {
      ...payload,
      serverTime: serverTimestamp()
    });
    if (analytics) {
      logEvent(analytics, "lead_newsletter", { email: payload.email });
    }
    return { success: true, message: "شكراً لاشتراكك! كود الخصم 10% الترحيبي هو: FIRSTEVENT" };
  } catch (err) {
    console.warn("Newsletter Firestore write error:", err);
    return { success: true, message: "شكراً لاشتراكك! كود الخصم الترحيبي هو FIRSTEVENT." };
  }
}

/**
 * Save live support inquiries to Firestore
 */
export async function saveSupportTicketToFirestore(ticketData) {
  const payload = {
    ...ticketData,
    createdAt: new Date().toISOString(),
    status: "open"
  };

  if (!db) {
    return { success: true, id: "TICK-" + Date.now() };
  }

  try {
    const docRef = await addDoc(collection(db, "support_inquiries"), {
      ...payload,
      serverTime: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (err) {
    console.warn("Support inquiry Firestore error:", err);
    return { success: true, id: "TICK-" + Date.now() };
  }
}

function saveBookingLocally(booking) {
  try {
    const history = JSON.parse(localStorage.getItem("gather_bookings_history") || "[]");
    history.unshift(booking);
    localStorage.setItem("gather_bookings_history", JSON.stringify(history));
    localStorage.setItem("gather_latest_booking", JSON.stringify(booking));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

// Expose on global window object
if (typeof window !== "undefined") {
  window.GatherFirebase = {
    app,
    analytics,
    db,
    isAvailable: isFirebaseConnected,
    loginOrRegister: loginOrRegisterCustomer,
    saveBooking: saveBookingToFirestore,
    subscribeNewsletter: subscribeNewsletterToFirestore,
    sendInquiry: saveSupportTicketToFirestore,
    logEvent: (name, params) => {
      if (analytics) logEvent(analytics, name, params);
    }
  };

  window.dispatchEvent(new CustomEvent("gather-firebase-ready", { detail: { isConnected: isFirebaseConnected } }));
}
