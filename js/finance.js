(function (global) {
  const SETTINGS_KEY = "gamadiem_userSettings";
  const USERS_KEY = "gamadiem_users";
  const ACTIVE_USER_KEY = "gamadiem_active_user";
  const HISTORY_KEY = "history";

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function isValidDateKey(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parts = value.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.getFullYear() === parts[0] &&
      date.getMonth() === parts[1] - 1 &&
      date.getDate() === parts[2];
  }

  function normalizeSettings(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;

    const name = typeof value.name === "string"
      ? value.name.trim()
      : typeof value.user === "string" ? value.user.trim() : "";
    const allowanceValue = value.totalAllowance === undefined ? value.allowance : value.totalAllowance;
    const savingsValue = value.savingTarget === undefined ? value.savingsTarget : value.savingTarget;
    const cycleValue = value.cycleDurationDays === undefined
      ? value.daysLeft === undefined ? 30 : value.daysLeft
      : value.cycleDurationDays;
    const totalAllowance = Number(allowanceValue);
    const rentPrice = value.rentPrice === undefined ? 0 : Number(value.rentPrice);
    const electricity = value.electricity === undefined ? 0 : Number(value.electricity);
    const cycleDurationDays = Number(cycleValue);
    const savingTarget = savingsValue === undefined ? 0 : Number(savingsValue);
    const cycleStartDate = value.cycleStartDate === undefined
      ? localDateKey(new Date())
      : value.cycleStartDate;

    if (!name ||
      !Number.isSafeInteger(totalAllowance) || totalAllowance <= 0 ||
      !Number.isSafeInteger(rentPrice) || rentPrice < 0 ||
      !Number.isSafeInteger(electricity) || electricity < 0 ||
      !Number.isSafeInteger(cycleDurationDays) || cycleDurationDays < 1 || cycleDurationDays > 365 ||
      !Number.isSafeInteger(savingTarget) || savingTarget < 0 ||
      !isValidDateKey(cycleStartDate)) {
      return null;
    }

    return {
      name: name,
      totalAllowance: totalAllowance,
      rentPrice: rentPrice,
      electricity: electricity,
      cycleDurationDays: cycleDurationDays,
      savingTarget: savingTarget,
      cycleStartDate: cycleStartDate
    };
  }

  function readUsers() {
    const serialized = localStorage.getItem(USERS_KEY);
    if (serialized === null) return {};
    const users = JSON.parse(serialized);
    if (!users || typeof users !== "object" || Array.isArray(users)) {
      throw new TypeError("Stored Gamadiem accounts must be an object.");
    }
    return users;
  }

  function readSettings() {
    const serialized = localStorage.getItem(SETTINGS_KEY);
    if (serialized === null) return null;
    const settings = normalizeSettings(JSON.parse(serialized));
    if (!settings) throw new TypeError("Stored Gamadiem financial settings are invalid.");
    return settings;
  }

  function settingsFromAccount(account) {
    if (!account || typeof account !== "object") return null;
    const source = account.userSettings && typeof account.userSettings === "object"
      ? account.userSettings
      : {
        name: account.user,
        totalAllowance: account.allowance,
        rentPrice: account.rentPrice,
        electricity: account.electricity,
        cycleDurationDays: account.cycleDurationDays === undefined ? account.daysLeft : account.cycleDurationDays,
        savingTarget: account.savingsTarget,
        cycleStartDate: account.cycleStartDate
      };
    return normalizeSettings(source);
  }

  function loadSettings() {
    const savedSettings = readSettings();
    if (savedSettings) return savedSettings;

    const email = localStorage.getItem(ACTIVE_USER_KEY);
    if (!email) return null;
    const users = readUsers();
    const settings = settingsFromAccount(users[email]);
    if (!settings) return null;
    return saveSettings(settings);
  }

  function saveSettings(value) {
    const settings = normalizeSettings(value);
    if (!settings) throw new TypeError("Financial settings are invalid.");
    const email = localStorage.getItem(ACTIVE_USER_KEY);
    if (!email) throw new Error("No active Gamadiem account was found.");

    const users = readUsers();
    const account = users[email];
    if (!account || typeof account !== "object") {
      throw new Error("The active Gamadiem account could not be found.");
    }

    users[email] = Object.assign({}, account, {
      user: settings.name,
      allowance: settings.totalAllowance,
      rentPrice: settings.rentPrice,
      electricity: settings.electricity,
      savingsTarget: settings.savingTarget,
      cycleDurationDays: settings.cycleDurationDays,
      daysLeft: settings.cycleDurationDays,
      cycleStartDate: settings.cycleStartDate,
      userSettings: settings
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  }

  function readHistory() {
    const serialized = localStorage.getItem(HISTORY_KEY);
    if (serialized === null) return [];
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new TypeError("Stored purchase history must be an array.");

    const history = parsed.filter(function (item) {
      return item !== null &&
        typeof item === "object" &&
        typeof item.name === "string" &&
        item.name.trim().length > 0 &&
        Number.isSafeInteger(item.amount) &&
        item.amount > 0;
    });
    if (history.length !== parsed.length) {
      console.error("Invalid purchase history entries were skipped while calculating balances.");
    }
    return history;
  }

  function saveHistory(history) {
    if (!Array.isArray(history)) throw new TypeError("Purchase history must be an array.");
    const email = localStorage.getItem(ACTIVE_USER_KEY);
    if (!email) throw new Error("No active Gamadiem account was found.");

    const users = readUsers();
    const account = users[email];
    if (!account || typeof account !== "object") {
      throw new Error("The active Gamadiem account could not be found.");
    }

    users[email] = Object.assign({}, account, { history: history });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function initializeSession(email, settings, history) {
    localStorage.setItem(ACTIVE_USER_KEY, email);
    saveSettings(settings);
    saveHistory(history);
    localStorage.setItem("gamadiem_isLoggedIn", "true");
  }

  function remainingCycleDays(settings, now) {
    const duration = settings.cycleDurationDays;
    const startParts = settings.cycleStartDate.split("-").map(Number);
    const cycleStart = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const elapsedDays = Math.max(0, Math.floor((today.getTime() - cycleStart.getTime()) / 86400000));
    return duration - (elapsedDays % duration);
  }

  function calculateBalances(settings, history, now) {
    if (!settings) throw new TypeError("Financial settings are required to calculate balances.");
    if (!Array.isArray(history)) throw new TypeError("Purchase history must be an array.");
    const totalSpent = history.reduce(function (sum, transaction) {
      return Number.isSafeInteger(transaction.amount) && transaction.amount > 0
        ? sum + transaction.amount
        : sum;
    }, 0);
    const remaining = remainingCycleDays(settings, now || new Date());
    const spendableBalance = Math.max(
      0,
      settings.totalAllowance -
        settings.rentPrice -
        settings.electricity -
        settings.savingTarget -
        totalSpent
    );

    return {
      totalSpent: totalSpent,
      remainingDays: remaining,
      spendableBalance: spendableBalance,
      piggyBank: settings.savingTarget,
      safeToSpendToday: spendableBalance === 0 ? 0 : Math.floor(spendableBalance / remaining)
    };
  }

  function formatCurrency(amount) {
    return "Rp " + Number(amount || 0).toLocaleString("id-ID");
  }

  function parseMoneyInput(value) {
    const digits = String(value).replace(/\D/g, "");
    const amount = digits ? Number(digits) : NaN;
    return Number.isSafeInteger(amount) ? amount : NaN;
  }

  function attachThousandsFormatter(input) {
    input.addEventListener("input", function () {
      const rawValue = input.value;
      const cursor = input.selectionStart === null ? rawValue.length : input.selectionStart;
      const digitsBeforeCursor = rawValue.slice(0, cursor).replace(/\D/g, "").length;
      const digits = rawValue.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
      const formattedValue = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

  function renderUserIdentity(settings) {
    const savedSettings = settings || loadSettings();
    if (!savedSettings) return;
    document.querySelectorAll("[data-user-name]").forEach(function (element) {
      element.textContent = savedSettings.name;
    });
    document.querySelectorAll("[data-user-initial]").forEach(function (element) {
      element.textContent = savedSettings.name.charAt(0).toUpperCase();
    });
  }

  global.GamadiemFinance = {
    attachThousandsFormatter: attachThousandsFormatter,
    calculateBalances: calculateBalances,
    formatCurrency: formatCurrency,
    initializeSession: initializeSession,
    loadSettings: loadSettings,
    localDateKey: localDateKey,
    normalizeSettings: normalizeSettings,
    parseMoneyInput: parseMoneyInput,
    readHistory: readHistory,
    renderUserIdentity: renderUserIdentity,
    saveHistory: saveHistory,
    saveSettings: saveSettings,
    settingsFromAccount: settingsFromAccount
  };

  try {
    renderUserIdentity(loadSettings());
  } catch (error) {
    console.error("Could not load Gamadiem user settings.", error);
  }
})(window);
