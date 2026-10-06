/**
 * BROSAN TEKSTİL ERP — FULL-STACK API & DATABASE CLIENT
 * Connects frontend UI to PostgreSQL backend API via REST
 */

(function () {
  const API_BASE = window.location.origin.startsWith('http') 
    ? `${window.location.origin}/api` 
    : 'http://localhost:3000/api';

  window.BrosanAPI = {
    isOnline: false,

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
        badge.style.bottom = '16px';
        badge.style.right = '16px';
        badge.style.zIndex = '9999';
        badge.style.fontSize = '12px';
        badge.style.fontWeight = '600';
        badge.style.padding = '8px 14px';
        badge.style.borderRadius = '20px';
        badge.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        badge.style.transition = 'all 0.3s ease';
        badge.style.cursor = 'pointer';
        badge.onclick = () => window.BrosanAPI.checkHealth();
        document.body.appendChild(badge);
      }

      if (serverReachable && dbStatus === 'connected') {
        badge.style.backgroundColor = '#ecfdf5';
        badge.style.color = '#065f46';
        badge.style.border = '1px solid #a7f3d0';
        badge.innerHTML = '🟢 PostgreSQL SQL Veritabanı: <strong>Bağlı</strong>';
      } else if (serverReachable) {
        badge.style.backgroundColor = '#fffbeb';
        badge.style.color = '#92400e';
        badge.style.border = '1px solid #fde68a';
        badge.innerHTML = '🟡 Sunucu Aktif (Veritabanı Hazırlanıyor...)';
      } else {
        badge.style.backgroundColor = '#f1f5f9';
        badge.style.color = '#475569';
        badge.style.border = '1px solid #cbd5e1';
        badge.innerHTML = '⚪ Yerel Hızlı Mod (Local Cache)';
      }
    },

    async getSummary() {
      try {
        const res = await fetch(`${API_BASE}/summary`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async getAccounts() {
      try {
        const res = await fetch(`${API_BASE}/accounts`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async createAccount(data) {
      const res = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    async getContacts(type) {
      try {
        const url = type ? `${API_BASE}/contacts?type=${type}` : `${API_BASE}/contacts`;
        const res = await fetch(url);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async createContact(data) {
      const res = await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    async getInvoices() {
      try {
        const res = await fetch(`${API_BASE}/invoices`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async createInvoice(data) {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    async getJournal() {
      try {
        const res = await fetch(`${API_BASE}/journal`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async createJournal(data) {
      const res = await fetch(`${API_BASE}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    async getChecks() {
      try {
        const res = await fetch(`${API_BASE}/checks`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async getEmployees() {
      try {
        const res = await fetch(`${API_BASE}/employees`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    async getProducts() {
      try {
        const res = await fetch(`${API_BASE}/products`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    }
  };

  // Otomatik Sağlık Kontrolü Başlat
  document.addEventListener('DOMContentLoaded', () => {
    window.BrosanAPI.checkHealth();
    // Her 30 saniyede bir durumu kontrol et
    setInterval(() => window.BrosanAPI.checkHealth(), 30000);
  });
})();
