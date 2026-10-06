import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("build_ultimate_enterprise_erp.py", "r", encoding="utf-8") as f:
    code = f.read()

print("Current length before stage 4:", len(code))

# 1. UPDATE renderBankMoves
old_bank_moves = """    function renderBankMoves() {
      const tbody = document.getElementById('tbody-bank-moves');
      if (!tbody) return;
      tbody.innerHTML = `
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 text-slate-600">06.10.2026</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Garanti GBP</td>
          <td class="py-2.5 px-3 font-sans text-slate-700">TCMB %40 Bozum Karşılığı TRY Aktarımı</td>
          <td class="py-2.5 px-3 text-right text-slate-400">-</td>
          <td class="py-2.5 px-3 text-right text-rose-700 font-bold">£3.410,00</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">£48.250,00</td>
        </tr>
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 text-slate-600">06.10.2026</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Garanti TRY</td>
          <td class="py-2.5 px-3 font-sans text-emerald-800">TCMB Bozum TRY Bedeli Girişi (Kur: 45.1200)</td>
          <td class="py-2.5 px-3 text-right text-emerald-700 font-bold">₺153.859,20</td>
          <td class="py-2.5 px-3 text-right text-slate-400">-</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">₺845.200,00</td>
        </tr>
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 text-slate-600">04.10.2026</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Garanti TRY</td>
          <td class="py-2.5 px-3 font-sans text-slate-700">Birlik Kumaşçılık Kısmi Ödeme (EFT)</td>
          <td class="py-2.5 px-3 text-right text-slate-400">-</td>
          <td class="py-2.5 px-3 text-right text-rose-700 font-bold">₺100.000,00</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">₺691.340,80</td>
        </tr>
      `;
    }"""

new_bank_moves = """    function renderBankMoves() {
      const tbody = document.getElementById('tbody-bank-moves');
      if (!tbody) return;
      tbody.innerHTML = `
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 text-slate-600 font-mono">01.10.2026</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Garanti GBP (417-9034578)</td>
          <td class="py-2.5 px-3 font-sans text-slate-700">Ben Ellis e-İhracat Bedeli Tahsilatı (BS02026000000013)</td>
          <td class="py-2.5 px-3 text-right text-emerald-700 font-bold">£7.388,10</td>
          <td class="py-2.5 px-3 text-right text-slate-400">-</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">£23.759,07</td>
        </tr>
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 text-slate-600 font-mono">30.09.2026</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Garanti TL (417-6289477)</td>
          <td class="py-2.5 px-3 font-sans text-slate-700">Faruk Aytin Garanti BBVA Havalesi (100 USD Karşılığı, Kur: 50,00)</td>
          <td class="py-2.5 px-3 text-right text-slate-400">-</td>
          <td class="py-2.5 px-3 text-right text-rose-700 font-bold">₺5.000,00</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">₺15.732,92</td>
        </tr>
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 text-slate-600 font-mono">22.09.2026</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Garanti TL (417-6289477)</td>
          <td class="py-2.5 px-3 font-sans text-slate-700">Faruk Aytin Garanti BBVA Havalesi (100 USD Karşılığı, Kur: 50,00)</td>
          <td class="py-2.5 px-3 text-right text-slate-400">-</td>
          <td class="py-2.5 px-3 text-right text-rose-700 font-bold">₺5.000,00</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">₺20.732,92</td>
        </tr>
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 text-slate-600 font-mono">14.09.2026</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Garanti TL (417-6289477)</td>
          <td class="py-2.5 px-3 font-sans text-slate-700">Faruk Aytin Garanti BBVA Havalesi ($1.000 USD Avans, Kur: 48,42)</td>
          <td class="py-2.5 px-3 text-right text-slate-400">-</td>
          <td class="py-2.5 px-3 text-right text-rose-700 font-bold">₺48.420,00</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">₺25.732,92</td>
        </tr>
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 text-slate-600 font-mono">07.09.2026</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Garanti TL (417-6289477)</td>
          <td class="py-2.5 px-3 font-sans text-slate-700">Faruk Aytin Garanti BBVA Havalesi ($2.000 USD Avans, Kur: 48,30)</td>
          <td class="py-2.5 px-3 text-right text-slate-400">-</td>
          <td class="py-2.5 px-3 text-right text-rose-700 font-bold">₺96.600,00</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">₺74.152,92</td>
        </tr>
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 text-slate-600 font-mono">31.07.2026</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Garanti TL (417-6289477)</td>
          <td class="py-2.5 px-3 font-sans text-slate-700">Faruk Aytin NSA2026000000070 Fatura Ödemesi ($3.036 USD, Kur: 47,25)</td>
          <td class="py-2.5 px-3 text-right text-slate-400">-</td>
          <td class="py-2.5 px-3 text-right text-rose-700 font-bold">₺143.451,00</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">₺170.752,92</td>
        </tr>
      `;
    }"""

if old_bank_moves in code:
    code = code.replace(old_bank_moves, new_bank_moves)
    print("✓ Replaced renderBankMoves")
else:
    print("! renderBankMoves not found exactly")

# 2. UPDATE renderContactsTable
old_contacts_table = """    // RENDER CONTACTS TABLE
    function renderContactsTable() {
      const tbody = document.getElementById('tbody-contacts');
      if (!tbody) return;
      tbody.innerHTML = '';

      BROSAN_ERP.contacts.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50' + (c.isBenEllis ? ' bg-blue-50/20' : '');
        tr.innerHTML = `
          <td class="py-3 px-3 font-bold text-slate-900">${c.code}</td>
          <td class="py-3 px-3 font-sans font-bold text-slate-900">${c.name}</td>
          <td class="py-3 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">${c.type}</span></td>
          <td class="py-3 px-3">${c.vkn}</td>
          <td class="py-3 px-3 font-sans">${c.city}</td>
          <td class="py-3 px-3 text-right font-bold ${c.balance.includes('Borç') ? 'text-rose-700' : 'text-emerald-700'}">${c.balance}</td>
          <td class="py-3 px-3 text-center font-sans">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">${c.status}</span>
          </td>
          <td class="py-3 px-3 text-right font-sans space-x-1">
            <button onclick="viewCariEkstre('${c.code}')" class="px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-50 font-semibold">Ekstre</button>
            ${c.isBenEllis ? `<button onclick="openModal('modal-dab-calculator')" class="px-2 py-1 bg-amber-600 text-white rounded text-xs font-semibold">TCMB Bozum</button>` : ''}
          </td>
        `;
        tbody.appendChild(tr);
      });
    }"""

new_contacts_table = """    // RENDER CONTACTS TABLE (15 Authentic Paraşüt Live Records)
    function renderContactsTable() {
      const tbody = document.getElementById('tbody-contacts');
      if (!tbody) return;
      tbody.innerHTML = '';

      BROSAN_ERP.contacts.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50' + (c.isBenEllis ? ' bg-blue-50/20' : c.isFarukAytin ? ' bg-amber-50/20' : '');
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-bold font-mono text-slate-900">${c.code}</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">
            ${c.name}
            ${c.isFarukAytin ? '<span class="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-900 font-extrabold font-mono">NİSA TEKSTİL</span>' : ''}
          </td>
          <td class="py-2.5 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">${c.type}</span></td>
          <td class="py-2.5 px-3 font-mono text-slate-700">${c.vkn}</td>
          <td class="py-2.5 px-3 font-sans text-slate-600">${c.city}</td>
          <td class="py-2.5 px-3 text-right font-bold font-mono ${c.balance.includes('Borç') ? 'text-rose-700' : 'text-emerald-700'}">${c.balance}</td>
          <td class="py-2.5 px-3 text-center font-sans">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isFarukAytin ? 'bg-amber-100 text-amber-900 font-mono' : 'bg-slate-100 text-slate-700'}">${c.status}</span>
          </td>
          <td class="py-2.5 px-3 text-right font-sans space-x-1 whitespace-nowrap">
            <button onclick="viewCariEkstre('${c.code}')" class="px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-100 font-semibold shadow-2xs">Ekstre</button>
            ${c.isFarukAytin ? `<button onclick="switchView('mutabakat')" class="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-2xs">Mahsup Masası</button>` : ''}
            ${c.isBenEllis ? `<button onclick="openModal('modal-dab-calculator')" class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-2xs">TCMB Bozum</button>` : ''}
          </td>
        `;
        tbody.appendChild(tr);
      });
    }"""

if old_contacts_table in code:
    code = code.replace(old_contacts_table, new_contacts_table)
    print("✓ Replaced renderContactsTable")
else:
    print("! renderContactsTable not found exactly")

# 3. UPDATE viewCariEkstre FOR FARUK AYTİN AND BEN ELLIS
old_view_ekstre = """    function viewCariEkstre(contactCode) {
      const c = BROSAN_ERP.contacts.find(con => con.code === contactCode);
      if (!c) return;

      document.getElementById('ekstre-modal-title').innerText = `${c.name} - Cari Hesap Ekstresi`;
      document.getElementById('ekstre-modal-body').innerHTML = `
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center mb-3">
          <div>
            <span class="font-bold text-slate-900 block">${c.name}</span>
            <span class="text-slate-500">Cari Kodu: <strong class="font-mono">${c.code}</strong> • VKN/VAT: <strong class="font-mono">${c.vkn}</strong></span>
          </div>
          <div class="text-right">
            <span class="text-slate-500 block">Güncel Bakiye:</span>
            <span class="font-mono font-bold text-sm ${c.balance.includes('Borç') ? 'text-rose-700' : 'text-emerald-700'}">${c.balance}</span>
          </div>
        </div>
        <table class="w-full text-left border border-slate-200 rounded font-mono text-xs">
          <thead class="bg-slate-100 text-slate-600 text-[10px] font-sans uppercase">
            <tr>
              <th class="p-2">Tarih</th>
              <th class="p-2">İşlem / Belge No</th>
              <th class="p-2 text-right">Borç (₺)</th>
              <th class="p-2 text-right">Alacak (₺)</th>
              <th class="p-2 text-right">Bakiye (₺)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr>
              <td class="p-2">01.09.2026</td>
              <td class="p-2 font-sans font-medium">Dönem Başı Açılış Bakiyesi</td>
              <td class="p-2 text-right font-bold text-emerald-700">384.648,00</td>
              <td class="p-2 text-right text-slate-400">-</td>
              <td class="p-2 text-right font-bold">384.648,00 (B)</td>
            </tr>
            <tr>
              <td class="p-2">08.09.2026</td>
              <td class="p-2 font-sans font-medium">e-İhracat Faturası (EFT2026000000104)</td>
              <td class="p-2 text-right font-bold text-emerald-700">547.721,60</td>
              <td class="p-2 text-right text-slate-400">-</td>
              <td class="p-2 text-right font-bold">932.369,60 (B)</td>
            </tr>
            <tr>
              <td class="p-2">15.09.2026</td>
              <td class="p-2 font-sans font-medium">Garanti GBP Gelen Havale / İBKB</td>
              <td class="p-2 text-right text-slate-400">-</td>
              <td class="p-2 text-right font-bold text-rose-700">384.648,00</td>
              <td class="p-2 text-right font-bold">547.721,60 (B)</td>
            </tr>
          </tbody>
        </table>
      `;
      openModal('modal-cari-ekstre');
    }"""

new_view_ekstre = """    function viewCariEkstre(contactCode) {
      const c = BROSAN_ERP.contacts.find(con => con.code === contactCode);
      if (!c) return;

      document.getElementById('ekstre-modal-title').innerText = `${c.name} - Resmi Cari Hesap Ekstresi`;

      if (contactCode === 'CR-TR-0004' || c.isFarukAytin) {
        // AUTHENTIC FARUK AYTİN & NİSA TEKSTİL RECONCILIATION STATEMENT (EXCEL & PARAŞÜT 100% IDENTICAL)
        document.getElementById('ekstre-modal-body').innerHTML = `
          <div class="p-3 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center mb-3">
            <div>
              <span class="font-bold text-slate-900 block font-sans">${c.name} (NİSA TEKSTİL)</span>
              <span class="text-slate-600 text-xs">Cari Kodu: <strong class="font-mono">${c.code}</strong> • TCKN: <strong class="font-mono">${c.vkn}</strong> • Sultangazi, İstanbul</span>
            </div>
            <div class="text-right">
              <span class="text-slate-500 text-xs block">Net Kalan Cari Borç:</span>
              <span class="font-mono font-black text-base text-rose-700">-$10.335,35 USD</span>
              <span class="text-[11px] font-mono text-slate-600 block">-₺508.894,07 TL</span>
            </div>
          </div>

          <div class="mb-2 text-xs font-semibold text-slate-700 flex justify-between items-center">
            <span>Fason Üretim, Banka Havaleleri ve Kumaş Satış Mahsup Hareketleri (Dönem: 2026/07 - 2026/10)</span>
            <span class="text-emerald-700 text-[11px]">✓ Excel &amp; Paraşüt Denk</span>
          </div>

          <div class="overflow-x-auto border border-slate-200 rounded-lg">
            <table class="w-full text-left border-collapse font-mono text-xs">
              <thead class="bg-slate-100 text-slate-600 text-[10px] font-sans uppercase">
                <tr>
                  <th class="p-2">Tarih</th>
                  <th class="p-2">İşlem / Belge No</th>
                  <th class="p-2">Açıklama</th>
                  <th class="p-2 text-right">Borç (USD)</th>
                  <th class="p-2 text-right">Alacak (USD)</th>
                  <th class="p-2 text-right">Bakiye (USD)</th>
                  <th class="p-2 text-right">Bakiye (TL)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr class="hover:bg-slate-50">
                  <td class="p-2 text-slate-600">30.07.2026</td>
                  <td class="p-2 font-bold text-slate-900">NSA2026000000070</td>
                  <td class="p-2 font-sans text-slate-700">EMK Oversized Tişört (276 Adet Dikim Fasonu)</td>
                  <td class="p-2 text-right text-slate-400">-</td>
                  <td class="p-2 text-right text-slate-900 font-bold">$3.036,00</td>
                  <td class="p-2 text-right text-rose-700 font-bold">-$3.036,00</td>
                  <td class="p-2 text-right text-rose-700">-₺143.451,00</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 text-slate-600">31.07.2026</td>
                  <td class="p-2 font-bold text-emerald-800">Garanti Havale #1</td>
                  <td class="p-2 font-sans text-slate-700">NSA-70 Fatura Ödemesi (Dekont: 17.07.43, Kur: 47,25)</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">$3.036,00</td>
                  <td class="p-2 text-right text-slate-400">-</td>
                  <td class="p-2 text-right text-slate-800 font-bold">$0,00</td>
                  <td class="p-2 text-right text-slate-800">₺0,00</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 text-slate-600">07.09.2026</td>
                  <td class="p-2 font-bold text-emerald-800">Garanti Havale #2</td>
                  <td class="p-2 font-sans text-slate-700">Siparişe İstinaden Avans (Dekont: 16.25.27, Kur: 48,30)</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">$2.000,00</td>
                  <td class="p-2 text-right text-slate-400">-</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">+$2.000,00</td>
                  <td class="p-2 text-right text-emerald-700">+₺96.600,00</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 text-slate-600">14.09.2026</td>
                  <td class="p-2 font-bold text-emerald-800">Garanti Havale #3</td>
                  <td class="p-2 font-sans text-slate-700">Cari Hesaba İstinaden Avans (Dekont: 14.19.11, Kur: 48,42)</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">$1.000,00</td>
                  <td class="p-2 text-right text-slate-400">-</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">+$3.000,00</td>
                  <td class="p-2 text-right text-emerald-700">+₺145.020,00</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 text-slate-600">22.09.2026</td>
                  <td class="p-2 font-bold text-emerald-800">Garanti Havale #4</td>
                  <td class="p-2 font-sans text-slate-700">100 USD Karşılığı Cari Ödeme (Dekont: 18.03.45, Kur: 50,00)</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">$100,00</td>
                  <td class="p-2 text-right text-slate-400">-</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">+$3.100,00</td>
                  <td class="p-2 text-right text-emerald-700">+₺150.020,00</td>
                </tr>
                <tr class="hover:bg-slate-50 bg-blue-50/20">
                  <td class="p-2 text-slate-600">27.09.2026</td>
                  <td class="p-2 font-bold text-blue-700">BR02026000000024</td>
                  <td class="p-2 font-sans text-slate-700">Fasona Verilen Kumaş Satış &amp; Mahsup (992,5 Kg, TCMB: 48,7901)</td>
                  <td class="p-2 text-right text-blue-700 font-bold">$7.461,45</td>
                  <td class="p-2 text-right text-slate-400">-</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">+$10.561,45</td>
                  <td class="p-2 text-right text-emerald-700">+₺514.065,00</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 text-slate-600">30.09.2026</td>
                  <td class="p-2 font-bold text-emerald-800">Garanti Havale #5</td>
                  <td class="p-2 font-sans text-slate-700">100 USD Karşılığı Cari Ödeme (Dekont: 18.20.49, Kur: 50,00)</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">$100,00</td>
                  <td class="p-2 text-right text-slate-400">-</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">+$10.661,45</td>
                  <td class="p-2 text-right text-emerald-700">+₺519.065,00</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 text-slate-600">01.10.2026</td>
                  <td class="p-2 font-bold text-slate-900">NSA2026000000084</td>
                  <td class="p-2 font-sans text-slate-700">Ben Ellis (140 T-shirt + 180 Hoodie, Paraşüt Fiş: 1044145905)</td>
                  <td class="p-2 text-right text-slate-400">-</td>
                  <td class="p-2 text-right text-slate-900 font-bold">$6.366,80</td>
                  <td class="p-2 text-right text-emerald-700 font-bold">+$4.294,65</td>
                  <td class="p-2 text-right text-emerald-700">+₺207.535,57</td>
                </tr>
                <tr class="hover:bg-slate-50 bg-rose-50/30">
                  <td class="p-2 text-slate-600 font-bold">05.10.2026</td>
                  <td class="p-2 font-bold text-rose-800">NSA2026000000087</td>
                  <td class="p-2 font-sans text-slate-700 font-bold">Ben Ellis (375 T-shirt + 394 Hoodie, Paraşüt Fiş: 1044145920)</td>
                  <td class="p-2 text-right text-slate-400">-</td>
                  <td class="p-2 text-right text-rose-700 font-bold">$14.630,00</td>
                  <td class="p-2 text-right text-rose-700 font-black">-$10.335,35</td>
                  <td class="p-2 text-right text-rose-700 font-black">-₺508.894,07</td>
                </tr>
              </tbody>
              <tfoot class="bg-slate-100 border-t-2 border-slate-300 font-bold">
                <tr>
                  <td colspan="3" class="p-2 font-sans text-slate-900">GENEL TOPLAMLAR &amp; NET BAKİYE:</td>
                  <td class="p-2 text-right text-emerald-700">$13.697,45</td>
                  <td class="p-2 text-right text-purple-700">$24.032,80</td>
                  <td class="p-2 text-right text-rose-700 font-black">-$10.335,35 USD</td>
                  <td class="p-2 text-right text-rose-700 font-black">-₺508.894,07 TL</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="mt-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs flex justify-between items-center">
            <div>
              <span class="text-slate-600">Ödenecek Net KDV Tutarı:</span>
              <strong class="font-mono text-amber-900 ml-1">$1.230,49 USD (₺60.355,83 TL)</strong>
            </div>
            <button onclick="switchView('mutabakat'); closeModal('modal-cari-ekstre');" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs">
              Mutabakat Masasını Aç →
            </button>
          </div>
        `;
      } else if (c.isBenEllis || contactCode === 'CR-GB-0001') {
        // BEN ELLIS AUTHENTIC STATEMENT
        document.getElementById('ekstre-modal-body').innerHTML = `
          <div class="p-3 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-center mb-3">
            <div>
              <span class="font-bold text-slate-900 block font-sans">${c.name}</span>
              <span class="text-slate-600 text-xs">Cari Kodu: <strong class="font-mono">${c.code}</strong> • VKN/VAT: <strong class="font-mono">${c.vkn}</strong> • Bristol, Birleşik Krallık</span>
            </div>
            <div class="text-right">
              <span class="text-slate-500 text-xs block">Açık Alacak Bakiyesi:</span>
              <span class="font-mono font-black text-base text-blue-700">£22.414,22 GBP</span>
              <span class="text-[11px] font-mono text-slate-600 block">₺1.452.246,45 TL</span>
            </div>
          </div>
          <table class="w-full text-left border border-slate-200 rounded font-mono text-xs">
            <thead class="bg-slate-100 text-slate-600 text-[10px] font-sans uppercase">
              <tr>
                <th class="p-2">Tarih</th>
                <th class="p-2">İşlem / Belge No</th>
                <th class="p-2 text-right">Borç (£)</th>
                <th class="p-2 text-right">Alacak (£)</th>
                <th class="p-2 text-right">Bakiye (£)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="p-2 text-slate-600">01.09.2026</td>
                <td class="p-2 font-sans font-medium">Dönem Başı Açılış Bakiyesi</td>
                <td class="p-2 text-right font-bold text-blue-700">£15.026,12</td>
                <td class="p-2 text-right text-slate-400">-</td>
                <td class="p-2 text-right font-bold">£15.026,12 (B)</td>
              </tr>
              <tr>
                <td class="p-2 text-slate-600">01.10.2026</td>
                <td class="p-2 font-sans font-medium">e-İhracat Faturası (BS02026000000013 - 769 Adet)</td>
                <td class="p-2 text-right font-bold text-blue-700">£7.388,10</td>
                <td class="p-2 text-right text-slate-400">-</td>
                <td class="p-2 text-right font-bold text-blue-700">£22.414,22 (B)</td>
              </tr>
            </tbody>
          </table>
        `;
      } else {
        // GENERIC STATEMENT
        document.getElementById('ekstre-modal-body').innerHTML = `
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center mb-3">
            <div>
              <span class="font-bold text-slate-900 block font-sans">${c.name}</span>
              <span class="text-slate-500 text-xs">Cari Kodu: <strong class="font-mono">${c.code}</strong> • VKN: <strong class="font-mono">${c.vkn}</strong> • ${c.city}</span>
            </div>
            <div class="text-right">
              <span class="text-slate-500 text-xs block">Güncel Bakiye:</span>
              <span class="font-mono font-bold text-sm ${c.balance.includes('Borç') ? 'text-rose-700' : 'text-emerald-700'}">${c.balance}</span>
            </div>
          </div>
          <table class="w-full text-left border border-slate-200 rounded font-mono text-xs">
            <thead class="bg-slate-100 text-slate-600 text-[10px] font-sans uppercase">
              <tr>
                <th class="p-2">Tarih</th>
                <th class="p-2">İşlem / Belge No</th>
                <th class="p-2 text-right">Borç (₺)</th>
                <th class="p-2 text-right">Alacak (₺)</th>
                <th class="p-2 text-right">Bakiye (₺)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="p-2 text-slate-600">01.10.2026</td>
                <td class="p-2 font-sans font-medium">Cari Hesap Açılış / Güncel Bakiye</td>
                <td class="p-2 text-right font-bold ${c.balance.includes('Borç') ? 'text-slate-400' : 'text-emerald-700'}">${c.balance.includes('Borç') ? '-' : c.balance}</td>
                <td class="p-2 text-right font-bold ${c.balance.includes('Borç') ? 'text-rose-700' : 'text-slate-400'}">${c.balance.includes('Borç') ? c.balance : '-'}</td>
                <td class="p-2 text-right font-bold">${c.balance}</td>
              </tr>
            </tbody>
          </table>
        `;
      }

      openModal('modal-cari-ekstre');
    }

    // PRINT FARUK AYTİN MUTABAKAT MEKTUBU (A4)
    function printFarukAytinMutabakat() {
      const printWin = window.open('', '_blank');
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Faruk Aytin Cari Mutabakat Mektubu</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; font-size: 13px; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .company { font-size: 18px; font-weight: bold; color: #0f172a; }
            .title { font-size: 15px; font-weight: bold; margin-top: 5px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f1f5f9; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
            .sig-box { width: 45%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ.</div>
            <div class="title">RESMİ CARİ HESAP VE FASON MAHSUP MUTABAKAT MEKTUBU</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">Tarih: 06.10.2026 • Mutabakat No: MTB-2026-004</div>
          </div>

          <p><strong>Sayın: FARUK AYTİN (NİSA TEKSTİL)</strong><br>
          TCKN: 46849262292 • Sultangazi / İSTANBUL</p>

          <p>Şirketimiz nezdindeki cari hesabınız, fason dikim faturalarınız, banka ödemelerimiz ve tarafınıza düzenlenen kumaş satış mahsup faturamız incelenmiş olup, 06.10.2026 tarihi itibariyle oluşan mutabakat tablosu aşağıda sunulmuştur:</p>

          <table>
            <thead>
              <tr>
                <th>İşlem / Belge</th>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th class="text-right">Tutar (USD)</th>
                <th class="text-right">Tutar (TL)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>NSA2026000000070</td>
                <td>30.07.2026</td>
                <td>EMK Oversized Tişört (276 Adet Dikim)</td>
                <td class="text-right font-bold">$3.036,00</td>
                <td class="text-right">₺143.451,00</td>
              </tr>
              <tr>
                <td>NSA2026000000084</td>
                <td>01.10.2026</td>
                <td>Ben Ellis Fason (140 T-shirt + 180 Hoodie)</td>
                <td class="text-right font-bold">$6.366,80</td>
                <td class="text-right">₺311.529,43</td>
              </tr>
              <tr>
                <td>NSA2026000000087</td>
                <td>05.10.2026</td>
                <td>Ben Ellis Fason (375 T-shirt + 394 Hoodie)</td>
                <td class="text-right font-bold">$14.630,00</td>
                <td class="text-right">₺716.429,64</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td colspan="3"><strong>TOPLAM FASON ALIŞI</strong></td>
                <td class="text-right font-bold"><strong>$24.032,80</strong></td>
                <td class="text-right"><strong>₺1.171.410,07</strong></td>
              </tr>
              <tr>
                <td>BR02026000000024</td>
                <td>27.09.2026</td>
                <td>Brosan Kumaş Satış & Mahsup (992,5 Kg Kumaş)</td>
                <td class="text-right font-bold text-right">-$7.461,45</td>
                <td class="text-right">-₺364.045,00</td>
              </tr>
              <tr>
                <td>Garanti BBVA Havaleleri</td>
                <td>Temmuz - Eylül</td>
                <td>5 Adet Banka Havalesi Toplamı</td>
                <td class="text-right font-bold text-right">-$6.236,00</td>
                <td class="text-right">-₺298.471,00</td>
              </tr>
              <tr style="background:#fef2f2; font-size:13px;">
                <td colspan="3"><strong>NET KALAN CARİ BORÇ BAKİYESİ:</strong></td>
                <td class="text-right font-bold" style="color:#b91c1c;"><strong>-$10.335,35 USD</strong></td>
                <td class="text-right font-bold" style="color:#b91c1c;"><strong>-₺508.894,07 TL</strong></td>
              </tr>
              <tr style="background:#fffbeb;">
                <td colspan="3"><strong>ÖDENECEK NET KDV (%10):</strong></td>
                <td class="text-right font-bold" style="color:#b45309;"><strong>$1.230,49 USD</strong></td>
                <td class="text-right font-bold" style="color:#b45309;"><strong>₺60.355,83 TL</strong></td>
              </tr>
            </tbody>
          </table>

          <p>İşbu mutabakat mektubunu onaylamanızı ve kaşe/imzalı nüshasını tarafımıza iletmenizi rica ederiz.</p>

          <div class="signatures">
            <div class="sig-box">
              BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ.<br><br><br>
              Yetkili İmza / Kaşe
            </div>
            <div class="sig-box">
              FARUK AYTİN (NİSA TEKSTİL)<br><br><br>
              Yetkili İmza / Kaşe
            </div>
          </div>
        </body>
        </html>
      `);
      printWin.document.close();
      printWin.focus();
    }"""

if old_view_ekstre in code:
    code = code.replace(old_view_ekstre, new_view_ekstre)
    print("✓ Replaced viewCariEkstre and added printFarukAytinMutabakat")
else:
    print("! old_view_ekstre not found exactly")

with open("build_ultimate_enterprise_erp.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Saved stage 4 updates.")
