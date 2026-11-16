let authenticated = false;
try {
  authenticated = localStorage.getItem("gamadiem_isLoggedIn") === "true";
} catch (error) {
  console.error("Could not read Gamadiem login status.", error);
}

if (!authenticated) {
  window.location.replace("index.html");
} else {
  const HISTORY_KEY = "history";
  const categories = ["Food", "Transport", "Groceries", "Social"];
  const categoryIcons = {
    Food: "🍛",
    Transport: "🚌",
    Groceries: "🛒",
    Social: "🎉"
  };
  const categoryFilter = document.getElementById("historyFilters");
  const feedback = document.getElementById("feedback");
  let selectedCategory = "All";
  let feedbackTimer;

  function showFeedback(message, isError) {
    feedback.textContent = message;
    feedback.classList.toggle("error", Boolean(isError));
    feedback.classList.add("visible");
    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(function () {
      feedback.classList.remove("visible");
    }, 3500);
  }

  function readTransactions() {
    let serialized;
    try {
      serialized = localStorage.getItem(HISTORY_KEY);
    } catch (error) {
      console.error("Could not read purchase history from localStorage.", error);
      showFeedback("Riwayat transaksi tidak dapat dibaca dari browser.", true);
      return [];
    }

    if (serialized === null) return [];

    let parsed;
    try {
      parsed = JSON.parse(serialized);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      console.error("Stored purchase history is not valid JSON.", error);
      showFeedback("Data riwayat rusak dan tidak dapat dimuat.", true);
      return [];
    }

    if (!Array.isArray(parsed)) {
      console.error("Stored purchase history must be an array.");
      showFeedback("Format data riwayat tidak valid.", true);
      return [];
    }

    const transactions = parsed.filter(function (item) {
      return item !== null &&
        typeof item === "object" &&
        typeof item.name === "string" &&
        item.name.trim().length > 0 &&
        Number.isSafeInteger(item.amount) &&
        item.amount > 0;
    });

    if (transactions.length !== parsed.length) {
      console.error("Some invalid purchase history entries were skipped.");
      showFeedback("Sebagian transaksi tidak valid dan dilewati.", true);
    }
    return transactions;
  }

  const transactions = readTransactions();

  function formatCurrency(amount) {
    return "Rp " + Number(amount || 0).toLocaleString("id-ID");
  }

  function getDateKey(transaction) {
    if (typeof transaction.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
      return transaction.date;
    }

    const timestamp = transaction.createdAt || transaction.timestamp;
    if (typeof timestamp === "string") {
      const parsed = new Date(timestamp);
      if (!Number.isNaN(parsed.getTime())) return localDateKey(parsed);
    }
    return "";
  }

  function getPurchaseDate(transaction) {
    const dateKey = getDateKey(transaction);
    if (!dateKey) return null;
    const parts = dateKey.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function getTransactionDateTime(transaction) {
    const timestamp = transaction.createdAt || transaction.timestamp;
    if (typeof timestamp === "string") {
      const parsed = new Date(timestamp);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return getPurchaseDate(transaction);
  }

  function getCategory(transaction) {
    return categories.includes(transaction.category) ? transaction.category : "Other";
  }

  function renderStatistics() {
    const total = transactions.reduce(function (sum, transaction) {
      return sum + transaction.amount;
    }, 0);
    const categoryCount = new Set(transactions.map(getCategory)).size;

    document.getElementById("historyTotal").textContent = formatCurrency(total);
    document.getElementById("historyCount").textContent = String(transactions.length);
    document.getElementById("historyCountDetail").textContent =
      "Across " + categoryCount + (categoryCount === 1 ? " category" : " categories");
    document.getElementById("historyAverage").textContent = formatCurrency(
      transactions.length ? Math.round(total / transactions.length) : 0
    );
  }

  function dateGroupLabel(dateKey, todayKey, yesterdayKey) {
    const date = new Date(dateKey + "T00:00:00");
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).toUpperCase();
    if (dateKey === todayKey) return "TODAY • " + formattedDate;
    if (dateKey === yesterdayKey) return "YESTERDAY • " + formattedDate;
    return formattedDate;
  }

  function createTransactionRow(transaction) {
    const row = document.createElement("article");
    row.className = "transaction-row";

    const icon = document.createElement("span");
    icon.className = "transaction-icon";
    icon.setAttribute("aria-hidden", "true");
    if (/kopi|coffee/i.test(transaction.name)) {
      const phone = document.createElement("img");
      phone.src = "assets/history-phone.png";
      phone.alt = "";
      icon.appendChild(phone);
    } else {
      icon.textContent = categoryIcons[getCategory(transaction)] || "🛍️";
    }

    const info = document.createElement("div");
    info.className = "transaction-info";
    const name = document.createElement("h3");
    name.textContent = transaction.name;
    const details = document.createElement("p");
    details.textContent = transaction.notes || getCategory(transaction);
    info.append(name, details);

    const amount = document.createElement("span");
    amount.className = "transaction-amount";
    amount.textContent = "− " + formatCurrency(transaction.amount);

    row.append(icon, info, amount);
    if (/soto/i.test(transaction.name)) {
      const foodSticker = document.createElement("img");
      foodSticker.className = "transaction-sticker";
      foodSticker.src = "assets/history-noodles.png";
      foodSticker.alt = "";
      foodSticker.setAttribute("aria-hidden", "true");
      row.appendChild(foodSticker);
    }

    const purchasedAt = getTransactionDateTime(transaction);
    const time = document.createElement("time");
    time.className = "transaction-time";
    if (purchasedAt) {
      time.dateTime = purchasedAt.toISOString();
      time.textContent = purchasedAt.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } else {
      time.textContent = "Time unavailable";
    }
    row.appendChild(time);
    return row;
  }

  function renderTransactions() {
    const list = document.getElementById("transactions");
    const today = new Date();
    const todayKey = localDateKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = localDateKey(yesterday);

    const visibleTransactions = transactions.filter(function (transaction) {
      return selectedCategory === "All" || getCategory(transaction) === selectedCategory;
    }).sort(function (first, second) {
      const firstDate = getTransactionDateTime(first);
      const secondDate = getTransactionDateTime(second);
      return (secondDate ? secondDate.getTime() : 0) - (firstDate ? firstDate.getTime() : 0);
    });

    document.getElementById("visibleCount").textContent =
      visibleTransactions.length + (visibleTransactions.length === 1 ? " transaction" : " transactions");
    list.replaceChildren();

    if (visibleTransactions.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "history-empty";
      emptyState.textContent = transactions.length
        ? "No purchases for this category."
        : "No purchase history yet.";
      list.appendChild(emptyState);
      return;
    }

    const groups = new Map();
    visibleTransactions.forEach(function (transaction) {
      const dateKey = getDateKey(transaction) || "unknown";
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey).push(transaction);
    });

    groups.forEach(function (items, dateKey) {
      const group = document.createElement("section");
      group.className = "date-group";
      const heading = document.createElement("h3");
      heading.className = "date-group-heading";
      heading.textContent = dateKey === "unknown"
        ? "DATE UNAVAILABLE"
        : dateGroupLabel(dateKey, todayKey, yesterdayKey);

      if (dateKey === todayKey || dateKey === yesterdayKey) {
        const quote = document.createElement("img");
        quote.src = "assets/history-quotes.png";
        quote.alt = "";
        quote.setAttribute("aria-hidden", "true");
        heading.appendChild(quote);
      }

      group.appendChild(heading);
      items.forEach(function (transaction) {
        group.appendChild(createTransactionRow(transaction));
      });
      list.appendChild(group);
    });
  }

  function getMonthKey(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
  }

  function getMonthlyTotal(monthKey) {
    return transactions.reduce(function (total, transaction) {
      const dateKey = getDateKey(transaction);
      return dateKey.startsWith(monthKey) ? total + transaction.amount : total;
    }, 0);
  }

  function renderWeeklyBars(monthStart, monthKey) {
    const container = document.getElementById("weeklyBars");
    container.replaceChildren();
    const totals = [0, 0, 0, 0, 0, 0];
    const firstWeekday = monthStart.getDay();

    transactions.forEach(function (transaction) {
      const dateKey = getDateKey(transaction);
      if (!dateKey.startsWith(monthKey)) return;
      const date = getPurchaseDate(transaction);
      if (!date) return;
      const index = Math.min(5, Math.floor((date.getDate() + firstWeekday - 1) / 7));
      totals[index] += transaction.amount;
    });

    const maximum = Math.max.apply(null, totals);
    totals.forEach(function (total, index) {
      const bar = document.createElement("span");
      bar.className = "weekly-bar";
      const height = maximum ? Math.max(10, Math.round(total / maximum * 74)) : 10;
      bar.style.height = height + "px";
      bar.setAttribute("aria-label", "Week " + (index + 1) + ": " + formatCurrency(total));
      container.appendChild(bar);
    });
  }

  function renderTopCategories(monthKey) {
    const totals = new Map(categories.map(function (category) {
      return [category, 0];
    }));

    transactions.forEach(function (transaction) {
      if (!getDateKey(transaction).startsWith(monthKey)) return;
      const category = getCategory(transaction);
      totals.set(category, (totals.get(category) || 0) + transaction.amount);
    });

    const monthlyTotal = Array.from(totals.values()).reduce(function (sum, amount) {
      return sum + amount;
    }, 0);
    const sorted = Array.from(totals.entries()).sort(function (first, second) {
      return second[1] - first[1];
    });
    const container = document.getElementById("topCategories");
    container.replaceChildren();

    sorted.forEach(function (entry) {
      const category = entry[0];
      const amount = entry[1];
      const share = monthlyTotal ? Math.round(amount / monthlyTotal * 100) : 0;
      const row = document.createElement("div");
      row.className = "top-category";

      const label = document.createElement("span");
      label.textContent = category;
      const value = document.createElement("span");
      value.className = "top-category-amount";
      value.textContent = formatCurrency(amount) + " · " + share + "%";

      const track = document.createElement("span");
      track.className = "category-track";
      const fill = document.createElement("span");
      fill.style.width = share + "%";
      track.appendChild(fill);
      row.append(label, value, track);
      container.appendChild(row);
    });
  }

  function renderSpendingSummary() {
    const now = new Date();
    const currentMonthKey = getMonthKey(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthKey = getMonthKey(previousMonth);
    const currentTotal = getMonthlyTotal(currentMonthKey);
    const previousTotal = getMonthlyTotal(previousMonthKey);

    document.getElementById("spendingTotal").textContent = formatCurrency(currentTotal);
    document.getElementById("spendingPeriod").textContent =
      now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · compared with " + previousMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    const trend = document.getElementById("spendingTrend");
    trend.className = "spending-trend";
    if (previousTotal === 0 && currentTotal > 0) {
      trend.textContent = "↑ New spending this month · Rp 0 last month";
      trend.classList.add("trend-up");
    } else if (previousTotal === 0) {
      trend.textContent = "No spending in either period";
      trend.classList.add("trend-flat");
    } else {
      const difference = currentTotal - previousTotal;
      const percentage = Math.round(Math.abs(difference) / previousTotal * 100);
      if (difference > 0) {
        trend.textContent = "↑ " + percentage + "% more than last month";
        trend.classList.add("trend-up");
      } else if (difference < 0) {
        trend.textContent = "↓ " + percentage + "% less than last month";
        trend.classList.add("trend-down");
      } else {
        trend.textContent = "→ No change from last month";
        trend.classList.add("trend-flat");
      }
    }

    renderWeeklyBars(monthStart, currentMonthKey);
    renderTopCategories(currentMonthKey);
  }

  const filterButtons = categoryFilter.querySelectorAll("[data-category]");
  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectedCategory = button.dataset.category;
      filterButtons.forEach(function (filterButton) {
        const selected = filterButton === button;
        filterButton.classList.toggle("active", selected);
        filterButton.setAttribute("aria-pressed", String(selected));
      });
      renderTransactions();
    });
  });

  const logoutModal = document.getElementById("logoutModal");
  const logoutLink = document.getElementById("logoutLink");
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

  logoutLink.addEventListener("click", function (event) {
    event.preventDefault();
    openLogoutModal();
  });
  document.getElementById("cancelLogout").addEventListener("click", closeLogoutModal);
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

  function showFeedback(message, isError) {
    feedback.textContent = message;
    feedback.classList.toggle("error", Boolean(isError));
    feedback.classList.add("visible");
    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(function () {
      feedback.classList.remove("visible");
    }, 3500);
  }

  renderStatistics();
  renderTransactions();
  renderSpendingSummary();
}
