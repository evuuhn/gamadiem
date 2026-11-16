let authenticated = false;
try {
  authenticated = localStorage.getItem("gamadiem_isLoggedIn") === "true";
} catch (error) {
  console.error("Could not read Gamadiem login status.", error);
}

if (!authenticated) {
  window.location.replace("index.html");
} else {
  const finance = window.GamadiemFinance;
  const feedback = document.getElementById("feedback");
  const settingsForm = document.getElementById("settingsForm");
  const saveButton = settingsForm.querySelector('button[type="submit"]');
  let settings = null;
  let feedbackTimer;

  function showFeedback(message, isError) {
    feedback.textContent = message;
    feedback.classList.toggle("error", Boolean(isError));
    feedback.classList.add("visible");
    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(function () {
      feedback.classList.remove("visible");
    }, 4200);
  }

  function populateForm(savedSettings) {
    document.getElementById("settingsName").value = savedSettings.name;
    document.getElementById("totalAllowance").value = savedSettings.totalAllowance.toLocaleString("id-ID");
    document.getElementById("rentPrice").value = savedSettings.rentPrice.toLocaleString("id-ID");
    document.getElementById("electricity").value = savedSettings.electricity.toLocaleString("id-ID");
    document.getElementById("cycleDurationDays").value = String(savedSettings.cycleDurationDays);
    document.getElementById("savingTarget").value = savedSettings.savingTarget.toLocaleString("id-ID");
  }

  document.querySelectorAll(".money-input").forEach(finance.attachThousandsFormatter);

  try {
    settings = finance.loadSettings();
    if (settings) {
      populateForm(settings);
      finance.renderUserIdentity(settings);
    } else {
      saveButton.disabled = true;
      showFeedback("Pengaturan akun tidak ditemukan. Silakan buat akun terlebih dahulu.", true);
    }
  } catch (error) {
    console.error("Could not load Gamadiem financial settings.", error);
    saveButton.disabled = true;
    showFeedback("Pengaturan tidak dapat dimuat. Periksa data akun dan coba lagi.", true);
  }

  settingsForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!settings) {
      showFeedback("Pengaturan akun belum tersedia untuk disimpan.", true);
      return;
    }

    const name = document.getElementById("settingsName").value.trim();
    const totalAllowance = finance.parseMoneyInput(document.getElementById("totalAllowance").value);
    const rentPrice = finance.parseMoneyInput(document.getElementById("rentPrice").value);
    const electricity = finance.parseMoneyInput(document.getElementById("electricity").value);
    const savingTarget = finance.parseMoneyInput(document.getElementById("savingTarget").value);
    const cycleDurationDays = Number(document.getElementById("cycleDurationDays").value);

    const cycleStartDate = cycleDurationDays === settings.cycleDurationDays
      ? settings.cycleStartDate
      : finance.localDateKey(new Date());
    const updatedSettings = finance.normalizeSettings({
      name: name,
      totalAllowance: totalAllowance,
      rentPrice: rentPrice,
      electricity: electricity,
      cycleDurationDays: cycleDurationDays,
      savingTarget: savingTarget,
      cycleStartDate: cycleStartDate
    });

    if (!updatedSettings) {
      showFeedback("Periksa nama, allowance, biaya, target tabungan, dan durasi siklus.", true);
      return;
    }

    try {
      const history = finance.readHistory();
      const balances = finance.calculateBalances(updatedSettings, history, new Date());
      settings = finance.saveSettings(updatedSettings);
      finance.renderUserIdentity(settings);
      showFeedback(
        "Settings saved. Spendable: " + finance.formatCurrency(balances.spendableBalance) +
          " · Safe today: " + finance.formatCurrency(balances.safeToSpendToday) + ".",
        false
      );
    } catch (error) {
      console.error("Could not save Gamadiem financial settings.", error);
      showFeedback("Pengaturan tidak berhasil disimpan. Periksa penyimpanan browser.", true);
    }
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
}