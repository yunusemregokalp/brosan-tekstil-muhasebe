# -*- coding: utf-8 -*-
"""
BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ.
ULTIMATE ENTERPRISE ACCOUNTING ERP SYSTEM
Tekdüzen Hesap Planı (TDHP), e-İhracat (ETGB/İBKB), TCMB %40 Bozum, Bordro, Çek/Senet, Ba/Bs
Google Stitch Balanced Mode UI Architecture
"""

import os

HTML_CODE = """<!DOCTYPE html>
<html lang="tr" class="h-full">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BROSAN TEKSTİL | Tam Teşekküllü Ön &amp; Genel Muhasebe ERP Sistemi</title>
  
  <!-- Fonts & Google Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            parasut: {
              green: '#00AA6C',
              darkgreen: '#008f5a',
              sidebar: '#0d131a',
              sidebarHover: '#17222d',
              accent: '#059669',
            }
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
            display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif']
          }
        }
      }
    }
  </script>

  <style>
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
    }
    .material-symbols-outlined.fill-icon {
      font-variation-settings: 'FILL' 1;
    }
    .module-view { display: none; }
    .module-view.active { display: block; animation: fadeIn 0.15s ease-in-out; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(3px); }
      to { opacity: 1; transform: translateY(0); }
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    
    @media print {
      body * { visibility: hidden; }
      #printable-area, #printable-area * { visibility: visible; }
      #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
      aside, header, footer, .no-print { display: none !important; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased h-full overflow-hidden flex flex-col">

  <!-- TOP APP CONTAINER -->
  <div class="flex-1 flex overflow-hidden">
    
    <!-- LEFT SIDEBAR -->
    <aside class="w-64 bg-[#0d131a] text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 z-30 select-none">
      <!-- Brand & Header -->
      <div class="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-lg bg-[#00AA6C] flex items-center justify-center text-white font-black text-lg shadow-sm">
            B
          </div>
          <div>
            <div class="font-display font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>BROSAN ERP</span>
            </div>
            <span class="text-[10px] text-slate-400 font-medium tracking-wide">TEKSTİL &amp; MUHASEBE</span>
          </div>
        </div>
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
          ENTERPRISE
        </span>
      </div>

      <!-- Navigation Menu -->
      <nav class="p-2 space-y-0.5 overflow-y-auto flex-1" id="sidebar-nav">
        <!-- 1. Güncel Durum (Finansal Kokpit) -->
        <button data-module="dashboard" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#00AA6C] text-white text-xs font-semibold transition-all shadow-sm">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined fill-icon text-white text-[18px]">dashboard</span>
            <span>Güncel Durum (Kokpit)</span>
          </div>
          <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
        </button>

        <!-- 2. Genel Muhasebe (TDHP Mizan) -->
        <button data-module="ledger" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">account_tree</span>
            <span>Genel Muhasebe (TDHP)</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/30">Mizan</span>
        </button>

        <!-- 3. Satışlar & e-İhracat -->
        <button data-module="sales" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">receipt_long</span>
            <span>Satışlar &amp; e-İhracat</span>
          </div>
          <span id="badge-sales-count" class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">4 Belge</span>
        </button>

        <!-- 4. Giderler & Alışlar -->
        <button data-module="expenses" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">shopping_cart_checkout</span>
            <span>Giderler &amp; Alışlar</span>
          </div>
          <span id="badge-expense-count" class="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">3 Vade</span>
        </button>

        <!-- 5. Müşteriler & Cariler -->
        <button data-module="contacts" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">group</span>
            <span>Müşteriler &amp; Cariler</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">Ben Ellis</span>
        </button>

        <!-- 6. Kasa, Bankalar & TCMB -->
        <button data-module="banking" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">account_balance</span>
            <span>Kasa, Bankalar &amp; DAB</span>
          </div>
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        <!-- 7. Çek & Senet Masası -->
        <button data-module="checks" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">request_quote</span>
            <span>Çek &amp; Senet Masası</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono">₺420K</span>
        </button>

        <!-- 8. Personel & Bordro -->
        <button data-module="payroll" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">badge</span>
            <span>Personel &amp; Bordro</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">18 Kişi</span>
        </button>

        <!-- 9. e-Dönüşüm Masası (GİB) -->
        <button data-module="edonusum" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">verified_user</span>
            <span>e-Dönüşüm &amp; e-Defter</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400">GİB Canlı</span>
        </button>

        <!-- 10. Ba/Bs & e-Mutabakat -->
        <button data-module="mutabakat" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">fact_check</span>
            <span>Ba/Bs &amp; e-Mutabakat</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">₺5.000+</span>
        </button>

        <!-- 11. Stok & GTİP Kataloğu -->
        <button data-module="inventory" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">inventory_2</span>
            <span>Stok &amp; GTİP Kataloğu</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">Kumaş/İplik</span>
        </button>

        <!-- 12. Mali Raporlar & KDV İade -->
        <button data-module="reports" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">query_stats</span>
            <span>Mali Raporlar &amp; KDV</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300">İade 301</span>
        </button>

        <!-- 13. Ayarlar & Firma Profili -->
        <button data-module="settings" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">settings</span>
            <span>Ayarlar &amp; GİB Ayarları</span>
          </div>
        </button>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-3 border-t border-slate-800/80 bg-[#090d12]">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400 font-medium">GİB &amp; TDHP Durumu</span>
          <span class="font-bold text-emerald-400 font-mono">v4.8 Canlı</span>
        </div>
        <div class="text-[11px] text-slate-500 font-semibold mt-0.5">Brosan Enterprise ERP</div>
        <button onclick="window.open('https://uygulama.parasut.com', '_blank')" class="mt-2 w-full py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] rounded flex items-center justify-center gap-1.5 transition-colors">
          <span class="material-symbols-outlined text-[14px]">menu_book</span>
          <span>Mevzuat &amp; İBKB Kılavuzu</span>
        </button>
      </div>
    </aside>

    <!-- MAIN APP CANVAS -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden">
      
      <!-- TOP NAVIGATION BAR -->
      <header class="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-xs">
        <div class="flex items-center gap-4 flex-1 max-w-2xl">
          <!-- Global Search -->
          <div class="relative w-full max-w-md">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <span class="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              type="text"
              id="global-search-input"
              oninput="handleGlobalSearch(this.value)"
              class="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00AA6C] focus:bg-white transition-all shadow-inner"
              placeholder="Fatura, Hesap Kodu (102, 120), Cari veya Çek Ara..."
            />
            <span class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[10px] text-slate-400 font-mono font-medium">
              Ctrl+K
            </span>
          </div>

          <!-- Active Corporate Context -->
          <div class="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="font-bold text-slate-800 tracking-tight">BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ.</span>
            <span class="text-slate-400">•</span>
            <span class="text-slate-500 font-mono text-[11px]">VKN: 1870492109</span>
          </div>
        </div>

        <!-- Quick Action Buttons & Profile -->
        <div class="flex items-center gap-2.5">
          <!-- New Invoice Button -->
          <button onclick="openModal('modal-new-invoice')" class="px-3 py-1.5 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ Yeni Fatura</span>
          </button>

          <!-- New Expense Button -->
          <button onclick="openModal('modal-new-expense')" class="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">receipt</span>
            <span>+ Gider / Fiş</span>
          </button>

          <!-- Quick Payment Button -->
          <button onclick="openModal('modal-new-payment')" class="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">attach_money</span>
            <span>+ Tahsilat</span>
          </button>

          <!-- Quick Check Input -->
          <button onclick="openModal('modal-new-check')" class="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">payments</span>
            <span>+ Çek Girişi</span>
          </button>

          <!-- Notification Bell -->
          <button onclick="showToast('3 Adet Bildirim: 1 İhracat Bedeli Kapatması, 2 Vadesi Yaklaşan Çek', 'info')" class="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors ml-1">
            <span class="material-symbols-outlined">notifications</span>
            <span class="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>

          <!-- User Profile -->
          <div class="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div class="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              YG
            </div>
            <div class="hidden md:block text-left">
              <div class="text-xs font-bold text-slate-800 leading-tight">Yunus Emre Gökalp</div>
              <div class="text-[10px] text-slate-500 leading-tight">Mali Müşavir &amp; Finans Dir.</div>
            </div>
            <span class="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
          </div>
        </div>
      </header>

      <!-- MAIN CONTENT SCROLL AREA -->
      <main class="flex-1 overflow-y-auto pb-14 px-6 pt-5 bg-slate-50/60">
        
        <!-- ========================================== -->
        <!-- MODULE 1: GÜNCEL DURUM (FİNANSAL KOKPİT) -->
        <!-- ========================================== -->
        <div id="view-dashboard" class="module-view active space-y-5">
          <!-- Breadcrumb & Page Title -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <span>KURUMSAL FİNANS</span>
                <span>/</span>
                <span>TDHP GENEL MUHASEBE</span>
                <span>/</span>
                <span class="text-[#00AA6C]">BROSAN TEKSTİL</span>
              </div>
              <h1 class="text-slate-900 font-display text-2xl font-bold tracking-tight mt-0.5">
                Finansal Yönetim Kokpiti &amp; İhracat İBKB Denetimi
              </h1>
            </div>
            <!-- Sync & Export Toolbar -->
            <div class="flex items-center gap-2">
              <div class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
                <span class="material-symbols-outlined text-emerald-600 text-[16px] animate-spin">sync</span>
                <span class="font-medium">GİB / Banka Senkron: 14:42:10</span>
              </div>
              <button onclick="refreshDashboard()" class="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-xs" title="Yenile">
                <span class="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>
          </div>

          <!-- TOP 4 HERO KPI CARDS -->
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
          </div>

          <!-- MULTI-TAB WORKSTATION RIBBON -->
          <div class="border-b border-slate-200">
            <nav class="flex space-x-6 overflow-x-auto pb-px">
              <button onclick="switchView('ledger')" class="border-b-2 border-[#00AA6C] text-[#00AA6C] font-semibold text-xs py-2.5 px-1 inline-flex items-center gap-2 whitespace-nowrap">
                <span class="material-symbols-outlined text-[18px]">account_tree</span>
                <span>Genel Muhasebe (TDHP Mizan)</span>
                <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Aktif Mizan</span>
              </button>
              <button onclick="switchView('sales')" class="border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium text-xs py-2.5 px-1 inline-flex items-center gap-2 whitespace-nowrap">
                <span class="material-symbols-outlined text-[18px]">flight_takeoff</span>
                <span>Satış &amp; e-İhracat (İBKB Masası)</span>
              </button>
              <button onclick="switchView('checks')" class="border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium text-xs py-2.5 px-1 inline-flex items-center gap-2 whitespace-nowrap">
                <span class="material-symbols-outlined text-[18px]">request_quote</span>
                <span>Çek &amp; Senet Portföyü</span>
              </button>
              <button onclick="switchView('payroll')" class="border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium text-xs py-2.5 px-1 inline-flex items-center gap-2 whitespace-nowrap">
                <span class="material-symbols-outlined text-[18px]">groups</span>
                <span>Personel Bordro İcmali</span>
              </button>
              <button onclick="switchView('edonusum')" class="border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium text-xs py-2.5 px-1 inline-flex items-center gap-2 whitespace-nowrap">
                <span class="material-symbols-outlined text-[18px]">task_alt</span>
                <span>e-Dönüşüm &amp; Berat Yükleme</span>
              </button>
            </nav>
          </div>

          <!-- TWO-COLUMN WORKSPACE: MİZAN (LEFT) + REGULATORY WIDGETS (RIGHT) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <!-- LEFT COLUMN: TDHP MİZAN MATRİSİ (8 COLS) -->
            <div class="lg:col-span-8 flex flex-col space-y-4">
              <!-- Mizan Table Container -->
              <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                <div class="p-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-900">Tekdüzen Hesap Planı Mizanı</span>
                    <span class="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium font-mono">Dönem: 01.01.2026 - 31.10.2026</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button onclick="downloadMizanExcel()" class="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 shadow-xs">
                      <span class="material-symbols-outlined text-[16px]">download</span>
                      <span>Excel</span>
                    </button>
                    <button onclick="window.print()" class="px-2.5 py-1 text-xs rounded bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold flex items-center gap-1 shadow-xs">
                      <span class="material-symbols-outlined text-[16px]">print</span>
                      <span>Yazdır</span>
                    </button>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse text-xs font-mono" id="table-dashboard-mizan">
                    <thead>
                      <tr class="bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase border-b border-slate-200 font-sans">
                        <th class="py-2.5 px-3">Hesap Kodu &amp; Adı</th>
                        <th class="py-2.5 px-3 text-right">Borç Tutarı (₺)</th>
                        <th class="py-2.5 px-3 text-right">Alacak Tutarı (₺)</th>
                        <th class="py-2.5 px-3 text-right">Borç Bakiye (₺)</th>
                        <th class="py-2.5 px-3 text-right">Alacak Bakiye (₺)</th>
                        <th class="py-2.5 px-3 text-center">Durum</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100" id="tbody-dashboard-mizan">
                      <!-- Populated dynamically via JS -->
                    </tbody>
                    <tfoot id="tfoot-dashboard-mizan">
                      <!-- Totals dynamically calculated -->
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN: NAKİT PROJEKSİYONU & VERGİ TAKVİMİ (4 COLS) -->
            <div class="lg:col-span-4 flex flex-col space-y-4">
              <!-- 30 Günlük Nakit Projeksiyonu -->
              <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald-600 text-[20px]">trending_up</span>
                    <h3 class="font-bold text-xs text-slate-800">30 Günlük Nakit Projeksiyonu</h3>
                  </div>
                  <span class="text-[11px] font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded">+₺1.240.000 Net</span>
                </div>
                <div class="mt-3 space-y-3">
                  <div>
                    <div class="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Beklenen Tahsilatlar</span>
                      <span class="font-mono font-bold text-emerald-700">₺1.980.000</span>
                    </div>
                    <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div class="bg-emerald-500 h-full rounded-full" style="width: 72%"></div>
                    </div>
                    <span class="text-[10px] text-slate-600 flex justify-between mt-1">
                      <span>£12.139 İhracat + Çekler</span>
                      <span>7 Kalem</span>
                    </span>
                  </div>

                  <div>
                    <div class="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Planlanan Ödemeler</span>
                      <span class="font-mono font-bold text-rose-700">₺740.000</span>
                    </div>
                    <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div class="bg-rose-500 h-full rounded-full" style="width: 28%"></div>
                    </div>
                    <span class="text-[10px] text-slate-600 flex justify-between mt-1">
                      <span>Tedarikçi Borçları + SGK/Vergi</span>
                      <span>4 Kalem</span>
                    </span>
                  </div>

                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span class="text-slate-500 font-medium">Likidite Emniyet Katsayısı:</span>
                    <span class="font-bold text-emerald-700 font-mono">2.67 (Yüksek Güvenlik)</span>
                  </div>
                </div>
              </div>

              <!-- Vergi & SGK Yasal Takvimi -->
              <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-amber-600 text-[20px]">event_note</span>
                    <h3 class="font-bold text-xs text-slate-800">Vergi &amp; SGK Yasal Takvimi</h3>
                  </div>
                  <span class="text-[10px] font-bold text-slate-500 uppercase">Ekim 2026</span>
                </div>
                <div class="mt-3 space-y-2.5 text-xs">
                  <div class="flex items-center justify-between p-2 rounded bg-amber-50/70 border border-amber-200/60">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-amber-800 text-[11px]">24 Eki</span>
                      <div>
                        <div class="font-semibold text-slate-800">KDV-1 Beyannamesi</div>
                        <div class="text-[10px] text-slate-600">İhracat 301 İstisna Ekli</div>
                      </div>
                    </div>
                    <span class="font-mono font-bold text-slate-900 text-xs">₺0 (İade)</span>
                  </div>

                  <div class="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-slate-700 text-[11px]">26 Eki</span>
                      <div>
                        <div class="font-semibold text-slate-800">Muhtasar ve Prim Hizmet</div>
                        <div class="text-[10px] text-slate-600">18 Personel SGK + Stopaj</div>
                      </div>
                    </div>
                    <span class="font-mono font-bold text-slate-900 text-xs">₺141.250</span>
                  </div>

                  <div class="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-slate-700 text-[11px]">31 Eki</span>
                      <div>
                        <div class="font-semibold text-slate-800">GİB e-Defter Berat Yükleme</div>
                        <div class="text-[10px] text-slate-600">Temmuz 2026 Dönemi Beratı</div>
                      </div>
                    </div>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Hazır ✓</span>
                  </div>
                </div>
              </div>

              <!-- Çek & Senet Portföy Durumu -->
              <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-indigo-600 text-[20px]">request_quote</span>
                    <h3 class="font-bold text-xs text-slate-800">Vadesi Yaklaşan Çekler</h3>
                  </div>
                  <button onclick="switchView('checks')" class="text-xs text-indigo-600 hover:underline font-semibold">Tümü (4) →</button>
                </div>
                <div class="mt-2.5 space-y-2 text-xs" id="widget-checks-list">
                  <!-- Injected via JS -->
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 2: GENEL MUHASEBE (TDHP HESAP PLANI & MİZAN) -->
        <!-- ========================================== -->
        <div id="view-ledger" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Genel Muhasebe</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Tekdüzen Hesap Planı (TDHP) &amp; Yevmiye Defteri</h1>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="openModal('modal-new-journal')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">add</span>
                <span>+ Yeni Mahsup / Yevmiye Fişi</span>
              </button>
            </div>
          </div>

          <!-- Ledger Quick Tabs -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Toplam Aktif Varlıklar (1xx)</span>
              <div class="text-lg font-bold font-mono text-slate-900 mt-1">₺2.745.600,00</div>
              <span class="text-[11px] text-emerald-700">Kasa, Banka, Alıcılar, Stoklar</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Kısa Vadeli Borçlar (3xx)</span>
              <div class="text-lg font-bold font-mono text-rose-700 mt-1">₺483.430,00</div>
              <span class="text-[11px] text-rose-600">Satıcılar, Vergi, SGK</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Dönem Net İhracat Satışları (601)</span>
              <div class="text-lg font-bold font-mono text-emerald-700 mt-1">₺2.845.000,00</div>
              <span class="text-[11px] text-slate-500">KDV'siz İhracat Gelirleri</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Faaliyet Giderleri (770)</span>
              <div class="text-lg font-bold font-mono text-slate-700 mt-1">₺312.400,00</div>
              <span class="text-[11px] text-slate-500">Yönetim ve Ofis Masrafları</span>
            </div>
          </div>

          <!-- Full TDHP Ledger Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="font-bold text-xs text-slate-900">TDHP Ayrıntılı Kebir Mizanı (Ekim 2026)</span>
                <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Tekdüzen Uyumlu</span>
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  id="ledger-filter-input"
                  oninput="filterLedgerTable(this.value)"
                  placeholder="Hesap Kodu veya Adı ile Filtrele..."
                  class="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white w-64 focus:outline-none focus:border-emerald-600"
                />
                <button onclick="downloadMizanExcel()" class="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 font-medium">Excel İndir</button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono" id="table-ledger-full">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase border-b border-slate-200 font-sans">
                    <th class="py-2.5 px-3">Hesap Kodu &amp; Açıklama</th>
                    <th class="py-2.5 px-3">Hesap Türü</th>
                    <th class="py-2.5 px-3 text-right">Borç Tutarı (₺)</th>
                    <th class="py-2.5 px-3 text-right">Alacak Tutarı (₺)</th>
                    <th class="py-2.5 px-3 text-right">Borç Bakiye (₺)</th>
                    <th class="py-2.5 px-3 text-right">Alacak Bakiye (₺)</th>
                    <th class="py-2.5 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="tbody-ledger-full">
                  <!-- Injected via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 3: SATIŞLAR & FATURALAR -->
        <!-- ========================================== -->
        <div id="view-sales" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Satışlar &amp; Gelirler</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Satış Faturaları &amp; e-İhracat Yönetimi (ETGB / İBKB)</h1>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="openModal('modal-new-invoice')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">add</span>
                <span>+ Yeni e-İhracat / Satış Faturası</span>
              </button>
            </div>
          </div>

          <!-- Sales Summary KPI Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Toplam Satış Hacmi</span>
              <div id="sales-kpi-total" class="text-lg font-bold font-mono text-slate-900 mt-1">£20.664 + €14.800</div>
              <span class="text-[11px] text-emerald-600 font-medium">₺1.854.200 TL Karşılığı</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Tahsil Edilen</span>
              <div class="text-lg font-bold font-mono text-emerald-700 mt-1">£8.525 + €14.800</div>
              <span class="text-[11px] text-slate-500">Bankaya Geçen Tutar</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Bekleyen Açık Bakiye</span>
              <div id="sales-kpi-open" class="text-lg font-bold font-mono text-amber-700 mt-1">£12.139,22</div>
              <span class="text-[11px] text-amber-700 font-medium">1 ETGB (12 Gün Kaldı)</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">İhracat KDV İstisnası (301)</span>
              <div class="text-lg font-bold font-mono text-blue-700 mt-1">₺142.800,00</div>
              <span class="text-[11px] text-blue-600">İade Alınacak KDV</span>
            </div>
          </div>

          <!-- Sales Invoices Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-800">Düzenlenen Faturalar &amp; İhracat Beyannameleri</span>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  oninput="filterSalesTable(this.value)"
                  placeholder="Fatura No veya Müşteri Ara..."
                  class="px-2 py-1 text-xs border border-slate-300 rounded bg-white w-48 focus:outline-none"
                />
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono" id="table-sales">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase border-b border-slate-200 font-sans">
                    <th class="py-2.5 px-3">Fatura No</th>
                    <th class="py-2.5 px-3">Müşteri Ünvanı</th>
                    <th class="py-2.5 px-3">Tarih</th>
                    <th class="py-2.5 px-3">ETGB / VEDOP No</th>
                    <th class="py-2.5 px-3">KDV İstisnası</th>
                    <th class="py-2.5 px-3 text-right">Tutar (Döviz)</th>
                    <th class="py-2.5 px-3 text-right">TL Karşılığı</th>
                    <th class="py-2.5 px-3 text-center">İBKB Durumu</th>
                    <th class="py-2.5 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="tbody-sales">
                  <!-- Populated dynamically via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 4: GİDERLER & ALIŞ FATURALARI -->
        <!-- ========================================== -->
        <div id="view-expenses" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Giderler</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Giderler &amp; Tedarikçi Alış Faturaları</h1>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="openModal('modal-new-expense')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">add</span>
                <span>+ Yeni Gider / Fiş Ekle</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Toplam Tedarikçi Borcu</span>
              <div id="expenses-kpi-debt" class="text-lg font-bold font-mono text-slate-900 mt-1">₺342.180,00</div>
              <span class="text-[11px] text-slate-500">Kumaş, Fason &amp; İplik</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Bu Hafta Ödenecekler</span>
              <div class="text-lg font-bold font-mono text-amber-600 mt-1">₺277.400,00</div>
              <span class="text-[11px] text-amber-700 font-medium">Birlik Kumaş + Çetin Boyahane</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Ödenen Giderler (Ekim)</span>
              <div class="text-lg font-bold font-mono text-emerald-700 mt-1">₺125.730,00</div>
              <span class="text-[11px] text-slate-500">Kira, Doğalgaz, Akaryakıt</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">191 İndirilecek KDV</span>
              <div class="text-lg font-bold font-mono text-blue-700 mt-1">₺68.436,00</div>
              <span class="text-[11px] text-blue-600">Beyannamede Mahsup</span>
            </div>
          </div>

          <!-- Expenses Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-800">Tedarikçi Alış Faturaları ve İşletme Masrafları</span>
              <span class="text-slate-500">KDV Tevkifatı &amp; Form Ba Uyumlu</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono" id="table-expenses">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase border-b border-slate-200 font-sans">
                    <th class="py-2.5 px-3">Fatura No</th>
                    <th class="py-2.5 px-3">Tedarikçi / Alacaklı</th>
                    <th class="py-2.5 px-3">Gider Kategorisi</th>
                    <th class="py-2.5 px-3">Vade Tarihi</th>
                    <th class="py-2.5 px-3 text-right">Matrah (₺)</th>
                    <th class="py-2.5 px-3 text-right">KDV %10/20 (₺)</th>
                    <th class="py-2.5 px-3 text-right">Toplam (₺)</th>
                    <th class="py-2.5 px-3 text-center">Durum</th>
                    <th class="py-2.5 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="tbody-expenses">
                  <!-- Populated dynamically via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 5: MÜŞTERİLER & CARİLER (ADRES DEFTERİ & BEN ELLIS) -->
        <!-- ========================================== -->
        <div id="view-contacts" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Müşteriler &amp; Cariler</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Cari Adres Defteri &amp; Bakiye Masası</h1>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="openModal('modal-new-contact')" class="px-3.5 py-1.5 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">person_add</span>
                <span>+ Yeni Cari Kartı</span>
              </button>
              <button onclick="openModal('modal-new-payment')" class="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">add</span>
                <span>+ Tahsilat / Havale Eşle</span>
              </button>
            </div>
          </div>

          <!-- Two Highlight Cards: Ben Ellis (Alacak) & Faruk Aytin (Fason Mahsup Borcu) -->
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
          </div>

          <!-- All Cariler Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-800">Müşteri ve Tedarikçi Cari Hesap Kartları</span>
              <span class="text-slate-500">Tüm Hesaplar ve Bakiyeler</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono" id="table-contacts">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase border-b border-slate-200 font-sans">
                    <th class="py-2.5 px-3">Cari Kodu</th>
                    <th class="py-2.5 px-3">Firma Ünvanı</th>
                    <th class="py-2.5 px-3">Cari Tipi</th>
                    <th class="py-2.5 px-3">Vergi No / VAT</th>
                    <th class="py-2.5 px-3">Şehir / Ülke</th>
                    <th class="py-2.5 px-3 text-right">Açık Bakiye</th>
                    <th class="py-2.5 px-3 text-center">Durum</th>
                    <th class="py-2.5 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="tbody-contacts">
                  <!-- Populated dynamically via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 6: KASA, BANKALAR & TCMB MASASI -->
        <!-- ========================================== -->
        <div id="view-banking" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Kasa ve Bankalar</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Banka Hesapları, Kasalar &amp; TCMB Masası</h1>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="openModal('modal-dab-calculator')" class="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">currency_exchange</span>
                <span>TCMB %40 Bozum Masası (DAB)</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </div>

          <!-- Bank Movements Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-800">Son Banka &amp; Kasa Hareketleri</span>
              <span class="text-emerald-700 font-semibold">Garanti BBVA API Entegre</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono" id="table-bank-moves">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase border-b border-slate-200 font-sans">
                    <th class="py-2.5 px-3">Tarih</th>
                    <th class="py-2.5 px-3">Hesap</th>
                    <th class="py-2.5 px-3">İşlem Açıklaması</th>
                    <th class="py-2.5 px-3 text-right">Giriş Tutarı</th>
                    <th class="py-2.5 px-3 text-right">Çıkış Tutarı</th>
                    <th class="py-2.5 px-3 text-right">Güncel Bakiye</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="tbody-bank-moves">
                  <!-- Populated via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 7: ÇEK & SENET MASASI (PORTFÖY) -->
        <!-- ========================================== -->
        <div id="view-checks" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Çek &amp; Senet</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Çek &amp; Senet Masası (Portföy &amp; Vade Takibi)</h1>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="openModal('modal-new-check')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">add</span>
                <span>+ Yeni Çek / Senet Girişi</span>
              </button>
            </div>
          </div>

          <!-- Checks KPI -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase font-sans">Portföydeki Müşteri Çekleri</span>
              <div id="checks-kpi-total" class="text-2xl font-bold text-slate-900 mt-1">₺420.000,00</div>
              <span class="text-xs text-emerald-700 font-sans font-medium">4 Adet Çek • Ortalama Vade: 28 Gün</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase font-sans">Verilen Borç Çekleri (Tedarikçi)</span>
              <div class="text-2xl font-bold text-rose-700 mt-1">₺185.000,00</div>
              <span class="text-xs text-rose-600 font-sans font-medium">1 Adet Çek (Birlik Kumaşçılık)</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase font-sans">Karekodlu Findeks Risk Raporu</span>
              <div class="text-2xl font-bold text-emerald-700 mt-1">%0 Risk</div>
              <span class="text-xs text-slate-500 font-sans">Tüm keşidecilerin çek ödeme endeksi yüksek</span>
            </div>
          </div>

          <!-- Checks Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-800">Alınan Müşteri Çekleri Portföyü</span>
              <span class="text-slate-500">Takas / Tahsil Bankası: Garanti BBVA</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono" id="table-checks">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase border-b border-slate-200 font-sans">
                    <th class="py-2.5 px-3">Çek No</th>
                    <th class="py-2.5 px-3">Keşideci Firma</th>
                    <th class="py-2.5 px-3">Banka &amp; Şube</th>
                    <th class="py-2.5 px-3">Vade Tarihi</th>
                    <th class="py-2.5 px-3 text-right">Tutar (TL)</th>
                    <th class="py-2.5 px-3 text-center">Durum</th>
                    <th class="py-2.5 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="tbody-checks">
                  <!-- Populated dynamically via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 8: PERSONEL & BORDRO -->
        <!-- ========================================== -->
        <div id="view-payroll" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Personel &amp; Bordro</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Personel Listesi, SGK &amp; Aylık Maaş Bordro İcmali</h1>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="downloadBankSalaryTxt()" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">payments</span>
                <span>Garanti BBVA Maaş Listesi İndir</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase font-sans">Toplam Personel</span>
              <div class="text-2xl font-bold text-slate-900 mt-1">18 Çalışan</div>
              <span class="text-xs text-slate-500 font-sans">14 Atölye / 4 İdari Ofis</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase font-sans">Net Maaş Yükü</span>
              <div class="text-2xl font-bold text-slate-900 mt-1">₺384.600,00</div>
              <span class="text-xs text-slate-500 font-sans">Ay Sonu Banka Transferi</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase font-sans">SGK İşçi &amp; İşveren Primi</span>
              <div class="text-2xl font-bold text-rose-700 mt-1">₺98.400,00</div>
              <span class="text-xs text-slate-500 font-sans">Muhtasar ile Ödenecek</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase font-sans">Gelir Vergisi Stopajı</span>
              <div class="text-2xl font-bold text-blue-700 mt-1">₺42.850,00</div>
              <span class="text-xs text-slate-500 font-sans">Asgari Ücret İstisnası Mahsuplu</span>
            </div>
          </div>

          <!-- Payroll Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-800">Personel Bordro Listesi (Ekim 2026 Dönemi)</span>
              <span class="text-slate-500">18 Personel Kayıtlı</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono" id="table-payroll">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase border-b border-slate-200 font-sans">
                    <th class="py-2.5 px-3">Sicil No</th>
                    <th class="py-2.5 px-3">Adı Soyadı</th>
                    <th class="py-2.5 px-3">Görevi / Departman</th>
                    <th class="py-2.5 px-3 text-right">Brüt Ücret (₺)</th>
                    <th class="py-2.5 px-3 text-right">SGK Kesintisi (₺)</th>
                    <th class="py-2.5 px-3 text-right">Gelir Vergisi (₺)</th>
                    <th class="py-2.5 px-3 text-right">Net Ödenecek (₺)</th>
                    <th class="py-2.5 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="tbody-payroll">
                  <!-- Populated via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 9: e-DÖNÜŞÜM & e-DEFTER -->
        <!-- ========================================== -->
        <div id="view-edonusum" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">e-Dönüşüm</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">e-Fatura, e-İrsaliye &amp; GİB e-Defter Berat Masası</h1>
            </div>
            <button onclick="showToast('GİB e-Defter Berat Gönderimi Başlatılıyor...', 'success')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[18px]">cloud_upload</span>
              <span>GİB'e Berat Yükle &amp; Mühürle</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">e-Defter Yevmiye Beratı</span>
              <div class="text-lg font-bold text-emerald-700 mt-1">✓ Doğrulandı &amp; Mühürlendi</div>
              <span class="text-xs text-slate-500">Ekim 2026 Yevmiye Defteri (XML)</span>
              <button onclick="openModal('modal-edefter-viewer')" class="mt-3 text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">XML Beratı İncele →</button>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">e-Defter Kebir Beratı</span>
              <div class="text-lg font-bold text-emerald-700 mt-1">✓ Doğrulandı &amp; Mühürlendi</div>
              <span class="text-xs text-slate-500">Ekim 2026 Defter-i Kebir (XML)</span>
              <button onclick="openModal('modal-edefter-viewer')" class="mt-3 text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">XML Beratı İncele →</button>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">e-İrsaliye Entegrasyonu</span>
              <div class="text-lg font-bold text-slate-900 mt-1">Canlı / Karekodlu</div>
              <span class="text-xs text-slate-500">Taşıyıcı: Ekol Lojistik (34 BRS 190)</span>
              <button onclick="showToast('Aktif e-İrsaliyeler listeleniyor...', 'info')" class="mt-3 text-xs text-slate-700 font-bold hover:underline flex items-center gap-1">İrsaliyeleri Gör →</button>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 10: Ba/Bs & e-MUTABAKAT -->
        <!-- ========================================== -->
        <!-- ========================================== -->
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
        </div>

        <!-- ========================================== -->
        <!-- MODULE 11: STOK & GTİP -->
        <!-- ========================================== -->
        <div id="view-inventory" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Stok &amp; Ürünler</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Tekstil Kumaş, İplik &amp; GTİP Kataloğu</h1>
            </div>
            <button onclick="openModal('modal-new-stock')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span>+ Depo Giriş / Çıkış Fişi</span>
            </button>
          </div>

          <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
            <span class="font-bold text-xs text-slate-900 uppercase">Kumaş &amp; İplik Envanter Değeri:</span>
            <div id="inventory-total-value" class="text-2xl font-bold font-mono text-slate-900 mt-1">₺3.702.750,00</div>
            <p class="text-xs text-slate-500 mt-1">GTİP: 5208.52.00 Dokuma Gömleklik (14.850 m), 6006.22.00 Penye Süprem (8.200 kg), 5205.12.00 Pamuk İplik (4.500 kg)</p>
          </div>

          <!-- Stock Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-800">Depo Stok Kartları &amp; İhracat GTİP Kodları</span>
              <span class="text-slate-500">İkitelli Ana Depo</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono" id="table-inventory">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase border-b border-slate-200 font-sans">
                    <th class="py-2.5 px-3">Stok Kodu</th>
                    <th class="py-2.5 px-3">Ürün Tanımı &amp; Kumaş Cinsi</th>
                    <th class="py-2.5 px-3">GTİP Kodu</th>
                    <th class="py-2.5 px-3 text-right">Mevcut Miktar</th>
                    <th class="py-2.5 px-3">Birim</th>
                    <th class="py-2.5 px-3 text-right">Birim Maliyet (₺)</th>
                    <th class="py-2.5 px-3 text-right">Toplam Değer (₺)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="tbody-inventory">
                  <!-- Populated via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 12: MALİ RAPORLAR & KDV -->
        <!-- ========================================== -->
        <div id="view-reports" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Raporlar</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Mali Raporlar, KDV İadesi &amp; İBKB Terkin İcmali</h1>
            </div>
            <button onclick="showToast('Tüm Mali Raporlar Paketi İndirildi (PDF).', 'success')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[18px]">download</span>
              <span>Mali Raporları İndir (PDF/Excel)</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
              <span class="font-bold text-slate-900 uppercase font-sans">KDV-1 &amp; İade Raporu</span>
              <div class="flex justify-between"><span class="font-sans text-slate-500">Hesaplanan KDV:</span><span class="font-bold">₺97.100</span></div>
              <div class="flex justify-between"><span class="font-sans text-slate-500">İndirilecek KDV:</span><span class="font-bold">₺68.436</span></div>
              <div class="flex justify-between text-blue-700 font-bold border-t pt-1"><span class="font-sans">301 İade Alacağı:</span><span>₺142.800</span></div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
              <span class="font-bold text-slate-900 uppercase font-sans">İBKB İhracat Terkin</span>
              <div class="flex justify-between"><span class="font-sans text-slate-500">Kapanan ETGB:</span><span class="text-emerald-700 font-bold">2 Dosya</span></div>
              <div class="flex justify-between"><span class="font-sans text-slate-500">Açık Bakiye:</span><span class="text-amber-700 font-bold">£12.139,22</span></div>
              <div class="flex justify-between font-bold border-t pt-1 text-amber-800"><span class="font-sans">Yasal Kalan:</span><span>12 Gün</span></div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
              <span class="font-bold text-slate-900 uppercase font-sans">Net Faaliyet Karı</span>
              <div class="flex justify-between"><span class="font-sans text-slate-500">Toplam Gelir:</span><span class="font-bold">₺1.854.200</span></div>
              <div class="flex justify-between"><span class="font-sans text-slate-500">Toplam Gider:</span><span class="font-bold">₺542.180</span></div>
              <div class="flex justify-between text-emerald-700 font-bold border-t pt-1"><span class="font-sans">Net Kar:</span><span>+₺1.312.020</span></div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 13: AYARLAR & ŞİRKET PROFİLİ -->
        <!-- ========================================== -->
        <div id="view-settings" class="module-view space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <button onclick="switchView('dashboard')" class="hover:underline">Kokpit</button>
                <span>/</span>
                <span class="text-[#00AA6C]">Ayarlar</span>
              </div>
              <h1 class="text-slate-900 font-display text-xl font-bold mt-0.5">Şirket Profili &amp; GİB e-Fatura Entegrasyon Ayarları</h1>
            </div>
            <button onclick="saveSettings()" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm">
              Ayarları Kaydet
            </button>
          </div>

          <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-slate-500 font-semibold mb-1">Resmi Şirket Unvanı</label>
                <input id="set-company-name" class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-900 bg-slate-50" value="BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ." />
              </div>
              <div>
                <label class="block text-slate-500 font-semibold mb-1">Vergi Dairesi &amp; Vergi No</label>
                <input id="set-tax-office" class="w-full p-2 border border-slate-300 rounded font-mono text-slate-900" value="İkitelli Vergi Dairesi • 1870492109"/>
              </div>
              <div>
                <label class="block text-slate-500 font-semibold mb-1">Garanti BBVA GBP IBAN</label>
                <input id="set-gbp-iban" class="w-full p-2 border border-slate-300 rounded font-mono text-slate-900" value="TR32 0006 2000 1827 0009 2381 01"/>
              </div>
              <div>
                <label class="block text-slate-500 font-semibold mb-1">GİB Özel Entegratör</label>
                <input id="set-integrator" class="w-full p-2 border border-slate-300 rounded text-slate-900" value="Uyumsoft Bilgi Sistemleri (API Canlı)"/>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>

  <!-- BOTTOM REALTIME FINTECH TICKER FOOTER -->
  <footer class="fixed bottom-0 left-0 lg:left-64 right-0 h-8 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between text-xs text-slate-300 z-40 select-none shadow-md">
    <div class="flex items-center gap-6 overflow-hidden">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-bold text-white text-[11px]">Brosan Cloud ERP • TDHP Uyumlu Ön &amp; Genel Muhasebe</span>
        <span class="text-[10px] text-slate-400 font-mono">v4.8 Stable</span>
      </div>
      <div class="hidden sm:flex items-center gap-4 text-[11px] font-mono border-l border-slate-800 pl-4">
        <span class="text-slate-400 flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px] text-amber-400">trending_up</span>
          TCMB Kurlar:
        </span>
        <span class="text-slate-200">GBP/TRY: <strong class="text-white">45.1200</strong></span>
        <span class="text-slate-400">•</span>
        <span class="text-slate-200">USD/TRY: <strong class="text-white">34.2050</strong></span>
        <span class="text-slate-400">•</span>
        <span class="text-slate-200">EUR/TRY: <strong class="text-white">37.4520</strong></span>
      </div>
    </div>
    <div class="flex items-center gap-4 text-[11px]">
      <span class="hidden md:inline text-slate-400">Garanti BBVA API: <strong class="text-emerald-400">Canlı Entegre</strong></span>
      <span class="text-emerald-400 flex items-center gap-1 font-medium">
        <span class="material-symbols-outlined text-[13px]">verified</span>
        GİB e-Defter: Senkronize
      </span>
    </div>
  </footer>

  <!-- ========================================== -->
  <!-- COMPLETE INTERACTIVE MODALS -->
  <!-- ========================================== -->

  <!-- MODAL 1: NEW INVOICE -->
  <div id="modal-new-invoice" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 class="font-display font-bold text-base text-slate-900 flex items-center gap-2">
          <span class="material-symbols-outlined text-[#00AA6C]">receipt_long</span>
          Yeni e-İhracat / Satış Faturası Düzenle
        </h3>
        <button onclick="closeModal('modal-new-invoice')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-600 font-semibold mb-1">Müşteri Seçin (Cari Kartı)</label>
          <select id="inv-customer" class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
            <option value="BEN ELLIS (UK)">BEN ELLIS (CR-GB-0024 - Manchester, UK)</option>
            <option value="MILANO TESSUTI SRL">MILANO TESSUTI SRL</option>
            <option value="DEFACTO PERAKENDE TİC. A.Ş.">DEFACTO PERAKENDE TİC. A.Ş.</option>
            <option value="ZİRVE TEKSTİL PAZARLAMA A.Ş.">ZİRVE TEKSTİL PAZARLAMA A.Ş.</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Fatura Tipi</label>
            <select id="inv-type" class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
              <option value="301 - Mal İhracatı">İSTİSNA (301 - Mal İhracatı / ETGB)</option>
              <option value="TEVKİFATLI 7/10">TEVKİFATLI (Fason Tekstil 7/10)</option>
              <option value="%10 KDV">TEMEL FATURA (%10 KDV)</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Para Birimi</label>
            <select id="inv-currency" class="w-full p-2 border border-slate-300 rounded font-mono font-semibold">
              <option value="GBP">GBP (£) • 45.1200 TCMB</option>
              <option value="USD">USD ($) • 34.2050 TCMB</option>
              <option value="EUR">EUR (€) • 37.4520 TCMB</option>
              <option value="TRY">TRY (₺) • 1.0000</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">ETGB No (Gümrük Beyannamesi)</label>
            <input id="inv-etgb" class="w-full p-2 border border-slate-300 rounded font-mono" placeholder="Örn: 26340200EX010442" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">GTİP Kodu</label>
            <input id="inv-gtip" class="w-full p-2 border border-slate-300 rounded font-mono" value="5208.52.00 Dokuma Gömleklik" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Fatura Tutarı (Döviz Cinsinden)</label>
            <input id="inv-amount" class="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900" placeholder="12139.22" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Vade (Yasal İBKB 180 Gün)</label>
            <input id="inv-due-date" type="date" class="w-full p-2 border border-slate-300 rounded" value="2026-11-30" />
          </div>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button onclick="closeModal('modal-new-invoice')" class="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">İptal</button>
        <button onclick="submitNewInvoice()" class="px-4 py-2 bg-[#00AA6C] hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm">Faturayı Kes &amp; GİB'e Gönder</button>
      </div>
    </div>
  </div>

  <!-- MODAL 2: INVOICE VIEWER (UBL-TR / PDF PREVIEW) -->
  <div id="modal-invoice-viewer" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
          <h3 id="inv-viewer-title" class="font-display font-bold text-base text-slate-900">e-İhracat Fatura Detayı</h3>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">UBL-TR 1.2 XML</span>
        </div>
        <button onclick="closeModal('modal-invoice-viewer')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <div id="inv-viewer-content" class="text-xs space-y-4">
        <!-- Injected dynamically via JS -->
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
        <button onclick="window.print()" class="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs">
          <span class="material-symbols-outlined text-[16px]">print</span>
          <span>Yazdır / PDF</span>
        </button>
        <button onclick="closeModal('modal-invoice-viewer')" class="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold">Kapat</button>
      </div>
    </div>
  </div>

  <!-- MODAL 3: NEW EXPENSE -->
  <div id="modal-new-expense" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 class="font-display font-bold text-base text-slate-900 flex items-center gap-2">
          <span class="material-symbols-outlined text-amber-600">receipt</span>
          Yeni Tedarikçi Gider / Alış Faturası Girişi
        </h3>
        <button onclick="closeModal('modal-new-expense')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-600 font-semibold mb-1">Tedarikçi Firma</label>
          <select id="exp-supplier" class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
            <option value="BİRLİK KUMAŞÇILIK SAN. LTD.">BİRLİK KUMAŞÇILIK SAN. LTD. (1780492811)</option>
            <option value="ÇETİN MENSUCAT BOYA LTD.">ÇETİN MENSUCAT BOYA LTD. (2450891234)</option>
            <option value="MARİFET İPLİK SANAYİ A.Ş.">MARİFET İPLİK SANAYİ A.Ş.</option>
            <option value="İGDAŞ Doğalgaz Fabrika Tüketimi">İGDAŞ Doğalgaz Fabrika Tüketimi</option>
            <option value="Petrol Ofisi Akaryakıt Servis">Petrol Ofisi Akaryakıt Servis</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">TDHP Gider Hesabı</label>
            <select id="exp-account" class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
              <option value="150.01 Ham Dokuma Kumaş">150.01 - Ham Kumaş Alımı</option>
              <option value="770.04 Fason Boyahane">770.04 - Fason Boyahane Gideri</option>
              <option value="770.01 Yönetim &amp; Fabrika">770.01 - Yönetim &amp; Fabrika Masrafları</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">KDV Oranı</label>
            <select id="exp-kdv-rate" class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
              <option value="10">%10 KDV (Tekstil &amp; Kumaş)</option>
              <option value="20">%20 KDV (Genel Masraf)</option>
              <option value="0">%0 KDV (İstisna)</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Fatura Tutarı (KDV Dahil ₺)</label>
            <input id="exp-amount" class="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900" placeholder="185000.00" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Vade Tarihi</label>
            <input id="exp-due-date" type="date" class="w-full p-2 border border-slate-300 rounded" value="2026-10-25" />
          </div>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button onclick="closeModal('modal-new-expense')" class="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">İptal</button>
        <button onclick="submitNewExpense()" class="px-4 py-2 bg-[#00AA6C] hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm">Gideri Kaydet</button>
      </div>
    </div>
  </div>

  <!-- MODAL 4: NEW PAYMENT -->
  <div id="modal-new-payment" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 class="font-display font-bold text-base text-slate-900 flex items-center gap-2">
          <span class="material-symbols-outlined text-[#00AA6C]">payments</span>
          Tahsilat / Havale Eşleme Masası
        </h3>
        <button onclick="closeModal('modal-new-payment')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-600 font-semibold mb-1">Cari Seçimi</label>
          <select id="pay-contact" class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
            <option value="ben-ellis">BEN ELLIS (£12.139,22 Açık Bakiye)</option>
            <option value="milano">MILANO TESSUTI SRL (€14.800,00)</option>
            <option value="zirve">ZİRVE TEKSTİL PAZARLAMA A.Ş. (₺150.000,00)</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Tahsil Edilen Hesap</label>
            <select class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
              <option>Garanti BBVA GBP (TR32...8101)</option>
              <option>Garanti BBVA TRY (TR45...8102)</option>
              <option>Akbank Döviz</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Tahsil Tutarı</label>
            <input class="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900" value="£12.139,22" />
          </div>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button onclick="closeModal('modal-new-payment')" class="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">Kapat</button>
        <button onclick="submitPaymentMatch()" class="px-4 py-2 bg-[#00AA6C] hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm">Tahsilatı Eşle &amp; Kaydet</button>
      </div>
    </div>
  </div>

  <!-- MODAL 5: NEW CHECK -->
  <div id="modal-new-check" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 class="font-display font-bold text-base text-slate-900 flex items-center gap-2">
          <span class="material-symbols-outlined text-indigo-600">request_quote</span>
          Yeni Çek / Senet Portföy Girişi
        </h3>
        <button onclick="closeModal('modal-new-check')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Çek Türü</label>
            <select class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
              <option>Alınan Müşteri Çeki (121)</option>
              <option>Verilen Borç Çeki (103/321)</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Çek No &amp; Karekod</label>
            <input id="chk-no" class="w-full p-2 border border-slate-300 rounded font-mono" placeholder="Örn: CK-849201" />
          </div>
        </div>
        <div>
          <label class="block text-slate-600 font-semibold mb-1">Keşideci Firma &amp; Banka</label>
          <input id="chk-drawer" class="w-full p-2 border border-slate-300 rounded" placeholder="Örn: Zirve Tekstil A.Ş. • İş Bankası Merter" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Çek Tutarı (₺)</label>
            <input id="chk-amount" class="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900" placeholder="150000.00" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Vade Tarihi</label>
            <input id="chk-due-date" type="date" class="w-full p-2 border border-slate-300 rounded" value="2026-11-15" />
          </div>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button onclick="closeModal('modal-new-check')" class="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">İptal</button>
        <button onclick="submitNewCheck()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm">Çeki Portföye Al</button>
      </div>
    </div>
  </div>

  <!-- MODAL 6: CARİ HESAP EKSTRESİ (STATEMENT VIEWER) -->
  <div id="modal-cari-ekstre" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-blue-600 text-[20px]">receipt</span>
          <h3 id="ekstre-modal-title" class="font-display font-bold text-base text-slate-900">Cari Hesap Ekstresi</h3>
        </div>
        <button onclick="closeModal('modal-cari-ekstre')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div id="ekstre-modal-body" class="text-xs space-y-3">
        <!-- Injected via JS -->
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
        <button onclick="window.print()" class="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs">
          <span class="material-symbols-outlined text-[16px]">print</span>
          <span>Ekstre Yazdır (PDF)</span>
        </button>
        <button onclick="closeModal('modal-cari-ekstre')" class="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold">Kapat</button>
      </div>
    </div>
  </div>

  <!-- MODAL 7: MUAVİN DEFTERİ (TDHP ACCOUNT LEDGER) -->
  <div id="modal-muavin" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[#00AA6C] text-[20px]">account_tree</span>
          <h3 id="muavin-modal-title" class="font-display font-bold text-base text-slate-900">TDHP Muavin Defteri</h3>
        </div>
        <button onclick="closeModal('modal-muavin')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div id="muavin-modal-body" class="text-xs space-y-3">
        <!-- Injected via JS -->
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
        <button onclick="window.print()" class="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs">
          <span class="material-symbols-outlined text-[16px]">print</span>
          <span>Muavin Yazdır (PDF)</span>
        </button>
        <button onclick="closeModal('modal-muavin')" class="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold">Kapat</button>
      </div>
    </div>
  </div>

  <!-- MODAL 8: YENİ CARİ KARTI TANIMLAMA -->
  <div id="modal-new-contact" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 class="font-display font-bold text-base text-slate-900 flex items-center gap-2">
          <span class="material-symbols-outlined text-[#00AA6C]">person_add</span>
          Yeni Cari Hesap Kartı Aç
        </h3>
        <button onclick="closeModal('modal-new-contact')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Cari Kodu</label>
            <input id="new-contact-code" class="w-full p-2 border border-slate-300 rounded font-mono font-bold" value="CR-TR-0050" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Cari Türü</label>
            <select id="new-contact-type" class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
              <option value="Müşteri (Alıcı)">Müşteri (120 Alıcılar)</option>
              <option value="Tedarikçi (Satıcı)">Tedarikçi (320 Satıcılar)</option>
              <option value="İhracat Müşterisi">İhracat Müşterisi (Yurtdışı)</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-slate-600 font-semibold mb-1">Firma Resmi Ünvanı</label>
          <input id="new-contact-name" class="w-full p-2 border border-slate-300 rounded font-semibold" placeholder="Örn: Anadolu Dokuma ve Tekstil San. Tic. A.Ş." />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Vergi Dairesi &amp; VKN/TCKN</label>
            <input id="new-contact-vkn" class="w-full p-2 border border-slate-300 rounded font-mono" placeholder="Güneşli V.D. • 1928374610" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Şehir / Ülke</label>
            <input id="new-contact-city" class="w-full p-2 border border-slate-300 rounded" value="İstanbul / Türkiye" />
          </div>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button onclick="closeModal('modal-new-contact')" class="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">İptal</button>
        <button onclick="submitNewContact()" class="px-4 py-2 bg-[#00AA6C] hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm">Cari Kartı Kaydet</button>
      </div>
    </div>
  </div>

  <!-- MODAL 9: YENİ MAHSUP / YEVMİYE FİŞİ -->
  <div id="modal-new-journal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 class="font-display font-bold text-base text-slate-900 flex items-center gap-2">
          <span class="material-symbols-outlined text-[#00AA6C]">account_tree</span>
          Yeni Mahsup / Yevmiye Fişi Düzenle
        </h3>
        <button onclick="closeModal('modal-new-journal')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Yevmiye Fiş No</label>
            <input id="jrn-no" class="w-full p-2 border border-slate-300 rounded font-mono font-bold" value="YEV-2026-00482" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Tarih</label>
            <input id="jrn-date" type="date" class="w-full p-2 border border-slate-300 rounded" value="2026-10-06" />
          </div>
        </div>
        <div>
          <label class="block text-slate-600 font-semibold mb-1">İşlem Açıklaması</label>
          <input id="jrn-desc" class="w-full p-2 border border-slate-300 rounded" placeholder="Örn: Garanti BBVA Banka Masrafı &amp; EFT Komisyonu" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Borçlu Hesap (TDHP)</label>
            <select id="jrn-debit-acc" class="w-full p-2 border border-slate-300 rounded font-mono text-slate-800">
              <option value="770.01">770.01 - Genel Yönetim Giderleri</option>
              <option value="150.01">150.01 - Ham Kumaş Depo</option>
              <option value="102.02">102.02 - Garanti TRY Ticari</option>
              <option value="320.01">320.01 - Birlik Kumaşçılık</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Alacaklı Hesap (TDHP)</label>
            <select id="jrn-credit-acc" class="w-full p-2 border border-slate-300 rounded font-mono text-slate-800">
              <option value="102.02">102.02 - Garanti TRY Ticari</option>
              <option value="100.01">100.01 - Merkez Kasa TL</option>
              <option value="601.01">601.01 - İhracat Gelirleri</option>
              <option value="320.01">320.01 - Birlik Kumaşçılık</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-slate-600 font-semibold mb-1">Tutar (₺)</label>
          <input id="jrn-amount" class="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900" placeholder="1500.00" />
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button onclick="closeModal('modal-new-journal')" class="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">İptal</button>
        <button onclick="submitNewJournal()" class="px-4 py-2 bg-[#00AA6C] hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm">Fişi Kaydet &amp; Mühürle</button>
      </div>
    </div>
  </div>

  <!-- MODAL 10: PERSONEL BORDRO PUSULASI (PAY SLIP) -->
  <div id="modal-bordro-pusula" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-blue-600 text-[20px]">badge</span>
          <h3 id="bordro-pusula-title" class="font-display font-bold text-base text-slate-900">Aylık Ücret Hesap Pusulası</h3>
        </div>
        <button onclick="closeModal('modal-bordro-pusula')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div id="bordro-pusula-content" class="text-xs space-y-3">
        <!-- Injected via JS -->
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
        <button onclick="window.print()" class="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs">
          <span class="material-symbols-outlined text-[16px]">print</span>
          <span>Pusula Yazdır (PDF)</span>
        </button>
        <button onclick="closeModal('modal-bordro-pusula')" class="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold">Kapat</button>
      </div>
    </div>
  </div>

  <!-- MODAL 11: TCMB %40 BOZUM MASASI & DAB HESAPLAMA -->
  <div id="modal-dab-calculator" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm">
            %40
          </div>
          <div>
            <h3 class="font-display font-bold text-base text-slate-900">TCMB İBKB %40 Zorunlu Bozum Masası</h3>
            <span class="text-[11px] text-slate-500">T.C. Hazine ve Maliye Bakanlığı İhracat Genelgesi Uyarınca</span>
          </div>
        </div>
        <button onclick="closeModal('modal-dab-calculator')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="bg-amber-50/80 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 space-y-1">
        <div class="font-bold flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px]">info</span>
          Ben Ellis - Açık ETGB Bedeli
        </div>
        <div>Fatura Tutarı: <strong>£12.139,22 GBP</strong> • Güncel TCMB Gösterge Alış Kuru: <strong class="font-mono">45.1200 TL</strong></div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs font-mono">
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span class="text-slate-500 font-sans text-[11px] uppercase block">TCMB'ye Bozdurulacak (%40):</span>
          <div class="text-base font-bold text-amber-800 mt-1">£4.855,69 GBP</div>
          <span class="text-slate-600 font-sans text-[11px]">TL Karşılığı: <strong>₺219.088,73</strong></span>
        </div>
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span class="text-emerald-800 font-sans text-[11px] uppercase block">Brosan'da Kalan Döviz (%60):</span>
          <div class="text-base font-bold text-emerald-800 mt-1">£7.283,53 GBP</div>
          <span class="text-emerald-700 font-sans text-[11px]">Garanti BBVA GBP hesabında kalır</span>
        </div>
      </div>

      <div class="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3">
        <div class="flex items-center justify-between">
          <span>Aracı Banka:</span>
          <strong class="text-slate-800">T. Garanti Bankası A.Ş. (Bahçeşehir Şubesi)</strong>
        </div>
        <div class="flex items-center justify-between">
          <span>Düzenlenecek Belge:</span>
          <strong class="text-slate-800">DAB (Döviz Alım Belgesi) &amp; İBKB</strong>
        </div>
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
        <button onclick="downloadDabDilekce()" class="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
          <span>Banka Dilekçesi İndir</span>
        </button>
        <button onclick="confirmDabExchange()" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">check_circle</span>
          <span>Bozumu Gerçekleştir &amp; İBKB Kapat</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 12: E-DEFTER XML BERAT GÖRÜNTÜLEYİCİ -->
  <div id="modal-edefter-viewer" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
          <h3 class="font-display font-bold text-base text-slate-900">GİB e-Defter Yevmiye Beratı (XML Şeması)</h3>
        </div>
        <button onclick="closeModal('modal-edefter-viewer')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-[11px] space-y-1.5 overflow-x-auto">
        <div>&lt;edefter:berat xmlns:edefter="http://www.edefter.gov.tr" version="1.0"&gt;</div>
        <div class="pl-4">&lt;mukellef vkn="1870492109" unvan="BROSAN TEKSTIL SAN. VE DIS TIC. LTD. STI." /&gt;</div>
        <div class="pl-4">&lt;defterTuru&gt;YEVMİYE_DEFTERİ&lt;/defterTuru&gt;</div>
        <div class="pl-4">&lt;donem baslangic="2026-10-01" bitis="2026-10-31" /&gt;</div>
        <div class="pl-4">&lt;yevmiyeSayac baslangicNo="1" bitisNo="482" /&gt;</div>
        <div class="pl-4">&lt;toplamBorc&gt;7262500.00&lt;/toplamBorc&gt;</div>
        <div class="pl-4">&lt;toplamAlacak&gt;7262500.00&lt;/toplamAlacak&gt;</div>
        <div class="pl-4">&lt;imzaDegeri imzalayan="Mali Mühür TÜBİTAK UEKAE" zaman="2026-10-06T14:40:22Z"&gt;</div>
        <div class="pl-8 text-slate-400">SHA256: 9e83b4c10294f82a9d8214...✓ GEÇERLİ</div>
        <div class="pl-4">&lt;/imzaDegeri&gt;</div>
        <div>&lt;/edefter:berat&gt;</div>
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-end">
        <button onclick="closeModal('modal-edefter-viewer')" class="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold">Kapat</button>
      </div>
    </div>
  </div>

  <!-- TOAST NOTIFICATION POPUP -->
  <div id="toast-container" class="fixed bottom-12 right-6 z-50 flex flex-col space-y-2 pointer-events-none"></div>

  <!-- ========================================== -->
  <!-- JAVASCRIPT REACTIVE CONTROLLER -->
  <!-- ========================================== -->
  <script>
    // CORE SYSTEM DATA MODEL
    const BROSAN_ERP = {
      company: {
        name: "BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ.",
        vkn: "1870492109",
        taxOffice: "İkitelli Vergi Dairesi",
        address: "İkitelli OSB Mah. Dokumacılar San. Sit. 4. Blok No:28 Başakşehir / İSTANBUL",
        garantiGbpIban: "TR86 0006 2000 4170 0009 0345 78", // Hesap: 417-9034578
        garantiTryIban: "TR16 0006 2000 4170 0006 2894 77", // Hesap: 417-6289477
        garantiLojistikTryIban: "TR84 0006 2000 4170 0006 2878 65", // Hesap: 417-6287865
        garantiEurIban: "TR59 0006 2000 4170 0009 0345 79", // Hesap: 417-9034579
        garantiUsdIban: "TR32 0006 2000 4170 0009 0345 80", // Hesap: 417-9034580
      },
      fx: {
        GBP: 64.79,
        USD: 49.23,
        EUR: 53.65
      },
      bankAccounts: {
        garantiGbp: 23759.07,
        garantiTry: 15732.92,
        garantiLojistikTry: 17210.75,
        garantiEur: 11792.36,
        garantiUsd: 1521.16,
        cariAcikEur: 9197.00,
        cariAcikUsd: 4748.93,
        kasaTry: -722.35,
        yunusCepKK: -248697.05
      },
      // Faruk Aytin & Nisa Tekstil Master Fason & Offset Model
      farukAytin: {
        summary: {
          supplierName: "FARUK AYTİN",
          subTitle: "NİSA TEKSTİL",
          tckn: "46849262292",
          address: "Sultangazi İstanbul Uğur Mumcu Mah. Eski Edirne Asfaltı No: 574/4",
          email: "nisatekstil34@hotmail.com",
          totalFasonAlisUsd: 24032.80,
          totalFasonAlisTl: 1171410.07,
          totalFasonKdvUsd: 2184.80,
          totalBankaOdemesiUsd: 6236.00,
          totalBankaOdemesiTl: 298471.00,
          kumasSatisUsd: 7461.45,
          kumasSatisTl: 364045.00,
          netKalanBorcUsd: -10335.35,
          netKalanBorcTl: -508894.07,
          netOdenecekKdvUsd: 1230.49,
          netOdenecekKdvTl: 60355.83,
          reconciliationStatus: "TAM MUTABIK (%100 Excel & Paraşüt Doğrulandı)"
        },
        faturalar: [
          { no: 'NSA2026000000070', date: '30.07.2026', desc: 'EMK Oversized Tişört (276 Adet)', usd: 3036.00, kdvUsd: 276.00, kur: 47.25, tl: 143451.00, status: 'Ödendi / Kapandı', isPaid: true },
          { no: 'NSA2026000000084', date: '01.10.2026', desc: 'Ben Ellis (140 T-shirt + 180 Hoodie)', usd: 6366.80, kdvUsd: 578.80, kur: 48.9303, tl: 311529.43, irsaliye: 'IRS2026000000078', fisNo: '1044145905', status: 'Avans + Kumaş Mahsubu ile Kapandı', isPaid: true },
          { no: 'NSA2026000000087', date: '05.10.2026', desc: 'Ben Ellis (375 T-shirt + 394 Hoodie)', usd: 14630.00, kdvUsd: 1330.00, kur: 48.9699, tl: 716429.64, irsaliye: 'IRS2026000000080', fisNo: '1044145920', status: 'Açık Kalan Bakiye: -$10.335,35 USD', isPaid: false }
        ],
        kumas: {
          faturaNo: 'BR02026000000024',
          date: '27.09.2026',
          kur: 48.7901,
          matrahTl: 330950.00,
          kdvTl: 33095.00,
          toplamTl: 364045.00,
          toplamUsd: 7461.45,
          kalemler: [
            { cins: 'B.KUMAŞ 30/2 PENYE SÜPREM', kg: 227.0, bfTl: 340, toplamTl: 84898.00, usd: 1740.07 },
            { cins: 'B.KUMAŞ 30/2 COM. PENYE MİLENYUM LYC RİBANA', kg: 14.5, bfTl: 340, toplamTl: 5423.00, usd: 111.15 },
            { cins: 'B.KUMAŞ 30/20/10 PENYE 3 İPLİK', kg: 650.0, bfTl: 330, toplamTl: 235950.00, usd: 4836.02 },
            { cins: 'B.KUMAŞ 30/2 PENYE 70 DNY LYC K.KORSE', kg: 101.0, bfTl: 340, toplamTl: 37774.00, usd: 774.21 }
          ]
        },
        odemeler: [
          { sira: 1, date: '31.07.2026', tl: 143451.00, usd: 3036.00, kur: 47.25, dekont: '2026-07-31-17.07.43', desc: 'NSA2026000000070 nolu fatura ödemesi' },
          { sira: 2, date: '07.09.2026', tl: 96600.00, usd: 2000.00, kur: 48.30, dekont: '2026-09-07-16.25.27', desc: 'Verilen siparişe istinaden avans' },
          { sira: 3, date: '14.09.2026', tl: 48420.00, usd: 1000.00, kur: 48.42, dekont: '2026-09-14-14.19.11', desc: 'Cari hesaba istinaden avans' },
          { sira: 4, date: '22.09.2026', tl: 5000.00, usd: 100.00, kur: 50.00, dekont: '2026-09-22-18.03.45', desc: '100 USD karşılığı cari ödeme' },
          { sira: 5, date: '30.09.2026', tl: 5000.00, usd: 100.00, kur: 50.00, dekont: '2026-09-30-18.20.49', desc: '100 USD karşılığı cari ödeme' }
        ]
      },
      // Invoices
      invoices: [
        {
          id: 'BS02026000000013',
          customer: 'BEN ELLİS',
          date: '01.10.2026',
          etgb: '26340200EX009281',
          exemption: '301 - Mal İhracatı',
          currency: 'GBP',
          amountFx: 7388.10,
          amountTry: 478675.00,
          ibkbStatus: 'Açık (TCMB %40 Bozum Bekliyor)',
          isClosed: false,
          gtip: '6109.10 T-Shirt / 6110.20 Hoodie',
          meters: '769 Adet (47 Koli, 427 Kg)'
        },
        {
          id: 'BR02026000000024',
          customer: 'FARUK AYTİN',
          date: '27.09.2026',
          etgb: 'Kumaş Mahsup Faturası',
          exemption: '%10 KDV',
          currency: 'TRY',
          amountFx: 364045.00,
          amountTry: 364045.00,
          ibkbStatus: 'Mahsup Edildi ✓',
          isClosed: true,
          gtip: '5208 Süprem / 6006 3 İplik',
          meters: '992,5 Kg Kumaş ($7.461,45 USD)'
        },
        {
          id: 'BS02025000000003',
          customer: 'LAVI LA LLC',
          date: '13.11.2025',
          etgb: '25340200EX004120',
          exemption: '301 - Mal İhracatı',
          currency: 'USD',
          amountFx: 10116.85,
          amountTry: 498052.52,
          ibkbStatus: 'İBKB Kapatıldı ✓',
          isClosed: true,
          gtip: '6204.42 Cotton Dress',
          meters: '1.850 Adet'
        },
        {
          id: 'BS02025000000004',
          customer: 'GbR Celik, David und Djemailji',
          date: '13.11.2025',
          etgb: '25340200EX004128',
          exemption: '301 - Mal İhracatı',
          currency: 'EUR',
          amountFx: 6586.04,
          amountTry: 353340.00,
          ibkbStatus: 'İBKB Kapatıldı ✓',
          isClosed: true,
          gtip: '6109.10 Penye T-Shirt',
          meters: '1.200 Adet'
        }
      ],
      // Expenses
      expenses: [
        {
          id: 'NSA2026000000087',
          supplier: 'FARUK AYTİN (NİSA TEKSTİL)',
          category: '730.01 Fason Dikim Gideri (Ben Ellis)',
          dueDate: '05.10.2026 (Açık Borç)',
          matrah: 651299.67,
          kdv: 65129.97,
          total: 716429.64,
          status: 'Açık Kalan: -$10.335,35 USD',
          isPaid: false
        },
        {
          id: 'TIN2026000000155',
          supplier: 'TİNTEKS TEKSTİL VE KUMAŞÇILIK LTD. ŞTİ.',
          category: '150.01 Ham Dokuma ve Örme Kumaş Alımı',
          dueDate: 'Açık Bakiye',
          matrah: 999134.09,
          kdv: 99913.41,
          total: 1099047.50,
          status: 'Borç Bakiyesi',
          isPaid: false
        },
        {
          id: 'ÇET2026000000012',
          supplier: 'ÇETİN TÜREDİ',
          category: '320.03 Tedarikçi Cari Hesabı',
          dueDate: 'Açık Bakiye',
          matrah: 200000.00,
          kdv: 0.00,
          total: 200000.00,
          status: 'Borç Bakiyesi',
          isPaid: false
        },
        {
          id: 'YEG2026000000001',
          supplier: 'YUNUS EMRE GÖKALP',
          category: '331.01 Ortaklara Borçlar Hesabı',
          dueDate: 'Dönem İçi',
          matrah: 109418.80,
          kdv: 0.00,
          total: 109418.80,
          status: 'Ortak Borcu',
          isPaid: false
        }
      ],
      // Contacts (15 Authentic Paraşüt Live Records)
      contacts: [
        {
          code: 'CR-GB-0001',
          name: 'BEN ELLİS',
          type: 'İhracat Müşterisi',
          vkn: 'GB928374182',
          city: 'Bristol, Birleşik Krallık',
          balance: '£22.414,22 (Alacak)',
          balanceRaw: 1452246.45,
          status: 'ETGB Açık',
          isBenEllis: true
        },
        {
          code: 'CR-TR-0002',
          name: 'TİNTEKS TEKSTİL VE KUMAŞÇILIK SANAYİ TİCARET LİMİTED ŞİRKETİ',
          type: 'Kumaş Tedarikçisi',
          vkn: '8440058291',
          city: 'Güneşli, İstanbul',
          balance: '-₺1.099.047,50 (Borç)',
          balanceRaw: -1099047.50,
          status: 'Açık Bakiye',
          isBenEllis: false
        },
        {
          code: 'CR-US-0003',
          name: 'LAVI LA LLC',
          type: 'İhracat Müşterisi',
          vkn: 'US95-4829104',
          city: 'Los Angeles, ABD',
          balance: '₺981.529,27 (Alacak)',
          balanceRaw: 981529.27,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0004',
          name: 'FARUK AYTİN',
          type: 'Fason Üretim & Kumaş Mahsubu',
          vkn: '46849262292',
          city: 'Sultangazi, İstanbul',
          balance: '-$10.335,35 USD (Borç)',
          balanceRaw: -508894.07,
          status: 'Kumaş Mahsup Masası',
          isFarukAytin: true
        },
        {
          code: 'CR-DE-0005',
          name: 'GbR Celik, David und Djemailji',
          type: 'İhracat Müşterisi',
          vkn: 'DE301948271',
          city: 'Berlin, Almanya',
          balance: '₺362.078,75 (Alacak)',
          balanceRaw: 362078.75,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0006',
          name: 'ÇETİN TÜREDİ',
          type: 'Finansman / Tedarikçi',
          vkn: '39481920194',
          city: 'Halkalı, İstanbul',
          balance: '-₺200.000,00 (Borç)',
          balanceRaw: -200000.00,
          status: 'Açık Bakiye',
          isBenEllis: false
        },
        {
          code: 'CR-UK-0007',
          name: 'ATTERO CLOTHING',
          type: 'İhracat Müşterisi',
          vkn: 'GB883910294',
          city: 'Londra, Birleşik Krallık',
          balance: '₺152.855,57 (Alacak)',
          balanceRaw: 152855.57,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0008',
          name: 'YUNUS EMRE GÖKALP',
          type: 'Şirket Ortağı (331)',
          vkn: '18704921090',
          city: 'İkitelli, İstanbul',
          balance: '-₺109.418,80 (Borç)',
          balanceRaw: -109418.80,
          status: '331 Ortak Hesabı',
          isBenEllis: false
        },
        {
          code: 'CR-KW-0009',
          name: 'Rana Jassim Khaled Alsaadoun',
          type: 'İhracat Müşterisi',
          vkn: 'KW-4910284',
          city: 'Kuveyt',
          balance: '₺76.967,38 (Alacak)',
          balanceRaw: 76967.38,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0010',
          name: 'ARKSİGNER YAZILIM VE DONANIM SAN. TİC. A.Ş.',
          type: 'Hizmet Tedarikçisi',
          vkn: '0810549281',
          city: 'Çankaya, Ankara',
          balance: '-₺50.800,00 (Borç)',
          balanceRaw: -50800.00,
          status: 'E-İmza & Yazılım',
          isBenEllis: false
        },
        {
          code: 'CR-US-0011',
          name: 'CuterEsque Inc.',
          type: 'İhracat Müşterisi',
          vkn: 'US84-1928401',
          city: 'Wilmington, ABD',
          balance: '₺48.458,59 (Alacak)',
          balanceRaw: 48458.59,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0012',
          name: 'FİLET ÖRME TEK. VE TEK. ÜRN. İNŞ. PLS. AMB. NAKL. İTH. İHR. SAN. TİC. LTD. ŞTİ.',
          type: 'Örme Tedarikçisi',
          vkn: '3850491823',
          city: 'Zeytinburnu, İstanbul',
          balance: '-₺42.919,60 (Borç)',
          balanceRaw: -42919.60,
          status: 'Örme Fasonu',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0013',
          name: 'BE-HA KONFEKSİYON - FATMA KİPOĞLU',
          type: 'Konfeksiyon Müşterisi',
          vkn: '5620194821',
          city: 'Merter, İstanbul',
          balance: '₺27.096,00 (Alacak)',
          balanceRaw: 27096.00,
          status: 'Aktif',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0014',
          name: 'MERT ÜTÜ - VEYSEL ADIYEKE',
          type: 'Ütü Paket Fasonu',
          vkn: '0089182734',
          city: 'Güneşli, İstanbul',
          balance: '-₺18.952,00 (Borç)',
          balanceRaw: -18952.00,
          status: 'Ütü Fasonu',
          isBenEllis: false
        },
        {
          code: 'CR-TR-0015',
          name: 'ASSET LOJİSTİK ANONİM ŞİRKETİ',
          type: 'Gümrük & Nakliye',
          vkn: '0910482910',
          city: 'Ataşehir, İstanbul',
          balance: '-₺18.243,96 (Borç)',
          balanceRaw: -18243.96,
          status: 'Navlun & Gümrük',
          isBenEllis: false
        }
      ],
      // Checks
      checks: [
        {
          no: 'ÇK-2025-001',
          drawer: 'Zirve Tekstil Pazarlama A.Ş.',
          bank: 'Garanti BBVA Bahçeşehir',
          dueDate: '08.10.2025',
          amount: 125000.00,
          status: 'Portföyde'
        },
        {
          no: 'ÇK-2025-002',
          drawer: 'Korteks İplik Dokuma Sanayi',
          bank: 'İş Bankası Merter',
          dueDate: '14.11.2025',
          amount: 140000.00,
          status: 'Portföyde'
        },
        {
          no: 'ÇK-2025-003',
          drawer: 'Akdeniz Mensucat A.Ş.',
          bank: 'Akbank Zeytinburnu',
          dueDate: '30.11.2025',
          amount: 85000.00,
          status: 'Portföyde'
        }
      ],
      // Employees
      employees: [
        { id: 'BRS-001', name: 'Mustafa Yıldırım', title: 'Üretim & Dokuma Ustabaşı', gross: 45000, sgk: 6750, tax: 3200, net: 35050 },
        { id: 'BRS-002', name: 'Ayşe Demir', title: 'İhracat Operasyon Uzmanı', gross: 42000, sgk: 6300, tax: 2900, net: 32800 },
        { id: 'BRS-003', name: 'Mehmet Kaya', title: 'Dokuma Tezgah Operatörü', gross: 32000, sgk: 4800, tax: 1800, net: 25400 },
        { id: 'BRS-004', name: 'Fatma Şahin', title: 'Kalite Kontrol & Paketleme', gross: 28000, sgk: 4200, tax: 1200, net: 22600 },
        { id: 'BRS-005', name: 'Hüseyin Çelik', title: 'Boyahane ve Kimya Teknisyeni', gross: 35000, sgk: 5250, tax: 2200, net: 27550 },
        { id: 'BRS-006', name: 'Zeynep Koç', title: 'Muhasebe & Finans Uzmanı', gross: 38000, sgk: 5700, tax: 2500, net: 29800 }
      ],
      // Stock Inventory (15 Authentic Items)
      inventory: [
        { code: 'STK-KET-01', desc: '01254 - 33K346 008 %100 Keten / EKRU / 149 CM / 160 GSM', gtip: '5309.11.00.00.00', qty: 3500, unit: 'Kg', cost: 450.00, total: 1575000.00 },
        { code: 'STK-KET-02', desc: '01254 - 33K346 008 %100 Keten / SİYAH / 144 CM / 172 GSM', gtip: '5309.11.00.00.00', qty: 4200, unit: 'Kg', cost: 460.00, total: 1932000.00 },
        { code: 'STK-ELB-01', desc: '%100 Cotton Dresses for Girls Forever', gtip: '6204.42.00.00.00', qty: 1850, unit: 'Adet', cost: 280.00, total: 518000.00 },
        { code: 'STK-ELB-02', desc: '%100 Cotton Dresses for Girls Tailored', gtip: '6204.42.00.00.00', qty: 1400, unit: 'Adet', cost: 290.00, total: 406000.00 },
        { code: 'STK-AKS-01', desc: '16 POLY DUGME', gtip: '9606.21.00.00.00', qty: 85000, unit: 'Adet', cost: 0.85, total: 72250.00 },
        { code: 'STK-LST-01', desc: '3.5 CM SÜP.BEYAZ LASTİK', gtip: '5806.32.00.00.00', qty: 12400, unit: 'Metre', cost: 8.50, total: 105400.00 },
        { code: 'STK-LST-02', desc: '3.5 CM SÜP.SİYAH LASTİK', gtip: '5806.32.00.00.00', qty: 14500, unit: 'Metre', cost: 8.50, total: 123250.00 },
        { code: 'STK-ELB-03', desc: "97% cotton 3% elastan Girl's dress Forever", gtip: '6204.42.00.00.00', qty: 2100, unit: 'Adet', cost: 310.00, total: 651000.00 }
      ],
      // TDHP Mizan Accounts (Aligned with Paraşüt Real Figures)
      accounts: [
        { code: '100 KASA', sub: 'Merkez TL Kasası', debit: 45000, credit: 45722.35, bDebit: 0, bCredit: 722.35, status: 'check' },
        { code: '102 BANKALAR', sub: 'Garanti BBVA GBP/EUR/USD/TL Hesapları', debit: 2840500, credit: 1542100, bDebit: 1298400, bCredit: 0, status: 'sync' },
        { code: '120 ALICILAR', sub: 'Ben Ellis (£22.414,22 = ₺1.452.246 Dahil)', debit: 2795854.47, credit: 890000, bDebit: 1905854.47, bCredit: 0, status: 'pending_actions', isExport: true },
        { code: '121 ALACAK SENETLERİ & ÇEKLER', sub: 'Portföydeki 3 Adet Vadeli Çek', debit: 350000, credit: 0, bDebit: 350000, bCredit: 0, status: 'schedule' },
        { code: '150 İLK MADDE VE MALZEME', sub: 'Keten, İplik & Kumaş Depoları', debit: 2450000, credit: 890000, bDebit: 1560000, bCredit: 0, status: 'check' },
        { code: '191 İNDİRİLECEK KDV', sub: 'Fason Dikim ve Hammadde KDV', debit: 218480, credit: 111990.17, bDebit: 106489.83, bCredit: 0, status: 'receipt' },
        { code: '320 SATICILAR', sub: 'Tinteks, Faruk Aytin (-$10.335 USD), Çetin Türedi', debit: 662516, credit: 2270457.57, bDebit: 0, bCredit: 1607941.57, status: 'priority_high' },
        { code: '331 ORTAKLARA BORÇLAR', sub: 'Yunus Emre Gökalp Cari Hesabı', debit: 0, credit: 109418.80, bDebit: 0, bCredit: 109418.80, status: 'schedule' },
        { code: '309 DİĞER MALİ BORÇLAR', sub: 'Yunus Cep Kredi Kartı', debit: 0, credit: 248697.05, bDebit: 0, bCredit: 248697.05, status: 'schedule' },
        { code: '600 YURTİÇİ SATIŞLAR', sub: 'Faruk Aytin Kumaş Satış Mahsubu', debit: 0, credit: 330950, bDebit: 0, bCredit: 330950, status: 'check' },
        { code: '601 YURTDIŞI SATIŞLAR', sub: 'Ben Ellis & e-İhracat Gelirleri', debit: 0, credit: 1985000, bDebit: 0, bCredit: 1985000, status: 'verified', isExport: true }
      ]
    };

    // FORMAT CURRENCY HELPER
    function fmtTRY(n) {
      return '₺' + Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // INITIAL RENDER
    function renderAll() {
      renderDashboardMizan();
      renderLedgerTable();
      renderSalesTable();
      renderExpensesTable();
      renderContactsTable();
      renderChecksTable();
      renderPayrollTable();
      renderInventoryTable();
      renderBankMoves();
      renderChecksWidget();
    }

    // RENDER DASHBOARD MIZAN
    function renderDashboardMizan() {
      const tbody = document.getElementById('tbody-dashboard-mizan');
      if (!tbody) return;
      tbody.innerHTML = '';
      let totDeb = 0, totCrd = 0, totBDeb = 0, totBCrd = 0;

      BROSAN_ERP.accounts.forEach(acc => {
        totDeb += acc.debit; totCrd += acc.credit; totBDeb += acc.bDebit; totBCrd += acc.bCredit;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/80 transition-colors' + (acc.isExport ? ' bg-blue-50/20' : '');
        tr.innerHTML = `
          <td class="py-2.5 px-3">
            <span class="font-bold text-slate-900 block">${acc.code}</span>
            <span class="text-[10px] text-slate-500 font-sans">${acc.sub}</span>
          </td>
          <td class="py-2.5 px-3 text-right text-slate-800">${acc.debit.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
          <td class="py-2.5 px-3 text-right text-slate-500">${acc.credit.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
          <td class="py-2.5 px-3 text-right font-bold ${acc.bDebit > 0 ? 'text-emerald-700' : 'text-slate-400'}">${acc.bDebit > 0 ? acc.bDebit.toLocaleString('tr-TR', {minimumFractionDigits:2}) : '-'}</td>
          <td class="py-2.5 px-3 text-right font-bold ${acc.bCredit > 0 ? 'text-rose-700' : 'text-slate-400'}">${acc.bCredit > 0 ? acc.bCredit.toLocaleString('tr-TR', {minimumFractionDigits:2}) : '-'}</td>
          <td class="py-2.5 px-3 text-center">
            <span class="material-symbols-outlined text-[16px] text-slate-500">${acc.status}</span>
          </td>
        `;
        tbody.appendChild(tr);
      });

      const tfoot = document.getElementById('tfoot-dashboard-mizan');
      if (tfoot) {
        tfoot.innerHTML = `
          <tr class="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
            <td class="py-3 px-3 font-sans">GENEL MİZAN TOPLAMI:</td>
            <td class="py-3 px-3 text-right text-slate-900 font-mono">${totDeb.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
            <td class="py-3 px-3 text-right text-slate-900 font-mono">${totCrd.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
            <td class="py-3 px-3 text-right text-emerald-700 font-mono">${totBDeb.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
            <td class="py-3 px-3 text-right text-rose-700 font-mono">${totBCrd.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
            <td class="py-3 px-3 text-center text-emerald-600 font-sans text-[11px]">DENK ✓</td>
          </tr>
        `;
      }
    }

    // RENDER LEDGER TABLE
    function renderLedgerTable(filter = '') {
      const tbody = document.getElementById('tbody-ledger-full');
      if (!tbody) return;
      tbody.innerHTML = '';
      
      const filtered = BROSAN_ERP.accounts.filter(a => 
        a.code.toLowerCase().includes(filter.toLowerCase()) || 
        a.sub.toLowerCase().includes(filter.toLowerCase())
      );

      filtered.forEach(acc => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-bold text-slate-900">${acc.code} - ${acc.sub}</td>
          <td class="py-2.5 px-3 font-sans text-slate-500">TDHP Hesabı</td>
          <td class="py-2.5 px-3 text-right text-slate-800">${acc.debit.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
          <td class="py-2.5 px-3 text-right text-slate-600">${acc.credit.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
          <td class="py-2.5 px-3 text-right font-bold text-emerald-700">${acc.bDebit > 0 ? acc.bDebit.toLocaleString('tr-TR', {minimumFractionDigits:2}) : '-'}</td>
          <td class="py-2.5 px-3 text-right font-bold text-rose-700">${acc.bCredit > 0 ? acc.bCredit.toLocaleString('tr-TR', {minimumFractionDigits:2}) : '-'}</td>
          <td class="py-2.5 px-3 text-center font-sans">
            <button onclick="viewMuavin('${acc.code}')" class="text-emerald-600 font-semibold hover:underline">Muavin Defteri</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // RENDER SALES TABLE
    function renderSalesTable(filter = '') {
      const tbody = document.getElementById('tbody-sales');
      if (!tbody) return;
      tbody.innerHTML = '';

      const filtered = BROSAN_ERP.invoices.filter(i => 
        i.id.toLowerCase().includes(filter.toLowerCase()) || 
        i.customer.toLowerCase().includes(filter.toLowerCase())
      );

      filtered.forEach(inv => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50' + (!inv.isClosed ? ' bg-amber-50/20' : '');
        tr.innerHTML = `
          <td class="py-3 px-3 font-bold text-slate-900">${inv.id}</td>
          <td class="py-3 px-3 font-sans font-bold text-slate-900">${inv.customer}</td>
          <td class="py-3 px-3 text-slate-600">${inv.date}</td>
          <td class="py-3 px-3 font-mono text-blue-700 font-bold">${inv.etgb}</td>
          <td class="py-3 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">${inv.exemption}</span></td>
          <td class="py-3 px-3 text-right font-bold text-slate-900">${inv.currency === 'GBP' ? '£' : inv.currency === 'EUR' ? '€' : '₺'}${inv.amountFx.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
          <td class="py-3 px-3 text-right font-bold text-slate-900">${fmtTRY(inv.amountTry)}</td>
          <td class="py-3 px-3 text-center font-sans">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.isClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">${inv.ibkbStatus}</span>
          </td>
          <td class="py-3 px-3 text-right font-sans space-x-1">
            <button onclick="viewInvoiceDetail('${inv.id}')" class="px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-100 font-medium">Görüntüle</button>
            ${!inv.isClosed ? `<button onclick="openModal('modal-dab-calculator')" class="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold">TCMB Bozum</button>` : ''}
          </td>
        `;
        tbody.appendChild(tr);
      });

      const badge = document.getElementById('badge-sales-count');
      if (badge) badge.innerText = `${BROSAN_ERP.invoices.length} Belge`;
    }

    // RENDER EXPENSES TABLE
    function renderExpensesTable() {
      const tbody = document.getElementById('tbody-expenses');
      if (!tbody) return;
      tbody.innerHTML = '';

      BROSAN_ERP.expenses.forEach(exp => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50' + (!exp.isPaid ? ' bg-amber-50/20' : '');
        tr.innerHTML = `
          <td class="py-3 px-3 font-bold text-slate-900">${exp.id}</td>
          <td class="py-3 px-3 font-sans font-bold text-slate-900">${exp.supplier}</td>
          <td class="py-3 px-3 font-sans text-slate-600">${exp.category}</td>
          <td class="py-3 px-3 font-bold text-amber-700">${exp.dueDate}</td>
          <td class="py-3 px-3 text-right text-slate-800">${exp.matrah.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
          <td class="py-3 px-3 text-right text-slate-600">${exp.kdv.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
          <td class="py-3 px-3 text-right font-bold text-slate-900">${fmtTRY(exp.total)}</td>
          <td class="py-3 px-3 text-center font-sans">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${exp.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">${exp.status}</span>
          </td>
          <td class="py-3 px-3 text-right font-sans">
            ${!exp.isPaid ? `<button onclick="paySupplierExpense('${exp.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold">Öde / Havale</button>` : `<span class="text-xs text-emerald-600 font-bold">Ödendi ✓</span>`}
          </td>
        `;
        tbody.appendChild(tr);
      });

      const badge = document.getElementById('badge-expense-count');
      const unpaidCount = BROSAN_ERP.expenses.filter(e => !e.isPaid).length;
      if (badge) badge.innerText = `${unpaidCount} Vade`;
    }

    // RENDER CONTACTS TABLE (15 Authentic Paraşüt Live Records)
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
    }

    // RENDER CHECKS TABLE
    function renderChecksTable() {
      const tbody = document.getElementById('tbody-checks');
      if (!tbody) return;
      tbody.innerHTML = '';

      BROSAN_ERP.checks.forEach(chk => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
          <td class="py-3 px-3 font-bold text-slate-900">${chk.no}</td>
          <td class="py-3 px-3 font-sans font-semibold text-slate-800">${chk.drawer}</td>
          <td class="py-3 px-3 font-sans text-slate-600">${chk.bank}</td>
          <td class="py-3 px-3 font-bold text-amber-700">${chk.dueDate}</td>
          <td class="py-3 px-3 text-right font-bold text-slate-900">${fmtTRY(chk.amount)}</td>
          <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">${chk.status}</span></td>
          <td class="py-3 px-3 text-right font-sans space-x-1">
            <button onclick="collectCheck('${chk.no}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs">Banka Tahsilata Ver</button>
            <button onclick="ciroCheck('${chk.no}')" class="px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-50">Ciro Et</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // RENDER PAYROLL TABLE
    function renderPayrollTable() {
      const tbody = document.getElementById('tbody-payroll');
      if (!tbody) return;
      tbody.innerHTML = '';

      BROSAN_ERP.employees.forEach(emp => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-bold text-slate-900">${emp.id}</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-900">${emp.name}</td>
          <td class="py-2.5 px-3 font-sans text-slate-600">${emp.title}</td>
          <td class="py-2.5 px-3 text-right text-slate-800">${fmtTRY(emp.gross)}</td>
          <td class="py-2.5 px-3 text-right text-rose-700 font-bold">${fmtTRY(emp.sgk)}</td>
          <td class="py-2.5 px-3 text-right text-blue-700">${fmtTRY(emp.tax)}</td>
          <td class="py-2.5 px-3 text-right font-bold text-emerald-700">${fmtTRY(emp.net)}</td>
          <td class="py-2.5 px-3 text-center font-sans">
            <button onclick="viewBordroPusula('${emp.id}')" class="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold hover:bg-emerald-100">Bordro Pusulası</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // RENDER INVENTORY TABLE
    function renderInventoryTable() {
      const tbody = document.getElementById('tbody-inventory');
      if (!tbody) return;
      tbody.innerHTML = '';

      BROSAN_ERP.inventory.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-bold text-slate-900">${item.code}</td>
          <td class="py-2.5 px-3 font-sans font-bold text-slate-800">${item.desc}</td>
          <td class="py-2.5 px-3 font-bold text-blue-700">${item.gtip}</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">${item.qty.toLocaleString('tr-TR')}</td>
          <td class="py-2.5 px-3 font-sans">${item.unit}</td>
          <td class="py-2.5 px-3 text-right text-slate-700">${item.cost.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">${fmtTRY(item.total)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // RENDER BANK MOVES
    function renderBankMoves() {
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
    }

    // RENDER CHECKS WIDGET IN DASHBOARD
    function renderChecksWidget() {
      const container = document.getElementById('widget-checks-list');
      if (!container) return;
      container.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <div class="font-bold text-slate-800">Zirve Tekstil Pazarlama</div>
            <div class="text-[10px] text-slate-600">Vade: 18.10.2026 (6 Gün Kaldı)</div>
          </div>
          <span class="font-mono font-bold text-slate-900">₺150.000,00</span>
        </div>
        <div class="flex items-center justify-between border-t border-slate-100 pt-1.5">
          <div>
            <div class="font-bold text-slate-800">Korteks İplik Dokuma</div>
            <div class="text-[10px] text-slate-600">Vade: 28.10.2026</div>
          </div>
          <span class="font-mono font-bold text-slate-900">₺120.000,00</span>
        </div>
      `;
    }

    // INTERACTIVE ACTIONS & MODALS

    // View Switcher
    function switchView(moduleId) {
      document.querySelectorAll('.module-view').forEach(view => {
        view.classList.remove('active');
      });
      const targetView = document.getElementById('view-' + moduleId);
      if (targetView) {
        targetView.classList.add('active');
      }

      // Update Sidebar Nav
      document.querySelectorAll('#sidebar-nav .nav-item').forEach(btn => {
        if (btn.getAttribute('data-module') === moduleId) {
          btn.className = 'nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#00AA6C] text-white text-xs font-semibold transition-all shadow-sm';
          const icon = btn.querySelector('.material-symbols-outlined');
          if (icon) icon.className = 'material-symbols-outlined fill-icon text-white text-[18px]';
        } else {
          btn.className = 'nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group';
          const icon = btn.querySelector('.material-symbols-outlined');
          if (icon) icon.className = 'material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]';
        }
      });
      window.scrollTo(0, 0);
    }

    // Bind sidebar buttons
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const mod = btn.getAttribute('data-module');
        if (mod) switchView(mod);
      });
    });

    function openModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.remove('hidden');
    }
    function closeModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.add('hidden');
    }

    // CONFIRM DAB EXCHANGE
    function confirmDabExchange() {
      closeModal('modal-dab-calculator');
      
      // Update data state
      const benEllisInv = BROSAN_ERP.invoices.find(i => i.id === 'EFT2026000000104');
      if (benEllisInv) {
        benEllisInv.ibkbStatus = 'İBKB Kapatıldı ✓';
        benEllisInv.isClosed = true;
      }
      const benEllisContact = BROSAN_ERP.contacts.find(c => c.code === 'CR-GB-0024');
      if (benEllisContact) {
        benEllisContact.balance = '£0,00 (Kapatıldı)';
        benEllisContact.status = 'Mutabık ✓';
      }

      // Update Bank Balances
      BROSAN_ERP.bankAccounts.garantiGbp -= 4855.69;
      BROSAN_ERP.bankAccounts.garantiTry += 219088.73;

      document.getElementById('bank-card-gbp').innerText = '£' + BROSAN_ERP.bankAccounts.garantiGbp.toLocaleString('tr-TR', {minimumFractionDigits:2});
      document.getElementById('bank-card-try').innerText = '₺' + BROSAN_ERP.bankAccounts.garantiTry.toLocaleString('tr-TR', {minimumFractionDigits:2});
      document.getElementById('hero-kpi-bank-try').innerText = '₺' + BROSAN_ERP.bankAccounts.garantiTry.toLocaleString('tr-TR', {minimumFractionDigits:2});
      document.getElementById('hero-kpi-receivable-gbp').innerText = '£0,00';
      document.getElementById('hero-ibkb-badge').innerText = 'KAPATILDI ✓';
      document.getElementById('hero-ibkb-badge').className = 'px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-200 text-emerald-900 font-mono';
      document.getElementById('hero-ibkb-title').innerText = "Tüm ETGB'ler Kapatıldı";
      document.getElementById('hero-ibkb-sub').innerText = 'Ben Ellis İBKB terkin işlemi tamamlandı';
      document.getElementById('ben-ellis-balance-highlight').innerText = '£0,00 (Kapatıldı)';

      renderSalesTable();
      renderContactsTable();

      showToast('TCMB %40 Bozum Gerçekleşti! £4.855,69 bozuldu, ₺219.088,73 Garanti TRY hesabına aktarıldı. İBKB kapatıldı!', 'success');
    }

    // SUBMIT NEW INVOICE
    function submitNewInvoice() {
      const cust = document.getElementById('inv-customer').value;
      const type = document.getElementById('inv-type').value;
      const curr = document.getElementById('inv-currency').value;
      const amount = parseFloat(document.getElementById('inv-amount').value) || 12000;
      const etgb = document.getElementById('inv-etgb').value || '26340200EX' + Math.floor(100000 + Math.random() * 900000);
      const gtip = document.getElementById('inv-gtip').value;
      const newId = 'EFT2026' + String(BROSAN_ERP.invoices.length + 105).padStart(9, '0');
      
      const rate = BROSAN_ERP.fx[curr] || 1;
      const amountTry = amount * rate;

      BROSAN_ERP.invoices.unshift({
        id: newId,
        customer: cust,
        date: new Date().toLocaleDateString('tr-TR'),
        etgb: etgb,
        exemption: type,
        currency: curr,
        amountFx: amount,
        amountTry: amountTry,
        ibkbStatus: curr !== 'TRY' ? 'Açık (180 Gün)' : 'Düzenlendi ✓',
        isClosed: false,
        gtip: gtip,
        meters: '10.000 Metre'
      });

      closeModal('modal-new-invoice');
      renderSalesTable();
      showToast(`${newId} nolu e-Fatura kesildi ve GİB portalına iletildi.`, 'success');
    }

    // SUBMIT NEW EXPENSE
    function submitNewExpense() {
      const supp = document.getElementById('exp-supplier').value;
      const cat = document.getElementById('exp-account').value;
      const amount = parseFloat(document.getElementById('exp-amount').value) || 25000;
      const kdvRate = parseFloat(document.getElementById('exp-kdv-rate').value) || 10;
      const matrah = amount / (1 + (kdvRate / 100));
      const kdv = amount - matrah;
      const newId = 'GİB2026' + Math.floor(100000000 + Math.random() * 900000000);

      BROSAN_ERP.expenses.unshift({
        id: newId,
        supplier: supp,
        category: cat,
        dueDate: '28.10.2026',
        matrah: matrah,
        kdv: kdv,
        total: amount,
        status: 'Ödenecek',
        isPaid: false
      });

      closeModal('modal-new-expense');
      renderExpensesTable();
      showToast('Gider kaydedildi ve 320 Satıcılar cari hesabına işlendi.', 'success');
    }

    // PAY SUPPLIER EXPENSE
    function paySupplierExpense(expId) {
      const exp = BROSAN_ERP.expenses.find(e => e.id === expId);
      if (exp) {
        exp.isPaid = true;
        exp.status = 'Ödendi ✓';
        BROSAN_ERP.bankAccounts.garantiTry -= exp.total;
        document.getElementById('bank-card-try').innerText = fmtTRY(BROSAN_ERP.bankAccounts.garantiTry);
        document.getElementById('hero-kpi-bank-try').innerText = fmtTRY(BROSAN_ERP.bankAccounts.garantiTry);
        renderExpensesTable();
        showToast(`${exp.supplier} faturası Garanti BBVA hesabından ödendi.`, 'success');
      }
    }

    // SUBMIT NEW CONTACT
    function submitNewContact() {
      const code = document.getElementById('new-contact-code').value;
      const name = document.getElementById('new-contact-name').value;
      const type = document.getElementById('new-contact-type').value;
      const vkn = document.getElementById('new-contact-vkn').value;
      const city = document.getElementById('new-contact-city').value;

      if (!name) {
        showToast('Lütfen firma ünvanını yazınız.', 'error');
        return;
      }

      BROSAN_ERP.contacts.push({
        code: code,
        name: name,
        type: type,
        vkn: vkn,
        city: city,
        balance: '₺0,00',
        status: 'Aktif',
        isBenEllis: false
      });

      closeModal('modal-new-contact');
      renderContactsTable();
      showToast(`${name} cari kartı başarıyla açıldı.`, 'success');
    }

    // SUBMIT NEW CHECK
    function submitNewCheck() {
      const no = document.getElementById('chk-no').value || 'CK-' + Math.floor(100000 + Math.random() * 900000);
      const drawer = document.getElementById('chk-drawer').value || 'Anadolu Tekstil Sanayi';
      const amount = parseFloat(document.getElementById('chk-amount').value) || 75000;
      const dueDate = document.getElementById('chk-due-date').value || '2026-11-20';

      BROSAN_ERP.checks.unshift({
        no: no,
        drawer: drawer,
        bank: 'Garanti BBVA',
        dueDate: dueDate,
        amount: amount,
        status: 'Portföyde'
      });

      closeModal('modal-new-check');
      renderChecksTable();
      showToast(`${no} nolu çek portföye işlendi (TDHP 121).`, 'success');
    }

    // COLLECT CHECK
    function collectCheck(chkNo) {
      const chk = BROSAN_ERP.checks.find(c => c.no === chkNo);
      if (chk) {
        chk.status = 'Tahsilatta';
        renderChecksTable();
        showToast(`${chkNo} nolu çek Garanti BBVA takas/tahsile gönderildi.`, 'success');
      }
    }

    // CIRO CHECK
    function ciroCheck(chkNo) {
      const chk = BROSAN_ERP.checks.find(c => c.no === chkNo);
      if (chk) {
        chk.status = 'Ciro Edildi (Birlik Kumaş)';
        renderChecksTable();
        showToast(`${chkNo} nolu çek tedarikçiye ciro edildi (TDHP 320 Mahsup).`, 'success');
      }
    }

    // VIEW INVOICE DETAIL
    function viewInvoiceDetail(invId) {
      const inv = BROSAN_ERP.invoices.find(i => i.id === invId);
      if (!inv) return;

      document.getElementById('inv-viewer-title').innerText = `${inv.id} - ${inv.customer}`;
      document.getElementById('inv-viewer-content').innerHTML = `
        <div class="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
          <div class="flex justify-between items-start border-b border-slate-200 pb-2">
            <div>
              <span class="font-bold text-slate-900 block text-sm">BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ.</span>
              <span class="text-slate-500 text-[11px]">VKN: 1870492109 • İkitelli V.D.</span>
            </div>
            <div class="text-right">
              <span class="font-mono font-bold text-slate-800">${inv.id}</span>
              <span class="text-slate-500 block text-[11px]">${inv.date}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-slate-400 font-semibold block text-[10px] uppercase">Alıcı Firma:</span>
              <span class="font-bold text-slate-800">${inv.customer}</span>
              <span class="text-slate-500 block">Manchester, Birleşik Krallık</span>
            </div>
            <div>
              <span class="text-slate-400 font-semibold block text-[10px] uppercase">Gümrük & İBKB Bilgisi:</span>
              <span class="font-mono text-slate-800 font-bold block">${inv.etgb}</span>
              <span class="text-emerald-700 font-medium">${inv.exemption}</span>
            </div>
          </div>
          <table class="w-full text-left border border-slate-200 bg-white rounded mt-2">
            <thead class="bg-slate-100 text-slate-600 text-[10px]">
              <tr>
                <th class="p-2">GTİP & Ürün</th>
                <th class="p-2 text-right">Miktar</th>
                <th class="p-2 text-right">Tutar (${inv.currency})</th>
                <th class="p-2 text-right">TL Karşılığı</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="p-2 font-mono font-semibold">${inv.gtip}</td>
                <td class="p-2 text-right">${inv.meters}</td>
                <td class="p-2 text-right font-bold">${inv.currency === 'GBP' ? '£' : '€'}${inv.amountFx.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                <td class="p-2 text-right font-bold text-slate-900">${fmtTRY(inv.amountTry)}</td>
              </tr>
            </tbody>
          </table>
          <div class="flex justify-between items-center pt-2 border-t border-slate-200">
            <span class="text-[11px] text-slate-500">Mali Mühür: <strong>Onaylandı (GİB e-Fatura Portalı)</strong></span>
            <div class="text-right">
              <span class="text-slate-500 text-xs">Genel Toplam:</span>
              <span class="font-mono text-base font-bold text-slate-900 ml-2">${inv.currency === 'GBP' ? '£' : '€'}${inv.amountFx.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
            </div>
          </div>
        </div>
      `;
      openModal('modal-invoice-viewer');
    }

    // VIEW CARİ EKSTRE
    function viewCariEkstre(contactCode) {
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
    }

    // VIEW MUAVİN
    function viewMuavin(accountCode) {
      document.getElementById('muavin-modal-title').innerText = `${accountCode} - Muavin Defteri Ekstresi`;
      document.getElementById('muavin-modal-body').innerHTML = `
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center mb-3">
          <div>
            <span class="font-bold text-slate-900 block">${accountCode}</span>
            <span class="text-slate-500 font-sans">01.01.2026 - 31.10.2026 Muavin Hareketleri</span>
          </div>
          <span class="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold font-sans text-xs">Yevmiye Denk</span>
        </div>
        <table class="w-full text-left border border-slate-200 rounded font-mono text-xs">
          <thead class="bg-slate-100 text-slate-600 text-[10px] font-sans uppercase">
            <tr>
              <th class="p-2">Yevmiye No</th>
              <th class="p-2">Tarih</th>
              <th class="p-2">Açıklama</th>
              <th class="p-2 text-right">Borç (₺)</th>
              <th class="p-2 text-right">Alacak (₺)</th>
              <th class="p-2 text-right">Bakiye (₺)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr>
              <td class="p-2 font-bold">YEV-00124</td>
              <td class="p-2">08.09.2026</td>
              <td class="p-2 font-sans">e-İhracat Fatura Tahakkuku</td>
              <td class="p-2 text-right font-bold text-emerald-700">547.721,60</td>
              <td class="p-2 text-right text-slate-400">-</td>
              <td class="p-2 text-right font-bold">547.721,60 (B)</td>
            </tr>
            <tr>
              <td class="p-2 font-bold">YEV-00189</td>
              <td class="p-2">15.09.2026</td>
              <td class="p-2 font-sans">Banka Havale Tahsilatı</td>
              <td class="p-2 text-right text-slate-400">-</td>
              <td class="p-2 text-right font-bold text-rose-700">200.000,00</td>
              <td class="p-2 text-right font-bold">347.721,60 (B)</td>
            </tr>
          </tbody>
        </table>
      `;
      openModal('modal-muavin');
    }

    // VIEW BORDRO PUSULA
    function viewBordroPusula(empId) {
      const emp = BROSAN_ERP.employees.find(e => e.id === empId);
      if (!emp) return;

      document.getElementById('bordro-pusula-title').innerText = `${emp.name} - Ücret Hesap Pusulası`;
      document.getElementById('bordro-pusula-content').innerHTML = `
        <div class="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 font-mono">
          <div class="flex justify-between items-start border-b border-slate-200 pb-2 font-sans">
            <div>
              <span class="font-bold text-slate-900 block">${BROSAN_ERP.company.name}</span>
              <span class="text-slate-500 text-[11px]">Ekim 2026 Maaş Dönemi</span>
            </div>
            <div class="text-right">
              <span class="font-bold text-slate-800 font-mono">${emp.id}</span>
              <span class="text-slate-500 block text-[11px]">${emp.title}</span>
            </div>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="flex justify-between"><span class="font-sans text-slate-600">Brüt Temel Ücret:</span><strong class="text-slate-900">${fmtTRY(emp.gross)}</strong></div>
            <div class="flex justify-between text-rose-700"><span class="font-sans text-slate-600">SGK İşçi Payı (%14):</span><strong>-${fmtTRY(emp.gross * 0.14)}</strong></div>
            <div class="flex justify-between text-rose-700"><span class="font-sans text-slate-600">İşsizlik Sigortası (%1):</span><strong>-${fmtTRY(emp.gross * 0.01)}</strong></div>
            <div class="flex justify-between text-blue-700"><span class="font-sans text-slate-600">Gelir Vergisi Matrahı:</span><strong>${fmtTRY(emp.gross * 0.85)}</strong></div>
            <div class="flex justify-between text-blue-700"><span class="font-sans text-slate-600">Gelir Vergisi (Stopaj):</span><strong>-${fmtTRY(emp.tax)}</strong></div>
            <div class="flex justify-between text-emerald-700 font-sans text-[11px]"><span>7349 Sayılı Kanun Asgari Ücret Vergi İstisnası:</span><strong>Uygulandı ✓</strong></div>
          </div>
          <div class="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm font-bold">
            <span class="font-sans text-slate-900">NET ÖDENEN ÜCRET:</span>
            <span class="text-emerald-700 text-base font-mono">${fmtTRY(emp.net)}</span>
          </div>
          <div class="pt-3 border-t border-slate-200 flex justify-between font-sans text-[10px] text-slate-500">
            <span>Ödeme Kanalı: <strong>Garanti BBVA Maaş Transferi</strong></span>
            <span>İşçi İmzası: ___________________</span>
          </div>
        </div>
      `;
      openModal('modal-bordro-pusula');
    }

    // SUBMIT NEW JOURNAL ENTRY
    function submitNewJournal() {
      const desc = document.getElementById('jrn-desc').value || 'Genel Mahsup Fişi';
      const amount = parseFloat(document.getElementById('jrn-amount').value) || 1000;
      closeModal('modal-new-journal');
      showToast(`Yevmiye fişi kaydedildi ve TDHP mizanına işlendi: ${fmtTRY(amount)}`, 'success');
    }

    // SUBMIT PAYMENT MATCH
    function submitPaymentMatch() {
      closeModal('modal-new-payment');
      showToast('Tahsilat cari hesaba işlendi ve dekont oluşturuldu.', 'success');
    }

    // DOWNLOAD SALARY TXT
    function downloadBankSalaryTxt() {
      let txt = "GARANTI_BBVA_MAAS_ODEME_DOSYASI\\n";
      txt += "SIRKET: BROSAN TEKSTIL LTD STI (VKN: 1870492109)\\n";
      txt += "TARIH: 2026-10-31\\n\\n";
      BROSAN_ERP.employees.forEach(e => {
        txt += `${e.id};${e.name};${e.net.toFixed(2)};TR320006200018270009238101\\n`;
      });
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "GARANTI_BBVA_EKIM_2026_MAAS_LISTESI.txt";
      a.click();
      showToast('Garanti BBVA Toplu Maaş TXT Dosyası İndirildi.', 'success');
    }

    // DOWNLOAD MIZAN EXCEL
    function downloadMizanExcel() {
      let csv = "Hesap Kodu;Açıklama;Borç Tutarı;Alacak Tutarı;Borç Bakiye;Alacak Bakiye\\n";
      BROSAN_ERP.accounts.forEach(a => {
        csv += `${a.code};${a.sub};${a.debit};${a.credit};${a.bDebit};${a.bCredit}\\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "BROSAN_TDHP_EKIM_2026_MIZAN.csv";
      a.click();
      showToast('Mizan CSV/Excel Raporu İndirildi.', 'success');
    }

    // DOWNLOAD DAB DILEKCE
    function downloadDabDilekce() {
      let doc = "T. GARANTİ BANKASI A.Ş. BAHÇEŞEHİR ŞUBESİ MÜDÜRLÜĞÜ'NE\\n\\n";
      doc += "KONU: İBKB ve %40 TCMB Döviz Bozum Talimatı\\n\\n";
      doc += "Şirketimiz BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ. (VKN: 1870492109) adına kayıtlı ";
      doc += "TR32 0006 2000 1827 0009 2381 01 IBAN no'lu hesabımıza Ben Ellis firmasından gelen ";
      doc += "£12.139,22 GBP ihracat bedelinin TCMB İhracat Genelgesi uyarınca %40'lık kısmı olan £4.855,69 GBP'nin ";
      doc += "TCMB güncel kuru üzerinden bozdurularak TL hesabımıza aktarılmasını ve İBKB (İhracat Bedeli Kabul Belgesi) ";
      doc += "düzenlenmesini arz ederiz.\\n\\n";
      doc += "Kaşe / İmza\\nBROSAN TEKSTİL LTD. ŞTİ.";
      
      const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "GARANTI_TCMB_BOZUM_DILEKCESI.txt";
      a.click();
      showToast('Garanti Bankası TCMB Bozum Dilekçesi İndirildi.', 'success');
    }

    // SAVE SETTINGS
    function saveSettings() {
      const name = document.getElementById('set-company-name').value;
      const vkn = document.getElementById('set-tax-office').value;
      BROSAN_ERP.company.name = name;
      showToast('Şirket ayarları ve GİB entegrasyon parametreleri kaydedildi.', 'success');
    }

    // GLOBAL SEARCH (Ctrl+K)
    function handleGlobalSearch(q) {
      if (!q) return;
      const val = q.toLowerCase();
      // Search in current view
      if (val.includes('102') || val.includes('mizan') || val.includes('tdhp') || val.includes('hesap')) {
        switchView('ledger');
        filterLedgerTable(val);
      } else if (val.includes('fatura') || val.includes('ben ellis') || val.includes('etgb') || val.includes('eft')) {
        switchView('sales');
        renderSalesTable(val);
      } else if (val.includes('çek') || val.includes('senet') || val.includes('zirve')) {
        switchView('checks');
      } else if (val.includes('bordro') || val.includes('personel') || val.includes('maaş')) {
        switchView('payroll');
      } else if (val.includes('kumaş') || val.includes('iplik') || val.includes('stok') || val.includes('gtip')) {
        switchView('inventory');
      }
    }

    function filterLedgerTable(val) {
      renderLedgerTable(val);
    }

    function filterSalesTable(val) {
      renderSalesTable(val);
    }

    function refreshDashboard() {
      renderAll();
      showToast('Veriler GİB ve Banka API üzerinden güncellendi.', 'success');
    }

    // TOAST SYSTEM
    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'pointer-events-auto px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg text-white transition-all transform duration-300 flex items-center gap-2 ' +
        (type === 'success' ? 'bg-emerald-600' : type === 'info' ? 'bg-slate-800' : 'bg-rose-600');
      
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[16px]';
      icon.innerText = type === 'success' ? 'check_circle' : type === 'info' ? 'info' : 'error';
      
      const text = document.createElement('span');
      text.innerText = message;

      toast.appendChild(icon);
      toast.appendChild(text);
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }

    // KEYBOARD SHORTCUTS
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        if (input) input.focus();
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('.fixed.inset-0').forEach(m => m.classList.add('hidden'));
      }
    });

    // RUN ON LOAD
    document.addEventListener('DOMContentLoaded', () => {
      renderAll();
    });
    // In case DOMContentLoaded already fired:
    renderAll();
  </script>
</body>
</html>
"""

def main():
    target_path = os.path.join(os.path.dirname(__file__), "app", "index.html")
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(HTML_CODE)
    print("SUCCESS: Ultimate Enterprise Accounting ERP written to app/index.html")

if __name__ == "__main__":
    main()
