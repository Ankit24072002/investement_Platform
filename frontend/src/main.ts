import './style.css';

const BASE_URL = 'http://localhost:5000/api';

const app = document.querySelector<HTMLDivElement>('#app');

const generateMockDashboard = () => ({
  user: {
    fullName: 'Demo Investor',
    email: 'investor@example.com',
    referralCode: 'INVEST22',
    walletBalance: 15420.25,
    totalROI: 5825.4,
    totalLevelIncome: 2180.5,
  },
  summary: {
    totalInvestments: 42000,
    totalROI: 5825.4,
    totalLevelIncome: 2180.5,
    walletBalance: 15420.25,
  },
  investments: [
    { _id: '1', amount: 12000, planDetails: 'Gold Plan', status: 'active', dailyROI: 1.4, startDate: '2026-09-01', endDate: '2026-12-01' },
    { _id: '2', amount: 18000, planDetails: 'Platinum Plan', status: 'completed', dailyROI: 1.7, startDate: '2026-08-15', endDate: '2026-11-15' },
    { _id: '3', amount: 12000, planDetails: 'Starter Plan', status: 'active', dailyROI: 1.2, startDate: '2026-10-01', endDate: '2027-01-01' },
  ],
  referralHistory: [
    { _id: '10', level: 1, amount: 420.5, date: '2026-11-01' },
    { _id: '11', level: 2, amount: 260.2, date: '2026-11-02' },
  ],
  roiHistory: [
    { _id: '20', amount: 168, date: '2026-11-03', status: 'credited' },
    { _id: '21', amount: 172, date: '2026-11-02', status: 'credited' },
  ],
});

const state = {
  token: localStorage.getItem('token') ?? '',
  dashboard: generateMockDashboard(),
  loading: false,
  error: '',
};

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const setStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

const buildChartBars = () => {
  const values = state.dashboard.roiHistory.length > 0 ? state.dashboard.roiHistory.map((item) => Number(item.amount || 0)) : [0, 0, 0];
  const maxValue = Math.max(...values, 1);

  return values
    .map((value, index) => `
      <div class="chart-column">
        <span class="chart-bar" style="height:${(value / maxValue) * 100}%"></span>
        <small>${new Date(state.dashboard.roiHistory[index]?.date ?? Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
      </div>
    `)
    .join('');
};

const render = () => {
  if (!app) {
    return;
  }

  app.innerHTML = `
    <div class="dashboard-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">MERN Stack Investment Platform</p>
          <h1>Dashboard</h1>
        </div>
        <button id="logoutBtn" class="secondary-btn" ${state.token ? '' : 'hidden'}>Logout</button>
      </header>

      <section class="auth-grid">
        <div class="panel auth-panel">
          <h2>User Auth</h2>
          <form id="registerForm">
            <label>
              Full name
              <input type="text" name="fullName" placeholder="Jane Doe" required />
            </label>
            <label>
              Email
              <input type="email" name="email" placeholder="jane@email.com" required />
            </label>
            <label>
              Mobile number
              <input type="tel" name="mobileNumber" placeholder="9876543210" required />
            </label>
            <label>
              Password
              <input type="password" name="password" placeholder="********" required />
            </label>
            <label>
              Referral code (optional)
              <input type="text" name="referralCode" placeholder="INVEST22" />
            </label>
            <button type="submit">Register</button>
          </form>
        </div>

        <div class="panel auth-panel">
          <h2>Login</h2>
          <form id="loginForm">
            <label>
              Email
              <input type="email" name="email" placeholder="jane@email.com" required />
            </label>
            <label>
              Password
              <input type="password" name="password" placeholder="********" required />
            </label>
            <button type="submit" class="secondary-btn">Login</button>
          </form>
        </div>
      </section>

      ${state.error ? `<div class="status-banner error">${state.error}</div>` : ''}
      ${state.loading ? `<div class="status-banner">Loading dashboard…</div>` : ''}

      <section class="panel summary-panel">
        <div class="summary-card">
          <span>Total Investments</span>
          <strong>${formatCurrency(state.dashboard.summary.totalInvestments)}</strong>
        </div>
        <div class="summary-card">
          <span>Daily ROI</span>
          <strong>${formatCurrency(state.dashboard.summary.totalROI)}</strong>
        </div>
        <div class="summary-card">
          <span>Total Level Income</span>
          <strong>${formatCurrency(state.dashboard.summary.totalLevelIncome)}</strong>
        </div>
        <div class="summary-card highlight">
          <span>Wallet Balance</span>
          <strong>${formatCurrency(state.dashboard.summary.walletBalance)}</strong>
        </div>
      </section>

      <section class="content-grid">
        <div class="panel">
          <h2>Create investment</h2>
          <form id="investmentForm">
            <label>
              Amount
              <input type="number" name="amount" min="0" step="100" value="2500" required />
            </label>
            <label>
              Plan details
              <input type="text" name="planDetails" value="Premium Growth" required />
            </label>
            <div class="inline-fields">
              <label>
                Start date
                <input type="date" name="startDate" required />
              </label>
              <label>
                End date
                <input type="date" name="endDate" required />
              </label>
            </div>
            <label>
              Daily ROI %
              <input type="number" name="dailyROI" min="0" step="0.1" value="1.5" required />
            </label>
            <button type="submit">Submit investment</button>
          </form>
        </div>

        <div class="panel">
          <h2>Referral tree</h2>
          <div class="tree-box">
            <p><strong>Referrer:</strong> ${state.dashboard.user.fullName}</p>
            <p><strong>Referral Code:</strong> ${state.dashboard.user.referralCode}</p>
            <div class="tree-node">Level 1 • ${state.dashboard.referralHistory.length} credited</div>
            <div class="tree-node">Level 2 • ${state.dashboard.referralHistory[1]?.amount ?? 0}</div>
            <div class="tree-node">Level 3 • Pending verification</div>
          </div>
        </div>
      </section>

      <section class="tables-grid">
        <div class="panel">
          <h2>Investment history</h2>
          <table>
            <thead>
              <tr><th>Plan</th><th>Amount</th><th>Status</th><th>Daily ROI</th></tr>
            </thead>
            <tbody>
              ${state.dashboard.investments.map((item) => `
                <tr>
                  <td>${item.planDetails}</td>
                  <td>${formatCurrency(item.amount)}</td>
                  <td>${setStatus(item.status)}</td>
                  <td>${item.dailyROI}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="panel">
          <h2>Referral income</h2>
          <table>
            <thead>
              <tr><th>Level</th><th>Amount</th><th>Date</th></tr>
            </thead>
            <tbody>
              ${state.dashboard.referralHistory.map((item) => `
                <tr>
                  <td>Level ${item.level}</td>
                  <td>${formatCurrency(item.amount)}</td>
                  <td>${new Date(item.date).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel chart-panel">
        <h2>Earnings overview</h2>
        <div class="chart-grid">
          ${buildChartBars()}
        </div>
      </section>

      <section class="panel">
        <h2>ROI ledger</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${state.dashboard.roiHistory.map((item) => `
              <tr>
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td>${formatCurrency(item.amount)}</td>
                <td>${setStatus(item.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    </div>
  `;

  const registerForm = document.querySelector<HTMLFormElement>('#registerForm');
  const loginForm = document.querySelector<HTMLFormElement>('#loginForm');
  const investmentForm = document.querySelector<HTMLFormElement>('#investmentForm');
  const logoutBtn = document.querySelector<HTMLButtonElement>('#logoutBtn');

  registerForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const payload = Object.fromEntries(formData.entries());
    state.loading = true;
    state.error = '';
    render();

    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      state.token = data.token;
      localStorage.setItem('token', data.token);
      render();
      await loadDashboard();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unable to register user';
      render();
    } finally {
      state.loading = false;
      render();
    }
  });

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const payload = Object.fromEntries(formData.entries());
    state.loading = true;
    state.error = '';
    render();

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      state.token = data.token;
      localStorage.setItem('token', data.token);
      render();
      await loadDashboard();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unable to login';
      render();
    } finally {
      state.loading = false;
      render();
    }
  });

  investmentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.token) {
      state.error = 'Please login first to create an investment';
      render();
      return;
    }

    state.loading = true;
    state.error = '';
    render();

    const formData = new FormData(investmentForm);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      amount: Number(formData.get('amount')),
      dailyROI: Number(formData.get('dailyROI')),
    };

    try {
      const response = await fetch(`${BASE_URL}/investments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Investment failed');
      alert('Investment created successfully');
      await loadDashboard();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Unable to create investment';
      render();
    } finally {
      state.loading = false;
      render();
    }
  });

  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('token');
    state.token = '';
    render();
  });
};

const loadDashboard = async () => {
  if (!state.token) {
    return;
  }

  state.loading = true;
  state.error = '';
  render();

  try {
    const response = await fetch(`${BASE_URL}/dashboard`, {
      headers: {
        Authorization: `Bearer ${state.token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      state.dashboard = data;
    } else {
      state.error = 'Unable to load dashboard';
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : 'Could not load dashboard';
  } finally {
    state.loading = false;
    render();
  }
};

render();
if (state.token) {
  void loadDashboard();
}
