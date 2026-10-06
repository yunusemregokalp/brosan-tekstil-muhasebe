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
        badge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-mono text-[10px] cursor-pointer hover:bg-emerald-900 transition-colors';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span>PostgreSQL: Bağlı</span>';
        badge.title = 'PostgreSQL Veritabanı ve REST API Aktif (Yenilemek için tıklayın)';
      } else if (serverReachable) {
        badge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700 font-mono text-[10px] cursor-pointer hover:bg-amber-900 transition-colors';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>API Hazırlanıyor...</span>';
        badge.title = 'API Sunucusu Erişilebilir, DB Bağlantısı Bekleniyor';
      } else {
        badge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px] cursor-pointer hover:bg-slate-700 transition-colors';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span><span>Yerel Mod</span>';
        badge.title = 'Yerel Ön Bellek Modu (Bağlantı denemek için tıklayın)';
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
    },

    async getFarukAytinReconciliation() {
      try {
        const res = await fetch(`${API_BASE}/mutabakat/faruk-aytin`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    }
  };

  // Otomatik Sağlık Kontrolü Başlat
  document.addEventListener('DOMContentLoaded', () => {
    // file:// protokolünde gereksiz konsol hatalarını engelle
    if (window.location.protocol === 'file:') {
      window.BrosanAPI.updateStatusBadge(false, 'local');
    } else {
      window.BrosanAPI.checkHealth();
      setInterval(() => window.BrosanAPI.checkHealth(), 30000);
    }
  });
})();
