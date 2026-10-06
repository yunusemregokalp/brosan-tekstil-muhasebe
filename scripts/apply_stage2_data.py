import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

with open("build_ultimate_enterprise_erp.py", "r", encoding="utf-8") as f:
    code = f.read()

print("Current length:", len(code))

# 1. NEW DASHBOARD HERO SECTION WITH HERO BANNER
old_hero_section = """          <!-- TOP 4 HERO KPI CARDS -->
          <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Card 1: Banka & Kasa Likiditesi -->
            <div class="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-slate-500 text-[11px] font-bold uppercase tracking-wider">KASA &amp; BANKA LİKİDİTESİ</span>
                  <span class="material-symbols-outlined text-emerald-600 text-[20px]">account_balance_wallet</span>
                </div>
                <div class="flex items-baseline gap-2">
                  <span id="hero-kpi-bank-gbp" class="font-mono text-xl font-bold text-slate-900">£48.250</span>
                  <span class="text-slate-400 font-mono text-sm">+</span>
                  <span id="hero-kpi-bank-try" class="font-mono text-xl font-bold text-slate-900">₺845.200</span>
                </div>
                <div class="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
                  <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">GBP £48.250</span>
                  <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">USD $32.400</span>
                  <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">EUR €14.800</span>
                  <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">TRY ₺845.200</span>
                </div>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="text-emerald-700 font-medium flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Garanti BBVA API: Canlı
                </span>
                <button onclick="switchView('banking')" class="text-slate-500 hover:text-slate-800 font-medium hover:underline">Akbank Entegre</button>
              </div>
            </div>

            <!-- Card 2: Cari Alacaklar & Çek Portföyü -->
            <div class="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-slate-500 text-[11px] font-bold uppercase tracking-wider">CARİ ALACAK &amp; ÇEK PORTFÖYÜ</span>
                  <span class="material-symbols-outlined text-blue-600 text-[20px]">assignment_turned_in</span>
                </div>
                <div class="flex items-baseline gap-2">
                  <span id="hero-kpi-receivable-gbp" class="font-mono text-xl font-bold text-slate-900">£12.139,22</span>
                  <span class="text-slate-400 font-mono text-sm">+</span>
                  <span class="font-mono text-xl font-bold text-slate-900">₺420.000</span>
                </div>
                <p id="hero-kpi-receivable-sub" class="text-xs text-slate-500 mt-1.5">
                  1 ETGB Dosyası (Ben Ellis) + 4 Adet Çek
                </p>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold font-mono">Ort. Vade: 28 Gün</span>
                <span class="text-slate-500 font-medium font-mono">%98 Düzenli</span>
              </div>
            </div>

            <!-- Card 3: Tedarikçi Borçları & SGK/Vergi -->
            <div class="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-slate-500 text-[11px] font-bold uppercase tracking-wider">TEDARİKÇİ BORÇ &amp; SGK / KDV</span>
                  <span class="material-symbols-outlined text-slate-600 text-[20px]">receipt_long</span>
                </div>
                <div id="hero-kpi-debt-try" class="font-mono text-xl font-bold text-slate-900">
                  ₺342.180,00
                </div>
                <p class="text-xs text-slate-500 mt-1.5">
                  Birlik Kumaş, Çetin Boya • ₺141.250 SGK/KDV
                </p>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold font-mono">3 Fatura Bu Hafta</span>
                <span class="text-slate-500 font-mono">26 Ekim Vade</span>
              </div>
            </div>

            <!-- Card 4: TCMB İBKB & KDV İadesi 301 -->
            <div class="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl p-4 border border-amber-200/80 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-amber-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">schedule</span>
                    TCMB İBKB &amp; KDV 301
                  </span>
                  <span id="hero-ibkb-badge" class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900 font-mono">
                    12 GÜN KALDI
                  </span>
                </div>
                <div id="hero-ibkb-title" class="font-display text-lg font-bold text-slate-900">
                  1 Açık ETGB Bekliyor
                </div>
                <p id="hero-ibkb-sub" class="text-xs text-amber-900 mb-2">
                  Ben Ellis • ₺142.800 İhracat KDV İadesi
                </p>
              </div>
              <div class="pt-2 border-t border-amber-200 flex items-center justify-between">
                <span class="text-[11px] text-amber-800 font-medium">180 Gün Yasal Süre</span>
                <button onclick="openModal('modal-dab-calculator')" class="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline">
                  Bozum Masası &amp; DAB →
                </button>
              </div>
            </div>
          </section>"""

new_hero_section = """          <!-- TOP 4 HERO KPI CARDS -->
          <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Card 1: Banka & Kasa Likiditesi (Garanti BBVA Canlı) -->
            <div class="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-slate-500 text-[11px] font-bold uppercase tracking-wider">GARANTİ BBVA BANKA LİKİDİTESİ</span>
                  <span class="material-symbols-outlined text-emerald-600 text-[20px]">account_balance_wallet</span>
                </div>
                <div class="flex items-baseline gap-2">
                  <span id="hero-kpi-bank-gbp" class="font-mono text-xl font-bold text-slate-900">£23.759,07</span>
                  <span class="text-slate-400 font-mono text-sm">+</span>
                  <span id="hero-kpi-bank-try" class="font-mono text-xl font-bold text-slate-900">₺15.732,92</span>
                </div>
                <div class="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
                  <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">GBP £23.759</span>
                  <span class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold">EUR €11.792</span>
                  <span class="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 font-bold">USD $1.521</span>
                  <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">Lojistik: ₺17.211</span>
                </div>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="text-emerald-700 font-medium flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Garanti BBVA: 5 Hesap Canlı
                </span>
                <button onclick="switchView('banking')" class="text-slate-500 hover:text-slate-800 font-medium hover:underline">Detay Gör →</button>
              </div>
            </div>

            <!-- Card 2: Cari Alacaklar (Ben Ellis & İhracat) -->
            <div class="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-slate-500 text-[11px] font-bold uppercase tracking-wider">CARİ ALACAKLAR (İHRACAT)</span>
                  <span class="material-symbols-outlined text-blue-600 text-[20px]">assignment_turned_in</span>
                </div>
                <div class="flex items-baseline gap-2">
                  <span id="hero-kpi-receivable-gbp" class="font-mono text-xl font-bold text-blue-700">£22.414,22</span>
                  <span class="text-slate-400 font-mono text-sm">+</span>
                  <span class="font-mono text-xl font-bold text-slate-900">₺1.343.608</span>
                </div>
                <p id="hero-kpi-receivable-sub" class="text-xs text-slate-500 mt-1.5">
                  Ben Ellis (Bristol UK: £22.414,22 = ₺1.452.246) • Lavi La LLC • GbR Celik
                </p>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold font-mono">Toplam: ₺2.795.854 TL</span>
                <span class="text-emerald-700 font-medium font-mono">VIP İhracat</span>
              </div>
            </div>

            <!-- Card 3: Tedarikçi Borçları & Faruk Aytin -->
            <div class="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-slate-500 text-[11px] font-bold uppercase tracking-wider">TEDARİKÇİ BORÇLARI</span>
                  <span class="material-symbols-outlined text-rose-600 text-[20px]">receipt_long</span>
                </div>
                <div id="hero-kpi-debt-try" class="font-mono text-xl font-bold text-rose-700">
                  ₺1.969.839,26
                </div>
                <p class="text-xs text-slate-500 mt-1.5">
                  Tinteks: ₺1.099.047 • Faruk Aytin: -$10.335 USD (₺508.894) • Çetin Türedi: ₺200.000
                </p>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-semibold font-mono">Faruk Aytin: -$10.335 $</span>
                <button onclick="switchView('mutabakat')" class="text-amber-800 font-bold hover:underline">Mahsup Masası →</button>
              </div>
            </div>

            <!-- Card 4: TCMB İBKB & KDV İadesi 301 -->
            <div class="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl p-4 border border-amber-200/80 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-amber-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">schedule</span>
                    TCMB İBKB &amp; KDV 301
                  </span>
                  <span id="hero-ibkb-badge" class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900 font-mono">
                    12 GÜN KALDI
                  </span>
                </div>
                <div id="hero-ibkb-title" class="font-display text-lg font-bold text-slate-900">
                  Ben Ellis e-İhracat
                </div>
                <p id="hero-ibkb-sub" class="text-xs text-amber-900 mb-2">
                  BS02026000000013 (£7.388,10) • %40 Bozum Masası
                </p>
              </div>
              <div class="pt-2 border-t border-amber-200 flex items-center justify-between">
                <span class="text-[11px] text-amber-800 font-medium">180 Gün Yasal Süre</span>
                <button onclick="openModal('modal-dab-calculator')" class="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline">
                  Bozum Masası &amp; DAB →
                </button>
              </div>
            </div>
          </section>

          <!-- FARUK AYTİN & NİSA TEKSTİL FASON VE KUMAŞ MAHSUBU KOKPİT ÖZET BANNERI -->
          <div class="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white rounded-xl p-4 border border-amber-500/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider font-mono">FASON &amp; KUMAŞ MAHSUBU</span>
                <span class="text-xs font-bold text-slate-200">Faruk Aytin (Nisa Tekstil) Canlı Mutabakat Durumu</span>
                <span class="px-2 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-mono font-bold">%100 Eşleşti ✓</span>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-mono">
                <span>Fason Alış: <strong class="text-white">$24.032,80 USD</strong> (₺1.171.410,07)</span>
                <span>•</span>
                <span>Kumaş Mahsubu: <strong class="text-blue-300">$7.461,45 USD</strong> (₺364.045,00)</span>
                <span>•</span>
                <span>Garanti Ödeme: <strong class="text-emerald-300">$6.236,00 USD</strong> (₺298.471,00)</span>
                <span>•</span>
                <span>Ödenecek Net KDV: <strong class="text-amber-300">$1.230,49 USD</strong> (₺60.355,83)</span>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-right">
                <span class="text-[10px] text-rose-300 font-bold block uppercase tracking-wider">NET KALAN BORÇ BAKİYESİ:</span>
                <span class="font-mono text-xl font-black text-rose-400">-$10.335,35 USD</span>
                <span class="text-[11px] font-mono text-slate-400 block">-₺508.894,07 TL</span>
              </div>
              <button onclick="switchView('mutabakat')" class="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors whitespace-nowrap">
                <span>Mutabakat Masası</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>"""

if old_hero_section in code:
    code = code.replace(old_hero_section, new_hero_section)
    print("✓ Replaced dashboard hero section and added Faruk Aytin hero banner")
else:
    print("! old_hero_section not matched directly")

# 2. UPDATE VIEW-BANKING CARDS
old_banking_cards = """          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-xs relative">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">GB</div>
                  <div>
                    <h3 class="font-bold text-xs text-slate-900">Garanti BBVA - GBP İhracat</h3>
                    <span class="text-[10px] text-slate-500">Bahçeşehir Şubesi</span>
                  </div>
                </div>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div id="bank-card-gbp" class="font-mono text-xl font-bold text-slate-900 mt-2">£48.250,00</div>
              <div class="text-[11px] text-slate-500 font-mono mt-1">IBAN: TR32 0006 2000 1827 0009 2381 01</div>
            </div>
            <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-xs relative">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">TL</div>
                  <div>
                    <h3 class="font-bold text-xs text-slate-900">Garanti BBVA - TRY Ticari</h3>
                    <span class="text-[10px] text-slate-500">Bahçeşehir Şubesi</span>
                  </div>
                </div>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div id="bank-card-try" class="font-mono text-xl font-bold text-slate-900 mt-2">₺845.200,00</div>
              <div class="text-[11px] text-slate-500 font-mono mt-1">IBAN: TR45 0006 2000 1827 0009 2381 02</div>
            </div>
            <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-xs relative">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs">$€</div>
                  <div>
                    <h3 class="font-bold text-xs text-slate-900">USD &amp; EUR Döviz Tevdiat</h3>
                    <span class="text-[10px] text-slate-500">Garanti + Akbank</span>
                  </div>
                </div>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div class="font-mono text-sm font-bold text-slate-900 mt-2 space-y-1">
                <div>USD: $32.400,00 • EUR: €14.800,00</div>
                <div class="text-slate-600 text-xs font-normal">Nakit Kasası: ₺45.000,00</div>
              </div>
            </div>
          </div>"""

new_banking_cards = """          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- 1. Garanti GBP -->
            <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-xs relative">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">GBP</div>
                  <div>
                    <h3 class="font-bold text-xs text-slate-900">Garanti BBVA GBP İhracat</h3>
                    <span class="text-[10px] text-slate-500">Hesap: 417-9034578</span>
                  </div>
                </div>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div class="font-mono text-xl font-bold text-slate-900 mt-2">£23.759,07</div>
              <div class="text-[10px] text-slate-500 font-mono mt-1 truncate">TR86 0006 2000 4170 0009 0345 78</div>
            </div>

            <!-- 2. Garanti TRY Ana Hesap -->
            <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-xs relative">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">TL</div>
                  <div>
                    <h3 class="font-bold text-xs text-slate-900">Garanti BBVA TL Ana Hesap</h3>
                    <span class="text-[10px] text-slate-500">Hesap: 417-6289477</span>
                  </div>
                </div>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div class="font-mono text-xl font-bold text-slate-900 mt-2">₺15.732,92</div>
              <div class="text-[10px] text-slate-500 font-mono mt-1 truncate">TR16 0006 2000 4170 0006 2894 77</div>
            </div>

            <!-- 3. Garanti TRY Lojistik -->
            <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-xs relative">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">LOJ</div>
                  <div>
                    <h3 class="font-bold text-xs text-slate-900">Garanti BBVA Lojistik TL</h3>
                    <span class="text-[10px] text-slate-500">Hesap: 417-6287865</span>
                  </div>
                </div>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div class="font-mono text-xl font-bold text-slate-900 mt-2">₺17.210,75</div>
              <div class="text-[10px] text-slate-500 font-mono mt-1 truncate">TR84 0006 2000 4170 0006 2878 65</div>
            </div>

            <!-- 4. Garanti EUR & USD + Kasa -->
            <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-xs relative">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs">$€</div>
                  <div>
                    <h3 class="font-bold text-xs text-slate-900">EUR &amp; USD Döviz Tevdiat</h3>
                    <span class="text-[10px] text-slate-500">Garanti 417-9034579/80</span>
                  </div>
                </div>
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div class="font-mono text-sm font-bold text-slate-900 mt-2 space-y-0.5">
                <div>EUR: €11.792,36 • USD: $1.521,16</div>
                <div class="text-rose-700 text-xs font-semibold">Yunus Cep KK: -₺248.697 • Kasa: -₺722</div>
              </div>
            </div>
          </div>"""

if old_banking_cards in code:
    code = code.replace(old_banking_cards, new_banking_cards)
    print("✓ Replaced banking cards with authentic Garanti BBVA accounts")
else:
    print("! old_banking_cards not matched directly")

# Save script
with open("build_ultimate_enterprise_erp.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Stage 2 updates applied.")
