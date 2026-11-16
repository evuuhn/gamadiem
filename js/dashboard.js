let isLoggedIn = false;
try {
  isLoggedIn = localStorage.getItem("gamadiem_isLoggedIn") === "true";
} catch (error) {
  console.error("Could not read Gamadiem login status.", error);
}

if (!isLoggedIn) {
  window.location.replace("index.html");
} else {
const feedbackEl = document.getElementById("feedback");
let feedbackTimer;

function showFeedback(message, isError) {
  feedbackEl.textContent = message;
  feedbackEl.classList.toggle("error", Boolean(isError));
  feedbackEl.classList.add("visible");
  window.clearTimeout(feedbackTimer);
  feedbackTimer = window.setTimeout(function () {
    feedbackEl.classList.remove("visible");
  }, 3200);
}

function loadArray(key, fallback, isValidItem) {
  let serialized;
  try {
    serialized = localStorage.getItem(key);
  } catch (error) {
    console.error("Could not read " + key + " from localStorage.", error);
    showFeedback("Data lokal tidak dapat dibaca. Periksa pengaturan browser.", true);
    return fallback.map(function (item) { return { ...item }; });
  }

  if (serialized === null) {
    return fallback.map(function (item) { return { ...item }; });
  }

  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    console.error("Stored " + key + " data is not valid JSON.", error);
    showFeedback("Data " + key + " rusak dan tidak dapat dimuat.", true);
    return fallback.map(function (item) { return { ...item }; });
  }

  if (!Array.isArray(parsed)) {
    console.error("Stored " + key + " data must be an array.");
    showFeedback("Format data " + key + " tidak valid.", true);
    return fallback.map(function (item) { return { ...item }; });
  }

  const validItems = parsed.filter(isValidItem);
  if (validItems.length !== parsed.length) {
    console.error("Some stored " + key + " entries were invalid and skipped.");
    showFeedback("Sebagian data " + key + " tidak valid dan dilewati.", true);
  }
  return validItems;
}

function saveArray(key, items) {
  try {
    if (key === "history") {
      window.GamadiemFinance.saveHistory(items);
    } else {
      localStorage.setItem(key, JSON.stringify(items));
    }
    return true;
  } catch (error) {
    console.error("Could not save " + key + " to localStorage.", error);
    showFeedback("Data tidak berhasil disimpan. Periksa ruang penyimpanan browser.", true);
    return false;
  }
}

function isValidTransaction(item) {
  return item !== null &&
    typeof item === "object" &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    Number.isSafeInteger(item.amount) &&
    item.amount > 0 &&
    typeof item.date === "string";
}

function isValidWishlistItem(item) {
  return item !== null &&
    typeof item === "object" &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    Number.isSafeInteger(item.amount) &&
    item.amount > 0;
}

const state = {
  history: loadArray("history", [], isValidTransaction),
  wishlist: loadArray("wishlist", [], isValidWishlistItem)
};
let financialSettings = null;
try {
  financialSettings = window.GamadiemFinance.loadSettings();
  if (!financialSettings) {
    showFeedback("Pengaturan keuangan tidak ditemukan. Lengkapi pengaturan akun terlebih dahulu.", true);
  } else {
    window.GamadiemFinance.renderUserIdentity(financialSettings);
  }
} catch (error) {
  console.error("Could not load financial settings for the dashboard.", error);
  showFeedback("Pengaturan keuangan tidak dapat dibaca.", true);
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function formatRupiah(amount) {
  return "Rp. " + amount.toLocaleString("id-ID");
}

function formatThousands(value) {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseRupiahInput(input) {
  const digits = input.value.replace(/\D/g, "");
  return digits ? Number(digits) : NaN;
}

function attachThousandsFormatter(input) {
  input.addEventListener("input", function () {
    const rawValue = input.value;
    const cursor = input.selectionStart === null ? rawValue.length : input.selectionStart;
    const digitsBeforeCursor = rawValue.slice(0, cursor).replace(/\D/g, "").length;
    const formattedValue = formatThousands(rawValue);
    input.value = formattedValue;

    let nextCursor = 0;
    let digitsCounted = 0;
    while (nextCursor < formattedValue.length && digitsCounted < digitsBeforeCursor) {
      if (/\d/.test(formattedValue.charAt(nextCursor))) digitsCounted += 1;
      nextCursor += 1;
    }
    input.setSelectionRange(nextCursor, nextCursor);
  });
}

function renderWishlist() {
  const wishlistEl = document.getElementById("wishlist");
  wishlistEl.replaceChildren();

  if (state.wishlist.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "wishlist-empty";
    emptyState.textContent = "No wishlist items yet.";
    wishlistEl.appendChild(emptyState);
    return;
  }

  state.wishlist.forEach(function (item) {
    const row = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = item.name;
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = formatRupiah(item.amount);
    row.append(name, price);
    wishlistEl.appendChild(row);
  });
}

function renderBalances() {
  const balances = financialSettings
    ? window.GamadiemFinance.calculateBalances(financialSettings, state.history, new Date())
    : { spendableBalance: 0, piggyBank: 0, safeToSpendToday: 0 };

  document.getElementById("spendableBalance").textContent = formatRupiah(balances.spendableBalance);
  document.getElementById("virtualPiggyBank").textContent = formatRupiah(balances.piggyBank);
  document.getElementById("safeToSpendToday").textContent = formatRupiah(balances.safeToSpendToday);
}

const dateEl = document.getElementById("date");
const today = new Date();
dateEl.textContent = today.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});
dateEl.dateTime = localDateKey(today);

document.getElementById("logoutLink").addEventListener("click", function (event) {
  event.preventDefault();
  openLogoutModal();
});

const logoutModal = document.getElementById("logoutModal");
const logoutLink = document.getElementById("logoutLink");
const cancelLogoutButton = document.getElementById("cancelLogout");
const confirmLogoutButton = document.getElementById("confirmLogout");

function openLogoutModal() {
  logoutModal.classList.remove("hidden");
  logoutModal.setAttribute("aria-hidden", "false");
  confirmLogoutButton.focus();
}

function closeLogoutModal() {
  logoutModal.classList.add("hidden");
  logoutModal.setAttribute("aria-hidden", "true");
  logoutLink.focus();
}

cancelLogoutButton.addEventListener("click", closeLogoutModal);
logoutModal.addEventListener("click", function (event) {
  if (event.target === logoutModal) closeLogoutModal();
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !logoutModal.classList.contains("hidden")) {
    closeLogoutModal();
  }
});
confirmLogoutButton.addEventListener("click", function () {
  try {
    localStorage.removeItem("gamadiem_isLoggedIn");
  } catch (error) {
    console.error("Could not clear Gamadiem login status.", error);
    showFeedback("Status login tidak dapat dihapus. Coba lagi.", true);
    return;
  }
  window.location.assign("index.html");
});

const catButtons = document.querySelectorAll(".cat");
catButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    catButtons.forEach(function (categoryButton) {
      categoryButton.classList.remove("active");
      categoryButton.setAttribute("aria-pressed", "false");
    });
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
  });
});

attachThousandsFormatter(document.getElementById("price"));
attachThousandsFormatter(document.getElementById("wishlistPrice"));

document.getElementById("buyForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("itemName").value.trim();
  const amount = parseRupiahInput(document.getElementById("price"));
  if (!name || !Number.isSafeInteger(amount) || amount <= 0) {
    showFeedback("Masukkan nama barang dan nominal yang valid.", true);
    return;
  }

  if (!financialSettings) {
    showFeedback("Pengaturan keuangan tidak tersedia. Perbarui Settings terlebih dahulu.", true);
    return;
  }
  const spendableBalance = window.GamadiemFinance.calculateBalances(
    financialSettings,
    state.history,
    new Date()
  ).spendableBalance;
  if (amount > spendableBalance) {
    showFeedback("Pengeluaran melebihi Spendable Balance.", true);
    return;
  }

  const purchasedAt = new Date();
  const transaction = {
    name: name,
    amount: amount,
    category: document.querySelector(".cat.active").textContent.trim(),
    notes: document.getElementById("notes").value.trim(),
    date: localDateKey(purchasedAt),
    createdAt: purchasedAt.toISOString()
  };
  const updatedHistory = state.history.concat(transaction);
  if (!saveArray("history", updatedHistory)) return;

  state.history = updatedHistory;
  renderBalances();
  event.currentTarget.reset();
  catButtons.forEach(function (button, index) {
    const selected = index === 0;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  showFeedback("Pengeluaran berhasil dicatat ke History.", false);
});

document.getElementById("wishlistForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("wishlistItemName").value.trim();
  const amount = parseRupiahInput(document.getElementById("wishlistPrice"));
  if (!name || !Number.isSafeInteger(amount) || amount <= 0) {
    showFeedback("Masukkan nama item dan harga yang valid.", true);
    return;
  }

  const updatedWishlist = state.wishlist.concat({ name: name, amount: amount });
  if (!saveArray("wishlist", updatedWishlist)) return;

  state.wishlist = updatedWishlist;
  renderWishlist();
  event.currentTarget.reset();
  showFeedback("Item berhasil ditambahkan ke Wishlist.", false);
});

renderWishlist();
renderBalances();
}
