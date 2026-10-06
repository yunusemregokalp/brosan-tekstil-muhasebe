import re
import os

import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("build_ultimate_enterprise_erp.py", "r", encoding="utf-8") as f:
    content = f.read()

print("Original length:", len(content))

# 1. Update Ben Ellis Highlight in view-contacts
old_ben_ellis_highlight = """          <!-- Ben Ellis Highlight Card -->
          <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-display font-bold text-slate-900 text-base">BEN ELLIS</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">Birleşik Krallık</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">VIP İhracat Müşterisi</span>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Cari Kodu: <strong class="text-slate-800 font-mono">CR-GB-0024</strong></span>
                <span>•</span>
                <span>KDV / VAT: <strong class="text-slate-800 font-mono">GB9283741</strong></span>
                <span>•</span>
                <span>Adres: <strong class="text-slate-800">Manchester, İngiltere</strong></span>
                <span>•</span>
                <span>Bakiye: <strong id="ben-ellis-balance-highlight" class="text-slate-900 font-bold font-mono">£12.139,22 GBP</strong></span>
              </div>
            </div>
            <!-- Garanti BBVA IBAN Box -->
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
              <div class="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                GB
              </div>
              <div>
                <span class="text-[10px] text-slate-500 font-semibold uppercase block">Garanti BBVA İhracat GBP IBAN:</span>
                <span class="font-mono text-xs font-bold text-slate-900">TR32 0006 2000 1827 0009 2381 01</span>
              </div>
              <button onclick="navigator.clipboard.writeText('TR320006200018270009238101'); showToast('Garanti BBVA GBP IBAN panoya kopyalandı!', 'success')" class="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded hover:bg-slate-100" title="IBAN Kopyala">
                <span class="material-symbols-outlined text-[16px]">content_copy</span>
              </button>
            </div>
          </div>"""

new_ben_ellis_and_faruk_highlights = """          <!-- Two Highlight Cards: Ben Ellis (Alacak) & Faruk Aytin (Fason Mahsup Borcu) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Ben Ellis Highlight Card -->
            <div class="bg-white rounded-lg p-4 border border-blue-200/80 shadow-xs flex flex-col justify-between gap-3 bg-gradient-to-br from-blue-50/20 to-white">
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-display font-bold text-slate-900 text-base">BEN ELLİS</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">Bristol, Birleşik Krallık</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">VIP İhracat</span>
                  </div>
                  <span class="font-mono text-sm font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">£22.414,22 GBP</span>
                </div>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>Cari Kodu: <strong class="text-slate-800 font-mono">CR-GB-0001</strong></span>
                  <span>•</span>
                  <span>TRY Karşılığı: <strong class="text-slate-900 font-bold font-mono">₺1.452.246,45 TL</strong></span>
                  <span>•</span>
                  <span>Teslimat: <span class="text-slate-700 font-medium">Cherith Church Lane Chew Stoke Bristol</span></span>
                </div>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">GBP</span>
                  <div>
                    <span class="text-[10px] text-slate-500 font-semibold uppercase block">Garanti BBVA İhracat GBP IBAN:</span>
                    <span class="font-mono text-xs font-bold text-slate-900">TR86 0006 2000 4170 0009 0345 78</span>
                  </div>
                </div>
                <button onclick="navigator.clipboard.writeText('TR860006200041700009034578'); showToast('Garanti BBVA GBP IBAN kopyalandı!', 'success')" class="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded hover:bg-slate-100" title="Kopyala">
                  <span class="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>
            </div>

            <!-- Faruk Aytin Highlight Card -->
            <div class="bg-white rounded-lg p-4 border border-amber-300 shadow-xs flex flex-col justify-between gap-3 bg-gradient-to-br from-amber-50/30 to-white">
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-display font-bold text-slate-900 text-base">FARUK AYTİN</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900">NİSA TEKSTİL</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">Fason &amp; Kumaş Mahsubu</span>
                  </div>
                  <span class="font-mono text-sm font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">-$10.335,35 USD</span>
                </div>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>Cari Kodu: <strong class="text-slate-800 font-mono">CR-TR-0004</strong></span>
                  <span>•</span>
                  <span>TCKN: <strong class="text-slate-800 font-mono">46849262292</strong></span>
                  <span>•</span>
                  <span>TL Net Bakiye: <strong class="text-rose-700 font-bold font-mono">-₺508.894,07 TL</strong></span>
                </div>
              </div>
              <div class="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                <div>
                  <span class="text-[10px] text-amber-800 font-bold uppercase block">Fason Alış: $24.032,80 • Kumaş Mahsubu: $7.461,45 • Garanti Ödeme: $6.236,00</span>
                  <span class="text-[11px] text-slate-700 font-medium">Ödenecek Net KDV: <strong>$1.230,49 USD (₺60.355,83)</strong> • Paraşüt &amp; Excel Tam Mutabık ✓</span>
                </div>
                <button onclick="switchView('mutabakat')" class="px-2.5 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs">
                  <span>Masayı Aç</span>
                  <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>"""

if old_ben_ellis_highlight in content:
    content = content.replace(old_ben_ellis_highlight, new_ben_ellis_and_faruk_highlights)
    print("✓ Replaced contacts highlight cards")
else:
    print("! Contacts highlight card not found exactly")

# 2. Update view-mutabakat with Complete Workstation
old_view_mutabakat = """        <div id="view-mutabakat" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Mutabakat</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Form Ba / Form Bs &amp; e-Mutabakat Masası</h1>
            </div>
            <button onclick="showToast('Tüm carilere e-Mutabakat e-postası ve SMS gönderildi.', 'success')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[18px]">send</span>
              <span>Toplu e-Mutabakat Gönder</span>
            </button>
          </div>

          <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-xs text-xs space-y-3">
            <h3 class="font-bold text-slate-900">GİB ₺5.000 Üzeri Bildirime Tabi İşlemler (Ekim 2026)</h3>
            <p class="text-slate-500">Vergi Usul Kanunu 396 Sıra No'lu Genel Tebliği uyarınca elektronik ortamda bildirilen alış ve satışlar.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 border border-slate-200 rounded-lg bg-slate-50">
                <span class="font-bold text-slate-800 uppercase block mb-1">Form Ba (Alış Bildirimi):</span>
                <div class="font-mono text-sm font-bold text-slate-900">3 Belge • ₺342.180,00</div>
                <span class="text-[11px] text-emerald-700 mt-1 block">Birlik Kumaşçılık, Çetin Boyahane, Marifet İplik</span>
              </div>
              <div class="p-3 border border-slate-200 rounded-lg bg-slate-50">
                <span class="font-bold text-slate-800 uppercase block mb-1">Form Bs (Satış Bildirimi):</span>
                <div class="font-mono text-sm font-bold text-slate-900">4 Belge • ₺1.854.200,00</div>
                <span class="text-[11px] text-emerald-700 mt-1 block">Ben Ellis, Milano Tessuti, LCW</span>
              </div>
            </div>
          </div>
        </div>"""

new_view_mutabakat = """        <!-- ========================================== -->
        <!-- MODULE 10: FARUK AYTİN (NİSA TEKSTİL) FASON & KUMAŞ MAHSUP MUTABAKAT MASASI -->
        <!-- ========================================== -->
        <div id="view-mutabakat" class="module-view space-y-5">
          <!-- Page Header -->
          <div class="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-200 gap-3">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-amber-600 font-bold">Fason &amp; Cari Mutabakat</span>
                <span>/</span>
                <span class="text-slate-900 font-bold">Faruk Aytin (Nisa Tekstil)</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5 flex items-center gap-2">
                <span>Faruk Aytin &amp; Nisa Tekstil Fason Üretim &amp; Kumaş Mahsubu Mutabakat Masası</span>
                <span class="px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">%100 Mutabık (Excel &amp; Paraşüt)</span>
              </h1>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="printFarukAytinMutabakat()" class="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">print</span>
                <span>Resmi Mutabakat Mektubu (A4)</span>
              </button>
              <button onclick="showToast('Excel çalışma kağıdı (FARUK AYTİN CARİ.xlsx) ve Paraşüt verileri birebir doğrulandı.', 'success')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">verified</span>
                <span>Canlı Doğrulama Raporu</span>
              </button>
            </div>
          </div>

          <!-- Top 5 Strategic KPI Metric Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <!-- KPI 1: Toplam Fason Alış -->
            <div class="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <span>TOPLAM FASON ALIŞ</span>
                  <span class="material-symbols-outlined text-purple-600 text-[18px]">styler</span>
                </div>
                <div class="font-mono text-lg font-extrabold text-slate-900">$24.032,80 USD</div>
                <div class="text-[11px] font-mono text-slate-600 mt-0.5">₺1.171.410,07 TL</div>
              </div>
              <div class="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                <span>3 Fatura (1.365 Adet)</span>
                <span class="text-purple-700 font-bold">KDV: $2.184,80</span>
              </div>
            </div>

            <!-- KPI 2: Kumaş Satış Mahsubu -->
            <div class="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <span>KUMAŞ SATIŞ MAHSUBU</span>
                  <span class="material-symbols-outlined text-blue-600 text-[18px]">inventory_2</span>
                </div>
                <div class="font-mono text-lg font-extrabold text-blue-700">$7.461,45 USD</div>
                <div class="text-[11px] font-mono text-slate-600 mt-0.5">₺364.045,00 TL</div>
              </div>
              <div class="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                <span>BR02026000000024</span>
                <span class="text-blue-700 font-bold">992,5 Kg Kumaş</span>
              </div>
            </div>

            <!-- KPI 3: Garanti BBVA Banka Ödemeleri -->
            <div class="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <span>GARANTİ BBVA ÖDEMELERİ</span>
                  <span class="material-symbols-outlined text-emerald-600 text-[18px]">account_balance</span>
                </div>
                <div class="font-mono text-lg font-extrabold text-emerald-700">$6.236,00 USD</div>
                <div class="text-[11px] font-mono text-slate-600 mt-0.5">₺298.471,00 TL</div>
              </div>
              <div class="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                <span>5 Adet Banka Havalesi</span>
                <span class="text-emerald-700 font-bold">100% Eşleşti ✓</span>
              </div>
            </div>

            <!-- KPI 4: Kalan Net Cari Borç -->
            <div class="bg-rose-50/50 rounded-xl p-3.5 border-2 border-rose-300 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-rose-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <span>NET KALAN CARİ BORÇ</span>
                  <span class="material-symbols-outlined text-rose-600 text-[18px]">price_change</span>
                </div>
                <div class="font-mono text-xl font-black text-rose-700">-$10.335,35 USD</div>
                <div class="text-[11px] font-mono text-rose-900 font-bold mt-0.5">-₺508.894,07 TL</div>
              </div>
              <div class="mt-2 pt-2 border-t border-rose-200 text-[10px] text-rose-800 flex justify-between font-bold">
                <span>Paraşüt &amp; Excel Birebir</span>
                <span>NSA-87 Açık Kalan</span>
              </div>
            </div>

            <!-- KPI 5: Ödenecek Net KDV -->
            <div class="bg-amber-50/60 rounded-xl p-3.5 border border-amber-300 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-amber-900 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <span>ÖDENECEK NET KDV (%10)</span>
                  <span class="material-symbols-outlined text-amber-700 text-[18px]">receipt</span>
                </div>
                <div class="font-mono text-lg font-extrabold text-amber-900">$1.230,49 USD</div>
                <div class="text-[11px] font-mono text-amber-800 font-bold mt-0.5">₺60.355,83 TL</div>
              </div>
              <div class="mt-2 pt-2 border-t border-amber-200 text-[10px] text-amber-900 flex justify-between">
                <span>Kumaş KDV Mahsubu Sonrası</span>
                <span class="font-bold">Net Ödenecek</span>
              </div>
            </div>
          </div>

          <!-- Mathematical Reconciliation Formula Banner -->
          <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-sm">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="space-y-1">
                <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">MATEMATİKSEL MUTABAKAT FORMÜLÜ (CARİ DENKLİK)</span>
                <div class="font-mono text-xs md:text-sm font-semibold text-slate-100 flex flex-wrap items-center gap-2">
                  <span class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Fason Faturaları: $24.032,80</span>
                  <span class="text-rose-400 font-bold">-</span>
                  <span class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Banka Havaleleri: $6.236,00</span>
                  <span class="text-rose-400 font-bold">-</span>
                  <span class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Kumaş Satış Mahsubu: $7.461,45</span>
                  <span class="text-emerald-400 font-bold">=</span>
                  <span class="bg-rose-950 text-rose-300 px-2.5 py-0.5 rounded border border-rose-700 font-bold font-mono">Net Kalan Borç: -$10.335,35 USD (₺508.894,07 TL)</span>
                </div>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-slate-400 block font-mono">Paraşüt Cari Kodu / ID</span>
                <span class="font-mono text-xs font-bold text-white">CR-TR-0004 • TCKN: 46849262292</span>
              </div>
            </div>
          </div>

          <!-- Workstation Grid: 2 Columns (Tables) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            <!-- Table 1: Fason Alış Faturaları (NSA-70, NSA-84, NSA-87) -->
            <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-xs text-slate-900">1. Faruk Aytin (Nisa Tekstil) Fason Alış Faturaları</h3>
                  <span class="text-[11px] text-slate-500">GİB e-Fatura / e-Arşiv Kayıtları</span>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">3 Fatura • $24.032,80</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr class="bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase border-b border-slate-200 font-sans">
                      <th class="py-2 px-3">Fatura No</th>
                      <th class="py-2 px-3">Tarih</th>
                      <th class="py-2 px-3">Sipariş / Açıklama</th>
                      <th class="py-2 px-3 text-right">Tutar (USD)</th>
                      <th class="py-2 px-3 text-right">Tutar (TL)</th>
                      <th class="py-2 px-3 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr class="hover:bg-slate-50">
                      <td class="py-2.5 px-3 font-bold text-slate-900">NSA2026000000070</td>
                      <td class="py-2.5 px-3 text-slate-600">30.07.2026</td>
                      <td class="py-2.5 px-3 font-sans text-slate-700">EMK Oversized Tişört (276 Adet)</td>
                      <td class="py-2.5 px-3 text-right font-bold text-slate-900">$3.036,00</td>
                      <td class="py-2.5 px-3 text-right text-slate-600">₺143.451,00</td>
                      <td class="py-2.5 px-3 text-center font-sans"><span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Ödendi ✓</span></td>
                    </tr>
                    <tr class="hover:bg-slate-50 bg-slate-50/50">
                      <td class="py-2.5 px-3 font-bold text-slate-900">NSA2026000000084</td>
                      <td class="py-2.5 px-3 text-slate-600">01.10.2026</td>
                      <td class="py-2.5 px-3 font-sans text-slate-700">Ben Ellis (140 T-shirt + 180 Hoodie)<br><span class="text-[10px] text-slate-500 font-mono">Fiş: 1044145905 • İrsaliye: 78</span></td>
                      <td class="py-2.5 px-3 text-right font-bold text-slate-900">$6.366,80</td>
                      <td class="py-2.5 px-3 text-right text-slate-600">₺311.529,43</td>
                      <td class="py-2.5 px-3 text-center font-sans"><span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Mahsup Kapandı ✓</span></td>
                    </tr>
                    <tr class="hover:bg-slate-50 bg-rose-50/20">
                      <td class="py-2.5 px-3 font-bold text-rose-800">NSA2026000000087</td>
                      <td class="py-2.5 px-3 text-slate-600">05.10.2026</td>
                      <td class="py-2.5 px-3 font-sans text-slate-700">Ben Ellis (375 T-shirt + 394 Hoodie)<br><span class="text-[10px] text-slate-500 font-mono">Fiş: 1044145920 • İrsaliye: 80</span></td>
                      <td class="py-2.5 px-3 text-right font-bold text-rose-700">$14.630,00</td>
                      <td class="py-2.5 px-3 text-right text-rose-700 font-bold">₺716.429,64</td>
                      <td class="py-2.5 px-3 text-center font-sans"><span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Açık Kalan Bakiye</span></td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colspan="3" class="py-2 px-3 font-sans text-slate-800">TOPLAM FASON ALIŞ:</td>
                      <td class="py-2 px-3 text-right text-slate-900">$24.032,80</td>
                      <td class="py-2 px-3 text-right text-slate-900">₺1.171.410,07</td>
                      <td class="py-2 px-3 text-center text-purple-700 font-sans text-[10px]">KDV: $2.184,80</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Table 2: Brosan Kumaş Satış & Mahsup Faturası (BR02026000000024) -->
            <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-xs text-slate-900">2. Brosan Kumaş Satış &amp; Mahsup Faturası</h3>
                  <span class="text-[11px] text-slate-500">BR02026000000024 (27.09.2026) • TCMB: 48,7901</span>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">992,5 Kg • $7.461,45 USD</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr class="bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase border-b border-slate-200 font-sans">
                      <th class="py-2 px-3">Kumaş Cinsi</th>
                      <th class="py-2 px-3 text-right">Miktar (Kg)</th>
                      <th class="py-2 px-3 text-right">B.Fiyat (₺)</th>
                      <th class="py-2 px-3 text-right">Tutar (₺)</th>
                      <th class="py-2 px-3 text-right">Tutar (USD)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr class="hover:bg-slate-50">
                      <td class="py-2 px-3 font-sans font-medium text-slate-800">B.KUMAŞ 30/2 PENYE SÜPREM</td>
                      <td class="py-2 px-3 text-right font-bold">227,0</td>
                      <td class="py-2 px-3 text-right text-slate-500">₺340,00</td>
                      <td class="py-2 px-3 text-right font-semibold text-slate-900">₺84.898,00</td>
                      <td class="py-2 px-3 text-right text-blue-700 font-bold">$1.740,07</td>
                    </tr>
                    <tr class="hover:bg-slate-50">
                      <td class="py-2 px-3 font-sans font-medium text-slate-800">B.KUMAŞ 30/2 COM. PENYE RİBANA</td>
                      <td class="py-2 px-3 text-right font-bold">14,5</td>
                      <td class="py-2 px-3 text-right text-slate-500">₺340,00</td>
                      <td class="py-2 px-3 text-right font-semibold text-slate-900">₺5.423,00</td>
                      <td class="py-2 px-3 text-right text-blue-700 font-bold">$111,15</td>
                    </tr>
                    <tr class="hover:bg-slate-50">
                      <td class="py-2 px-3 font-sans font-medium text-slate-800">B.KUMAŞ 30/20/10 PENYE 3 İPLİK</td>
                      <td class="py-2 px-3 text-right font-bold">650,0</td>
                      <td class="py-2 px-3 text-right text-slate-500">₺330,00</td>
                      <td class="py-2 px-3 text-right font-semibold text-slate-900">₺235.950,00</td>
                      <td class="py-2 px-3 text-right text-blue-700 font-bold">$4.836,02</td>
                    </tr>
                    <tr class="hover:bg-slate-50">
                      <td class="py-2 px-3 font-sans font-medium text-slate-800">B.KUMAŞ 30/2 PENYE 70 DNY KORSE</td>
                      <td class="py-2 px-3 text-right font-bold">101,0</td>
                      <td class="py-2 px-3 text-right text-slate-500">₺340,00</td>
                      <td class="py-2 px-3 text-right font-semibold text-slate-900">₺37.774,00</td>
                      <td class="py-2 px-3 text-right text-blue-700 font-bold">$774,21</td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td class="py-2 px-3 font-sans text-slate-800">TOPLAM MAHSUP (KDV Dahil):</td>
                      <td class="py-2 px-3 text-right font-bold text-slate-900">992,5 Kg</td>
                      <td class="py-2 px-3 text-right font-sans text-[10px] text-slate-500">Matrah: ₺330.950</td>
                      <td class="py-2 px-3 text-right text-blue-700">₺364.045,00</td>
                      <td class="py-2 px-3 text-right text-blue-700">$7.461,45</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Table 3: Garanti BBVA Banka Ödemeleri (5 Adet Havale) -->
            <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-xs text-slate-900">3. Garanti BBVA Banka Ödemeleri (Hesap: 417-6289477)</h3>
                  <span class="text-[11px] text-slate-500">TR16 0006 2000 4170 0006 2894 77</span>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">5 Havale • $6.236,00 USD</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr class="bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase border-b border-slate-200 font-sans">
                      <th class="py-2 px-3">Tarih</th>
                      <th class="py-2 px-3">Açıklama / Dekont</th>
                      <th class="py-2 px-3 text-right">Kur</th>
                      <th class="py-2 px-3 text-right">Tutar (TL)</th>
                      <th class="py-2 px-3 text-right">Tutar (USD)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr class="hover:bg-slate-50">
                      <td class="py-2 px-3 text-slate-600">31.07.2026</td>
                      <td class="py-2 px-3 font-sans text-slate-800">NSA-70 Fatura Ödemesi (Garanti Cep)</td>
                      <td class="py-2 px-3 text-right text-slate-500">47,25</td>
                      <td class="py-2 px-3 text-right font-bold text-slate-900">₺143.451,00</td>
                      <td class="py-2 px-3 text-right text-emerald-700 font-bold">$3.036,00</td>
                    </tr>
                    <tr class="hover:bg-slate-50">
                      <td class="py-2 px-3 text-slate-600">07.09.2026</td>
                      <td class="py-2 px-3 font-sans text-slate-800">Siparişe İstinaden Ön Ödeme (Avans)</td>
                      <td class="py-2 px-3 text-right text-slate-500">48,30</td>
                      <td class="py-2 px-3 text-right font-bold text-slate-900">₺96.600,00</td>
                      <td class="py-2 px-3 text-right text-emerald-700 font-bold">$2.000,00</td>
                    </tr>
                    <tr class="hover:bg-slate-50">
                      <td class="py-2 px-3 text-slate-600">14.09.2026</td>
                      <td class="py-2 px-3 font-sans text-slate-800">Cari Hesaba İstinaden Ön Ödeme (Avans)</td>
                      <td class="py-2 px-3 text-right text-slate-500">48,42</td>
                      <td class="py-2 px-3 text-right font-bold text-slate-900">₺48.420,00</td>
                      <td class="py-2 px-3 text-right text-emerald-700 font-bold">$1.000,00</td>
                    </tr>
                    <tr class="hover:bg-slate-50">
                      <td class="py-2 px-3 text-slate-600">22.09.2026</td>
                      <td class="py-2 px-3 font-sans text-slate-800">100 USD Karşılığı Cari Ödeme</td>
                      <td class="py-2 px-3 text-right text-slate-500">50,00</td>
                      <td class="py-2 px-3 text-right font-bold text-slate-900">₺5.000,00</td>
                      <td class="py-2 px-3 text-right text-emerald-700 font-bold">$100,00</td>
                    </tr>
                    <tr class="hover:bg-slate-50">
                      <td class="py-2 px-3 text-slate-600">30.09.2026</td>
                      <td class="py-2 px-3 font-sans text-slate-800">100 USD Karşılığı Cari Ödeme</td>
                      <td class="py-2 px-3 text-right text-slate-500">50,00</td>
                      <td class="py-2 px-3 text-right font-bold text-slate-900">₺5.000,00</td>
                      <td class="py-2 px-3 text-right text-emerald-700 font-bold">$100,00</td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colspan="3" class="py-2 px-3 font-sans text-slate-800">TOPLAM BANKA ÖDEMELERİ:</td>
                      <td class="py-2 px-3 text-right text-emerald-700">₺298.471,00</td>
                      <td class="py-2 px-3 text-right text-emerald-700">$6.236,00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Card 4: KDV Dağılımı & Kaşe İmza Onay Kartı -->
            <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-4">
              <div>
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 class="font-bold text-xs text-slate-900">4. KDV Dağılımı ve Net KDV Mutabakatı</h3>
                  <span class="text-[10px] text-amber-700 font-bold font-mono">VUK 396 Tebliği</span>
                </div>
                <div class="space-y-2 mt-3 text-xs">
                  <div class="flex justify-between py-1 border-b border-slate-100">
                    <span class="text-slate-600 font-sans">Toplam Fason Alış KDV'si (%10):</span>
                    <span class="font-mono font-bold text-slate-900">$2.184,80 USD <span class="text-slate-500 font-normal">(₺106.491,83)</span></span>
                  </div>
                  <div class="flex justify-between py-1 border-b border-slate-100">
                    <span class="text-slate-600 font-sans">Ödenmiş KDV (30.07.2026 NSA-70):</span>
                    <span class="font-mono font-bold text-emerald-700">-$276,00 USD <span class="text-slate-500 font-normal">(-₺13.041,00)</span></span>
                  </div>
                  <div class="flex justify-between py-1 border-b border-slate-100">
                    <span class="text-slate-600 font-sans">Kumaş Satış Faturası KDV Mahsubu:</span>
                    <span class="font-mono font-bold text-blue-700">-$678,31 USD <span class="text-slate-500 font-normal">(-₺33.095,00)</span></span>
                  </div>
                  <div class="flex justify-between py-1.5 bg-amber-50 px-2 rounded font-bold text-amber-900">
                    <span class="font-sans">FARUK AYTİN'E ÖDENECEK NET KDV:</span>
                    <span class="font-mono">$1.230,49 USD (₺60.355,83 TL)</span>
                  </div>
                </div>
              </div>

              <!-- Kaşe / İmza Mutabakat Onay Rozeti -->
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-[11px] font-bold text-slate-800 mb-1">✍️ Resmi Cari Mutabakat Onayı</div>
                <p class="text-[11px] text-slate-600 mb-2">İşbu cari hesap mutabakatı 06.10.2026 tarihi itibariyle net <strong>-$10.335,35 USD (₺508.894,07 TL)</strong> cari borç bakiyesi ve <strong>$1.230,49 USD</strong> ödenecek net KDV tutarı üzerinden çift taraflı olarak teyit edilmiş ve Paraşüt muhasebe kayıtlarıyla tam mutabık kalınmıştır.</p>
                <div class="grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-slate-700 pt-2 border-t border-slate-200">
                  <div class="p-1.5 bg-white border border-slate-200 rounded">
                    <span>BROSAN TEKSTİL LTD. ŞTİ.</span><br>
                    <span class="text-emerald-700 text-[9px]">✓ ONAYLANDI</span>
                  </div>
                  <div class="p-1.5 bg-white border border-slate-200 rounded">
                    <span>FARUK AYTİN (NİSA TEKSTİL)</span><br>
                    <span class="text-emerald-700 text-[9px]">✓ MUTABIK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>"""

if old_view_mutabakat in content:
    content = content.replace(old_view_mutabakat, new_view_mutabakat)
    print("✓ Replaced view-mutabakat with rich workstation")
else:
    print("! view-mutabakat not found directly")

# Save script
with open("build_ultimate_enterprise_erp.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Stage 1 update applied.")
