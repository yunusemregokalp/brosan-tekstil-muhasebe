/**
 * BROSAN TEKSTİL ERP — FULL-STACK API, AUTHENTICATION & SECURITY CLIENT
 * Connects frontend UI to PostgreSQL backend API via REST with JWT & Bearer Tokens
 */

(function () {
  const isMuhasebeSubpath = window.location.pathname.startsWith('/muhasebe');
  const apiPath = isMuhasebeSubpath ? '/muhasebe/api' : '/api';
  const API_BASE = window.location.origin.startsWith('http') 
    ? `${window.location.origin}${apiPath}` 
    : 'http://localhost:3000/api';

  window.BrosanAPI = {
    isOnline: false,

    getToken() {
      return sessionStorage.getItem('brosan_erp_token');
    },

    setToken(token) {
      if (token) sessionStorage.setItem('brosan_erp_token', token);
      else sessionStorage.removeItem('brosan_erp_token');
    },

    getUser() {
      try {
        return JSON.parse(sessionStorage.getItem('brosan_erp_user') || 'null');
      } catch (e) {
        return null;
      }
    },

    setUser(user) {
      if (user) sessionStorage.setItem('brosan_erp_user', JSON.stringify(user));
      else sessionStorage.removeItem('brosan_erp_user');
    },

    async fetchAuth(url, options = {}) {
      options.headers = options.headers || {};
      const token = this.getToken();
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
      try {
        const res = await fetch(url, options);
        if (res.status === 401) {
          this.setToken(null);
          this.setUser(null);
          if (window.BrosanAuth && typeof window.BrosanAuth.showLockscreen === 'function') {
            window.BrosanAuth.showLockscreen('Oturum süreniz doldu veya geçersiz. Lütfen tekrar giriş yapın.');
          }
        }
        return res;
      } catch (err) {
        throw err;
      }
    },

    async checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          this.isOnline = data.database === 'connected';
          this.updateStatusBadge(true, data.database);
          return data;
        }
      } catch (err) {
        // Fallback to offline local mode
      }
      this.isOnline = false;
      this.updateStatusBadge(false, 'disconnected');
      return null;
    },

    updateStatusBadge(serverReachable, dbStatus) {
      let badge = document.getElementById('db-status-indicator');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'db-status-indicator';
        badge.style.position = 'fixed';
        badge.style.bottom = '40px';
        badge.style.right = '16px';
        badge.style.zIndex = '9999';
        badge.style.fontSize = '11px';
        badge.style.padding = '4px 10px';
        badge.style.borderRadius = '9999px';
        badge.style.cursor = 'pointer';
        badge.onclick = () => window.BrosanAPI.checkHealth();
        document.body.appendChild(badge);
      }

      if (serverReachable && dbStatus === 'connected') {
        badge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-mono text-[10px] cursor-pointer hover:bg-emerald-900 transition-colors shadow-lg';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span>PostgreSQL: Bağlı</span>';
        badge.title = 'PostgreSQL Veritabanı ve REST API Aktif (Yenilemek için tıklayın)';
      } else if (serverReachable) {
        badge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700 font-mono text-[10px] cursor-pointer hover:bg-amber-900 transition-colors shadow-lg';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>API Hazırlanıyor...</span>';
        badge.title = 'API Sunucusu Erişilebilir, DB Bağlantısı Bekleniyor';
      } else {
        badge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px] cursor-pointer hover:bg-slate-700 transition-colors shadow-lg';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span><span>Yerel / Korunmuş Mod</span>';
        badge.title = 'Yerel Ön Bellek Modu (Bağlantı denemek için tıklayın)';
      }
    },

    // ==========================================
    // AUTHENTICATION METHODS
    // ==========================================
    async login(username, password) {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok && data.success && data.token) {
          this.setToken(data.token);
          this.setUser(data.user);
          return { success: true, user: data.user, token: data.token };
        }
        return { success: false, error: data.error || 'Giriş başarısız', locked: data.locked, remainingSec: data.remainingSec };
      } catch (e) {
        return { success: false, error: 'Sunucuya bağlanılamadı: ' + e.message };
      }
    },

    async logout() {
      try {
        await this.fetchAuth(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
      } catch (e) {}
      this.setToken(null);
      this.setUser(null);
      if (window.BrosanAuth && typeof window.BrosanAuth.showLockscreen === 'function') {
        window.BrosanAuth.showLockscreen();
      }
    },

    async getMe() {
      try {
        const token = this.getToken();
        if (!token) return null;
        const res = await this.fetchAuth(`${API_BASE}/auth/me`);
        if (res && res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            this.setUser(data.user);
            return data.user;
          }
        }
      } catch (e) {}
      return null;
    },

    async changePassword(oldPassword, newPassword) {
      try {
        const res = await this.fetchAuth(`${API_BASE}/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPassword, newPassword })
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    // ==========================================
    // PROTECTED ACCOUNTING API METHODS
    // ==========================================
    async getSummary() {
      try {
        const res = await this.fetchAuth(`${API_BASE}/summary`);
        if (res && res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async getAccounts() {
      try {
        const res = await this.fetchAuth(`${API_BASE}/accounts`);
        if (res && res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async createAccount(data) {
      const res = await this.fetchAuth(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    async getContacts(type) {
      try {
        const url = type ? `${API_BASE}/contacts?type=${type}` : `${API_BASE}/contacts`;
        const res = await this.fetchAuth(url);
        if (res && res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async createContact(data) {
      const res = await this.fetchAuth(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    async getInvoices() {
      try {
        const res = await this.fetchAuth(`${API_BASE}/invoices`);
        if (res && res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async createInvoice(data) {
      const res = await this.fetchAuth(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    async getJournal() {
      try {
        const res = await this.fetchAuth(`${API_BASE}/journal`);
        if (res && res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async createJournal(data) {
      const res = await this.fetchAuth(`${API_BASE}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    async getChecks() {
      try {
        const res = await this.fetchAuth(`${API_BASE}/checks`);
        if (res && res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async getEmployees() {
      try {
        const res = await this.fetchAuth(`${API_BASE}/employees`);
        if (res && res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async getProducts() {
      try {
        const res = await this.fetchAuth(`${API_BASE}/products`);
        if (res && res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async getFarukAytinReconciliation() {
      try {
        const res = await this.fetchAuth(`${API_BASE}/mutabakat/faruk-aytin`);
        if (res && res.ok) return await res.json();
      } catch (e) {}
      return null;
    }
  };

  // Otomatik Sağlık Kontrolü Başlat
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.protocol === 'file:') {
      window.BrosanAPI.updateStatusBadge(false, 'local');
    } else {
      window.BrosanAPI.checkHealth();
      setInterval(() => window.BrosanAPI.checkHealth(), 30000);
    }
  });
})();
