const STORAGE_USERS_KEY = 'gamadiem_users';
const STORAGE_ACTIVE_USER_KEY = 'gamadiem_active_user';

let state = createEmptyState();

const ugmAlternatives = [
    { name: 'Kantin FMIPA UGM', desc: 'Area Sekip UGM', minPrice: 10000, maxPrice: 16000, mapQuery: 'Kantin FMIPA UGM' },
    { name: 'Warung Makan Santai', desc: 'Kocoran UGM', minPrice: 12000, maxPrice: 18000, mapQuery: 'Warung Makan Santai Kocoran UGM' },
    { name: 'RM Padang Sabana 3', desc: 'Gang Swakarya UGM', minPrice: 10000, maxPrice: 15000, mapQuery: 'RM Padang Sabana Murah 3 UGM' },
    { name: 'Warung Makan Lestari', desc: 'Jalan Agro UGM', minPrice: 11000, maxPrice: 16000, mapQuery: 'Warung Makan Lestari Jalan Agro UGM' }
];

window.addEventListener('DOMContentLoaded', () => {
    try {
        if (localStorage.getItem('gamadiem_isLoggedIn') === 'true') {
            window.location.replace('dashboard.html');
            return;
        }
    } catch (error) {
        showAuthAlert('Sesi tidak dapat dibaca dari browser ini.');
        console.error('Gagal membaca status login Gamadiem:', error);
    }

    document.getElementById('signInForm').addEventListener('submit', event => {
        event.preventDefault();
        handleSignIn();
    });
    document.getElementById('signUpForm').addEventListener('submit', event => {
        event.preventDefault();
        handleSignUp();
    });
    document.getElementById('expenseForm').addEventListener('submit', event => {
        event.preventDefault();
        handleAddExpense();
    });
});

function createEmptyState() {
    return {
        user: null,
        email: null,
        password: null,
        allowance: 0,
        savingsTarget: 0,
        daysLeft: 30,
        netBalance: 0,
        dailyLimit: 0,
        piggyBank: 0,
        expenses: []
    };
}

function formatRupiah(input) {
    const digits = input.value.replace(/\D/g, '');
    input.value = digits ? Number(digits).toLocaleString('id-ID') : '';
}

function cleanNumber(value) {
    return Number(String(value || '').replace(/\D/g, '')) || 0;
}

function formatCurrency(value) {
    return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

function accountExpensesToHistory(expenses) {
    if (!Array.isArray(expenses)) return [];
    return expenses.reduce((history, expense) => {
        if (!expense || typeof expense !== 'object') return history;
        const name = typeof expense.name === 'string' ? expense.name : expense.title;
        const amount = Number(expense.amount);
        if (typeof name !== 'string' || !name.trim() || !Number.isSafeInteger(amount) || amount <= 0) {
            return history;
        }

        let purchasedAt = new Date();
        const storedTimestamp = expense.createdAt || expense.timestamp || expense.date;
        if (typeof storedTimestamp === 'string') {
            const parsedDate = new Date(storedTimestamp);
            if (!Number.isNaN(parsedDate.getTime())) purchasedAt = parsedDate;
        }

        const date = typeof expense.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expense.date)
            ? expense.date
            : GamadiemFinance.localDateKey(purchasedAt);
        history.push({
            id: expense.id || `${Date.now()}-${history.length}`,
            name: name.trim(),
            amount,
            category: expense.category || 'Other',
            notes: expense.notes || expense.note || '',
            date,
            createdAt: purchasedAt.toISOString()
        });
        return history;
    }, []);
}

function readUsers() {
    let storedUsers;
    try {
        storedUsers = localStorage.getItem(STORAGE_USERS_KEY);
    } catch (error) {
        showAuthAlert('Penyimpanan browser tidak dapat diakses.');
        console.error('Gagal mengakses penyimpanan Gamadiem:', error);
        return null;
    }
    if (!storedUsers) return {};

    try {
        const users = JSON.parse(storedUsers);
        if (!users || typeof users !== 'object' || Array.isArray(users)) {
            throw new TypeError('Format data akun tidak valid.');
        }
        return users;
    } catch (error) {
        showAuthAlert('Data akun tersimpan rusak dan tidak dapat dibaca. Data tidak dihapus.');
        console.error('Gagal membaca data akun Gamadiem:', error);
        return null;
    }
}

function switchAuthMode(mode) {
    const isSignUp = mode === 'signup';
    document.querySelector('.auth-stage').classList.toggle('signup-mode', isSignUp);
    document.getElementById('signInForm').classList.toggle('hidden', isSignUp);
    document.getElementById('signUpForm').classList.toggle('hidden', !isSignUp);
    document.getElementById('tabBtnSignIn').classList.toggle('active', !isSignUp);
    document.getElementById('tabBtnSignUp').classList.toggle('active', isSignUp);
    document.getElementById('authTitleText').textContent = isSignUp ? 'Sign Up' : 'Login';
    document.querySelector('.welcome-copy').textContent = isSignUp ? 'Start Saving!' : 'Welcome Back!';
    document.getElementById('authAlertBox').classList.add('hidden');
}

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const showing = input.type === 'password';
    input.type = showing ? 'text' : 'password';
    button.classList.toggle('is-visible', showing);
    button.setAttribute('aria-label', showing ? 'Sembunyikan password' : 'Tampilkan password');
}

function showAuthAlert(message, isSuccess) {
    const alertBox = document.getElementById('authAlertBox');
    alertBox.textContent = message;
    alertBox.classList.remove('hidden', 'alert-success');
    if (isSuccess) alertBox.classList.add('alert-success');
}

function handleSignUp() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const allowance = cleanNumber(document.getElementById('regAllowance').value);
    const savings = cleanNumber(document.getElementById('regSavings').value);
    const days = Number(document.getElementById('regDays').value);

    if (!name || !email || password.length < 4 || allowance <= 0 || savings < 0 || days < 1 || days > 60) {
        showAuthAlert('Periksa kembali nama, akun, password, dan pengaturan anggaran.');
        return;
    }

    const users = readUsers();
    if (!users) return;
    if (users[email]) {
        showAuthAlert('Email/username sudah terdaftar. Silakan sign in.');
        return;
    }

    const userSettings = GamadiemFinance.normalizeSettings({
        name,
        totalAllowance: allowance,
        rentPrice: 0,
        electricity: 0,
        cycleDurationDays: days,
        savingTarget: savings,
        cycleStartDate: GamadiemFinance.localDateKey(new Date())
    });
    if (!userSettings) {
        showAuthAlert('Pengaturan keuangan awal tidak valid.');
        return;
    }

    state = {
        ...createEmptyState(),
        user: name,
        email,
        password,
        allowance,
        savingsTarget: savings,
        daysLeft: days,
        piggyBank: savings,
        expenses: [],
        userSettings,
        history: []
    };
    calculateLimits();

    try {
        users[email] = state;
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
        GamadiemFinance.initializeSession(email, userSettings, []);
    } catch (error) {
        showAuthAlert('Data akun tidak dapat disimpan di browser ini.');
        console.error('Gagal menyimpan akun Gamadiem:', error);
        return;
    }

    window.location.assign('dashboard.html');
}

function handleSignIn() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const users = readUsers();
    if (!users) return;

    const account = users[email];
    if (!account) {
        showAuthAlert('Akun tidak ditemukan. Silakan sign up terlebih dahulu.');
        return;
    }
    if (account.password !== password) {
        showAuthAlert('Password salah. Coba periksa kembali.');
        return;
    }

    const userSettings = GamadiemFinance.settingsFromAccount(account);
    if (!userSettings) {
        showAuthAlert('Pengaturan keuangan akun tidak valid. Periksa data allowance dan target tabungan.');
        return;
    }
    const history = Array.isArray(account.history)
        ? account.history
        : accountExpensesToHistory(account.expenses);

    state = { ...createEmptyState(), ...account, userSettings, history };
    state.expenses = Array.isArray(account.expenses) ? account.expenses : [];
    try {
        users[email] = Object.assign({}, account, { userSettings, history });
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
        GamadiemFinance.initializeSession(email, userSettings, history);
    } catch (error) {
        showAuthAlert('Sesi tidak dapat disimpan di browser ini.');
        console.error('Gagal menyimpan sesi Gamadiem:', error);
        return;
    }
    window.location.assign('dashboard.html');
}

function calculateLimits() {
    const expenses = Array.isArray(state.expenses) ? state.expenses : [];
    const settings = state.userSettings || GamadiemFinance.normalizeSettings({
        name: state.user,
        totalAllowance: state.allowance,
        rentPrice: 0,
        electricity: 0,
        cycleDurationDays: state.daysLeft,
        savingTarget: state.savingsTarget
    });
    if (!settings) {
        state.netBalance = 0;
        state.dailyLimit = 0;
        state.piggyBank = 0;
        return;
    }

    const balances = GamadiemFinance.calculateBalances(settings, accountExpensesToHistory(expenses));
    state.userSettings = settings;
    state.netBalance = balances.spendableBalance;
    state.dailyLimit = balances.safeToSpendToday;
    state.piggyBank = balances.piggyBank;
    state.daysLeft = balances.remainingDays;
}

function handleAddExpense() {
    const titleInput = document.getElementById('expenseTitle');
    const amountInput = document.getElementById('expenseAmount');
    const categoryInput = document.querySelector('input[name="expenseCategory"]:checked');
    const title = titleInput.value.trim();
    const amount = cleanNumber(amountInput.value);
    const note = document.getElementById('expenseNote').value.trim();

    if (!title || amount <= 0 || !categoryInput) {
        alert('Mohon isi nama pengeluaran, kategori, dan nominal biaya dengan benar.');
        return;
    }

    state.expenses.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        title,
        amount,
        category: categoryInput.value,
        note
    });

    calculateLimits();
    if (!saveData()) return;
    renderDashboardUI();
    renderHistoryTable();
    document.getElementById('expenseForm').reset();
    alert(`Pengeluaran "${title}" sebesar ${formatCurrency(amount)} dicatat.`);
}

function renderApp() {
    document.getElementById('authView').classList.add('hidden');
    document.getElementById('appLayout').classList.remove('hidden');
    document.getElementById('displayUserName').textContent = state.user || 'Pengguna';
    document.getElementById('userAvatar').textContent = (state.user || 'P').charAt(0).toUpperCase();
    document.getElementById('displayDaysLeft').textContent = `${state.daysLeft} Hari`;
    renderDashboardUI();
    renderHistoryTable();
    renderRecommendations(ugmAlternatives);
}

function renderDashboardUI() {
    document.getElementById('netBalanceDisplay').textContent = formatCurrency(state.netBalance);
    document.getElementById('piggyBankDisplay').textContent = formatCurrency(state.piggyBank);
    document.getElementById('dailyLimitDisplay').textContent = `${formatCurrency(state.dailyLimit)} / hari`;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    if (state.expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Belum ada riwayat pengeluaran.</td></tr>';
        return;
    }

    tbody.innerHTML = state.expenses.map(item => `
        <tr>
            <td>${escapeHTML(item.date)}</td>
            <td><strong>${escapeHTML(item.title)}</strong><br><small>${escapeHTML(item.note || '-')}</small></td>
            <td><span class="category-tag">${escapeHTML(item.category)}</span></td>
            <td class="expense-amount">${formatCurrency(item.amount)}</td>
            <td><button class="delete-expense" type="button" data-expense-id="${escapeHTML(item.id)}" aria-label="Hapus ${escapeHTML(item.title)}">Hapus</button></td>
        </tr>
    `).join('');
}

function deleteExpense(id) {
    state.expenses = state.expenses.filter(item => String(item.id) !== String(id));
    calculateLimits();
    if (!saveData()) return;
    renderDashboardUI();
    renderHistoryTable();
}

function switchTab(tabId, button) {
    document.querySelectorAll('.tab-content').forEach(section => {
        const isActive = section.id === tabId;
        section.classList.toggle('active', isActive);
        section.classList.toggle('hidden', !isActive);
    });
    document.querySelectorAll('.nav-btn').forEach(navButton => navButton.classList.remove('active'));
    button.classList.add('active');
}

function handleFoodSearch() {
    const query = document.getElementById('searchFoodName').value.trim().toLowerCase();
    const maxPrice = cleanNumber(document.getElementById('searchMaxPrice').value);
    const filtered = ugmAlternatives.filter(item => {
        const matchesQuery = !query || `${item.name} ${item.desc}`.toLowerCase().includes(query);
        const matchesPrice = !maxPrice || item.minPrice <= maxPrice;
        return matchesQuery && matchesPrice;
    });

    renderRecommendations(filtered);
    if (filtered.length) focusMap(filtered[0].mapQuery);
}

function renderRecommendations(list) {
    const container = document.getElementById('recommendationsList');
    if (list.length === 0) {
        container.innerHTML = '<p class="empty-state">Tidak ada tempat makan yang sesuai kriteria pencarian.</p>';
        return;
    }

    container.innerHTML = list.map((item, index) => `
        <button class="rec-item" type="button" data-rec-index="${index}">
            <span class="rec-title">${escapeHTML(item.name)}</span>
            <span class="rec-location">${escapeHTML(item.desc)}</span>
            <span class="rec-price">${formatCurrency(item.minPrice)} – ${formatCurrency(item.maxPrice)}</span>
        </button>
    `).join('');
    container.querySelectorAll('[data-rec-index]').forEach(button => {
        button.addEventListener('click', () => focusMap(list[Number(button.dataset.recIndex)].mapQuery));
    });
}

function focusMap(mapQuery) {
    const mapFrame = document.getElementById('mapFrame');
    mapFrame.src = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

function saveData() {
    if (!state.email) {
        showAuthAlert('Tidak ada akun aktif untuk menyimpan perubahan.');
        return false;
    }

    const users = readUsers();
    if (!users) return false;
    try {
        const history = accountExpensesToHistory(state.expenses);
        users[state.email] = Object.assign({}, state, {
            userSettings: state.userSettings,
            history: history
        });
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
        GamadiemFinance.saveSettings(state.userSettings);
        GamadiemFinance.saveHistory(history);
        return true;
    } catch (error) {
        alert('Data tidak dapat disimpan. Periksa ruang penyimpanan browser.');
        console.error('Gagal menyimpan data Gamadiem:', error);
        return false;
    }
}

function handleLogout() {
    if (!confirm('Keluar dari sesi akun saat ini? Data akun tetap tersimpan di perangkat ini.')) return;
    try {
        localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
    } catch (error) {
        alert('Sesi tidak dapat dihapus dari browser ini.');
        console.error('Gagal menghapus sesi Gamadiem:', error);
        return;
    }
    state = createEmptyState();
    document.getElementById('appLayout').classList.add('hidden');
    document.getElementById('authView').classList.remove('hidden');
    switchAuthMode('signin');
}

document.addEventListener('click', event => {
    const deleteButton = event.target.closest('[data-expense-id]');
    if (deleteButton) deleteExpense(deleteButton.dataset.expenseId);
});
