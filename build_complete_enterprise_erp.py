# -*- coding: utf-8 -*-
"""
BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ.
Tam Teşekküllü Ön & Genel Muhasebe ERP Sistemi
Tasarım Altyapısı: Google Stitch MCP Screen d86f762c22c944ecbc16e10717074ad5
Paraşüt Fintech UI Standartları
"""

import os

HTML_CONTENT = """<!DOCTYPE html>
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
  </style>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased h-full overflow-hidden flex flex-col">

  <!-- TOP APP BAR -->
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
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">4 Belge</span>
        </button>

        <!-- 4. Giderler & Alışlar -->
        <button data-module="expenses" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">shopping_cart_checkout</span>
            <span>Giderler &amp; Alışlar</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">3 Vade</span>
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
            
            <!-- Card 1: Banka & Kasa Likiditesi -->
            <div class="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-slate-500 text-[11px] font-bold uppercase tracking-wider">KASA &amp; BANKA LİKİDİTESİ</span>
                  <span class="material-symbols-outlined text-emerald-600 text-[20px]">account_balance_wallet</span>
                </div>
                <div class="flex items-baseline gap-2">
                  <span class="font-mono text-xl font-bold text-slate-900">£48.250</span>
                  <span class="text-slate-400 font-mono text-sm">+</span>
                  <span class="font-mono text-xl font-bold text-slate-900">₺845.200</span>
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
                  <span class="font-mono text-xl font-bold text-slate-900">£12.139,22</span>
                  <span class="text-slate-400 font-mono text-sm">+</span>
                  <span class="font-mono text-xl font-bold text-slate-900">₺420.000</span>
                </div>
                <p class="text-xs text-slate-500 mt-1.5">
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
                <div class="font-mono text-xl font-bold text-slate-900">
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
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900 font-mono">
                    12 GÜN KALDI
                  </span>
                </div>
                <div class="font-display text-lg font-bold text-slate-900">
                  1 Açık ETGB Bekliyor
                </div>
                <p class="text-xs text-amber-900 mb-2">
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
          </section>

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
                    <button onclick="showToast('Mizan Excel Raporu İndiriliyor...', 'success')" class="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 shadow-xs">
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
                  <table class="w-full text-left border-collapse text-xs font-mono">
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
                    <tbody class="divide-y divide-slate-100">
                      <!-- 100 KASA -->
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-2.5 px-3">
                          <span class="font-bold text-slate-900 block">100 KASA</span>
                          <span class="text-[10px] text-slate-500 font-sans">Merkez TL Kasası &amp; Rezerv</span>
                        </td>
                        <td class="py-2.5 px-3 text-right text-slate-800">125.400,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-500">72.100,00</td>
                        <td class="py-2.5 px-3 text-right font-bold text-emerald-700">53.300,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="material-symbols-outlined text-emerald-600 text-[16px]">check</span>
                        </td>
                      </tr>

                      <!-- 102 BANKALAR -->
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-2.5 px-3">
                          <span class="font-bold text-slate-900 block">102 BANKALAR</span>
                          <span class="text-[10px] text-slate-500 font-sans">Garanti BBVA Döviz / Akbank TL</span>
                        </td>
                        <td class="py-2.5 px-3 text-right text-slate-800">2.980.500,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-500">1.854.200,00</td>
                        <td class="py-2.5 px-3 text-right font-bold text-emerald-700">1.126.300,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="material-symbols-outlined text-emerald-600 text-[16px]">sync</span>
                        </td>
                      </tr>

                      <!-- 120 ALICILAR -->
                      <tr class="hover:bg-slate-50/80 transition-colors bg-blue-50/30">
                        <td class="py-2.5 px-3">
                          <div class="flex items-center gap-1.5">
                            <span class="font-bold text-slate-900">120 ALICILAR</span>
                            <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 font-sans">İHRACAT</span>
                          </div>
                          <span class="text-[10px] text-slate-600 font-sans">Ben Ellis (£12.139,22 Dahil)</span>
                        </td>
                        <td class="py-2.5 px-3 text-right text-slate-800">1.450.800,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-500">890.000,00</td>
                        <td class="py-2.5 px-3 text-right font-bold text-emerald-700">560.800,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="material-symbols-outlined text-amber-600 text-[16px]">pending_actions</span>
                        </td>
                      </tr>

                      <!-- 121 ALACAK SENETLERİ (PORTFÖY ÇEKLERİ) -->
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-2.5 px-3">
                          <span class="font-bold text-slate-900 block">121 ALACAK SENETLERİ &amp; ÇEKLER</span>
                          <span class="text-[10px] text-slate-500 font-sans">Portföydeki 4 Adet Vadeli Çek</span>
                        </td>
                        <td class="py-2.5 px-3 text-right text-slate-800">570.000,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-500">150.000,00</td>
                        <td class="py-2.5 px-3 text-right font-bold text-indigo-700">420.000,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="material-symbols-outlined text-indigo-600 text-[16px]">schedule</span>
                        </td>
                      </tr>

                      <!-- 150 İLK MADDE VE MALZEME -->
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-2.5 px-3">
                          <span class="font-bold text-slate-900 block">150 İLK MADDE VE MALZEME</span>
                          <span class="text-[10px] text-slate-500 font-sans">Pamuk İplik &amp; Ham Kumaş Depo</span>
                        </td>
                        <td class="py-2.5 px-3 text-right text-slate-800">1.890.000,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-500">640.000,00</td>
                        <td class="py-2.5 px-3 text-right font-bold text-slate-900">1.250.000,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="material-symbols-outlined text-emerald-600 text-[16px]">check</span>
                        </td>
                      </tr>

                      <!-- 191 İNDİRİLECEK KDV -->
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-2.5 px-3">
                          <span class="font-bold text-slate-900 block">191 İNDİRİLECEK KDV</span>
                          <span class="text-[10px] text-slate-500 font-sans">Alış &amp; Fason Boyahane Faturaları</span>
                        </td>
                        <td class="py-2.5 px-3 text-right text-slate-800">245.800,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-500">177.364,00</td>
                        <td class="py-2.5 px-3 text-right font-bold text-blue-700">68.436,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="material-symbols-outlined text-blue-600 text-[16px]">receipt</span>
                        </td>
                      </tr>

                      <!-- 320 SATICILAR -->
                      <tr class="hover:bg-slate-50/80 transition-colors bg-amber-50/20">
                        <td class="py-2.5 px-3">
                          <span class="font-bold text-slate-900 block">320 SATICILAR</span>
                          <span class="text-[10px] text-slate-500 font-sans">Birlik Kumaş &amp; Çetin Boyahane</span>
                        </td>
                        <td class="py-2.5 px-3 text-right text-slate-500">180.000,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-800">522.180,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td class="py-2.5 px-3 text-right font-bold text-rose-700">342.180,00</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="material-symbols-outlined text-rose-600 text-[16px]">priority_high</span>
                        </td>
                      </tr>

                      <!-- 360 ÖDENECEK VERGİ VE FONLAR -->
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-2.5 px-3">
                          <span class="font-bold text-slate-900 block">360 ÖDENECEK VERGİ VE FONLAR</span>
                          <span class="text-[10px] text-slate-500 font-sans">Muhtasar Stopaj &amp; Damga Vergisi</span>
                        </td>
                        <td class="py-2.5 px-3 text-right text-slate-500">0,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-800">42.850,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td class="py-2.5 px-3 text-right font-bold text-rose-700">42.850,00</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="material-symbols-outlined text-slate-400 text-[16px]">schedule</span>
                        </td>
                      </tr>

                      <!-- 361 ÖDENECEK SOSYAL GÜVENLİK KESİNTİLERİ -->
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-2.5 px-3">
                          <span class="font-bold text-slate-900 block">361 ÖDENECEK SOSYAL GÜVENLİK KESİNTİLERİ</span>
                          <span class="text-[10px] text-slate-500 font-sans">18 Personel SGK Primi (Ekim 2026)</span>
                        </td>
                        <td class="py-2.5 px-3 text-right text-slate-500">0,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-800">98.400,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td class="py-2.5 px-3 text-right font-bold text-rose-700">98.400,00</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="material-symbols-outlined text-slate-400 text-[16px]">schedule</span>
                        </td>
                      </tr>

                      <!-- 601 YURTDIŞI SATIŞLAR -->
                      <tr class="hover:bg-slate-50/80 transition-colors bg-emerald-50/30">
                        <td class="py-2.5 px-3">
                          <div class="flex items-center gap-1.5">
                            <span class="font-bold text-slate-900">601 YURTDIŞI SATIŞLAR</span>
                            <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 font-sans">KDV İSTİSNA 301</span>
                          </div>
                          <span class="text-[10px] text-slate-600 font-sans">e-İhracat Kumaş &amp; Tekstil Gelirleri</span>
                        </td>
                        <td class="py-2.5 px-3 text-right text-slate-500">0,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-800">1.855.000,00</td>
                        <td class="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td class="py-2.5 px-3 text-right font-bold text-emerald-700">1.855.000,00</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                        <td class="py-3 px-3 font-sans">GENEL MİZAN TOPLAMI:</td>
                        <td class="py-3 px-3 text-right text-slate-900 font-mono">7.262.500,00</td>
                        <td class="py-3 px-3 text-right text-slate-900 font-mono">7.262.500,00</td>
                        <td class="py-3 px-3 text-right text-emerald-700 font-mono">3.468.836,00</td>
                        <td class="py-3 px-3 text-right text-rose-700 font-mono">2.523.430,00</td>
                        <td class="py-3 px-3 text-center text-emerald-600 font-sans text-[11px]">DENK ✓</td>
                      </tr>
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
                <div class="mt-2.5 space-y-2 text-xs">
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
              <button onclick="showToast('Yeni Mahsup / Yevmiye Fişi Modülü Açılıyor...', 'success')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
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
                <input type="text" placeholder="Hesap Kodu veya Adı ile Filtrele..." class="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white w-64 focus:outline-none focus:border-emerald-600" />
                <button onclick="showToast('Excel formatında indiriliyor...', 'success')" class="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 font-medium">Excel İndir</button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono">
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
                <tbody class="divide-y divide-slate-100">
                  <tr class="hover:bg-slate-50">
                    <td class="py-2 px-3 font-bold text-slate-900">100.01 Merkez Kasa (TL)</td>
                    <td class="py-2 px-3 font-sans text-slate-500">Dönen Varlık</td>
                    <td class="py-2 px-3 text-right text-slate-800">125.400,00</td>
                    <td class="py-2 px-3 text-right text-slate-600">72.100,00</td>
                    <td class="py-2 px-3 text-right font-bold text-emerald-700">53.300,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Muavin</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2 px-3 font-bold text-slate-900">102.01 Garanti BBVA GBP İhracat</td>
                    <td class="py-2 px-3 font-sans text-slate-500">Dönen Varlık (Döviz)</td>
                    <td class="py-2 px-3 text-right text-slate-800">2.177.040,00</td>
                    <td class="py-2 px-3 text-right text-slate-600">1.200.000,00</td>
                    <td class="py-2 px-3 text-right font-bold text-emerald-700">977.040,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Muavin</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2 px-3 font-bold text-slate-900">102.02 Garanti BBVA TRY Ticari</td>
                    <td class="py-2 px-3 font-sans text-slate-500">Dönen Varlık (TL)</td>
                    <td class="py-2 px-3 text-right text-slate-800">803.460,00</td>
                    <td class="py-2 px-3 text-right text-slate-600">654.200,00</td>
                    <td class="py-2 px-3 text-right font-bold text-emerald-700">149.260,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Muavin</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50 bg-blue-50/20">
                    <td class="py-2 px-3 font-bold text-slate-900">120.01 Ben Ellis</td>
                    <td class="py-2 px-3 font-sans text-blue-700 font-semibold">Yurtdışı Müşteri</td>
                    <td class="py-2 px-3 text-right text-slate-800">1.108.500,00</td>
                    <td class="py-2 px-3 text-right text-slate-600">560.800,00</td>
                    <td class="py-2 px-3 text-right font-bold text-emerald-700">547.700,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Ekstre</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2 px-3 font-bold text-slate-900">121.01 Portföydeki Vadeli Çekler</td>
                    <td class="py-2 px-3 font-sans text-slate-500">Alacak Senedi</td>
                    <td class="py-2 px-3 text-right text-slate-800">570.000,00</td>
                    <td class="py-2 px-3 text-right text-slate-600">150.000,00</td>
                    <td class="py-2 px-3 text-right font-bold text-indigo-700">420.000,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Bordro</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2 px-3 font-bold text-slate-900">150.01 Dokuma &amp; Pamuk İplik Depo</td>
                    <td class="py-2 px-3 font-sans text-slate-500">İlk Madde Stok</td>
                    <td class="py-2 px-3 text-right text-slate-800">1.890.000,00</td>
                    <td class="py-2 px-3 text-right text-slate-600">640.000,00</td>
                    <td class="py-2 px-3 text-right font-bold text-slate-900">1.250.000,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Kart</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50 bg-amber-50/20">
                    <td class="py-2 px-3 font-bold text-slate-900">320.01 Birlik Kumaşçılık San.</td>
                    <td class="py-2 px-3 font-sans text-amber-700 font-semibold">Tedarikçi</td>
                    <td class="py-2 px-3 text-right text-slate-600">100.000,00</td>
                    <td class="py-2 px-3 text-right text-slate-800">285.000,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-right font-bold text-rose-700">185.000,00</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Ekstre</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2 px-3 font-bold text-slate-900">320.02 Çetin Mensucat Boyahane</td>
                    <td class="py-2 px-3 font-sans text-amber-700 font-semibold">Tedarikçi (Fason)</td>
                    <td class="py-2 px-3 text-right text-slate-600">50.000,00</td>
                    <td class="py-2 px-3 text-right text-slate-800">142.400,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-right font-bold text-rose-700">92.400,00</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Ekstre</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2 px-3 font-bold text-slate-900">360.01 Gelir Vergisi Stopajı</td>
                    <td class="py-2 px-3 font-sans text-slate-500">Ödenecek Vergi</td>
                    <td class="py-2 px-3 text-right text-slate-600">0,00</td>
                    <td class="py-2 px-3 text-right text-slate-800">42.850,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-right font-bold text-rose-700">42.850,00</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Beyan</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2 px-3 font-bold text-slate-900">361.01 SGK İşçi &amp; İşveren Primi</td>
                    <td class="py-2 px-3 font-sans text-slate-500">Sosyal Güvenlik</td>
                    <td class="py-2 px-3 text-right text-slate-600">0,00</td>
                    <td class="py-2 px-3 text-right text-slate-800">98.400,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-right font-bold text-rose-700">98.400,00</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Bordro</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50 bg-emerald-50/20">
                    <td class="py-2 px-3 font-bold text-slate-900">601.01 İhracat Gelirleri (KDV İstisna 301)</td>
                    <td class="py-2 px-3 font-sans text-emerald-700 font-semibold">Gelir Hesabı</td>
                    <td class="py-2 px-3 text-right text-slate-600">0,00</td>
                    <td class="py-2 px-3 text-right text-slate-800">1.855.000,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-right font-bold text-emerald-700">1.855.000,00</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">İBKB</button></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2 px-3 font-bold text-slate-900">770.01 Genel Yönetim ve Fabrika Giderleri</td>
                    <td class="py-2 px-3 font-sans text-slate-500">Maliyet Hesabı</td>
                    <td class="py-2 px-3 text-right text-slate-800">312.400,00</td>
                    <td class="py-2 px-3 text-right text-slate-600">0,00</td>
                    <td class="py-2 px-3 text-right font-bold text-slate-900">312.400,00</td>
                    <td class="py-2 px-3 text-right text-slate-400">-</td>
                    <td class="py-2 px-3 text-center font-sans"><button class="text-emerald-600 hover:underline">Muavin</button></td>
                  </tr>
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
              <div class="text-lg font-bold font-mono text-slate-900 mt-1">£20.664 + €14.800</div>
              <span class="text-[11px] text-emerald-600 font-medium">₺1.854.200 TL Karşılığı</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Tahsil Edilen</span>
              <div class="text-lg font-bold font-mono text-emerald-700 mt-1">£8.525 + €14.800</div>
              <span class="text-[11px] text-slate-500">Bankaya Geçen Tutar</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">Bekleyen Açık Bakiye</span>
              <div class="text-lg font-bold font-mono text-amber-700 mt-1">£12.139,22</div>
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
              <span class="text-slate-500 font-mono">4 Belge Listeleniyor</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono">
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
                <tbody class="divide-y divide-slate-100">
                  <tr class="hover:bg-slate-50 bg-amber-50/20">
                    <td class="py-3 px-3 font-bold text-slate-900">EFT2026000000104</td>
                    <td class="py-3 px-3 font-sans font-bold text-slate-900">BEN ELLIS (UK)</td>
                    <td class="py-3 px-3 text-slate-600">08.09.2026</td>
                    <td class="py-3 px-3 font-mono text-blue-700 font-bold">26340200EX009281</td>
                    <td class="py-3 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">301 - Mal İhracatı</span></td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">£12.139,22</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺547.721,60</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">Açık (12 Gün)</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="openModal('modal-dab-calculator')" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold">TCMB Bozum Masası</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">EFT2026000000098</td>
                    <td class="py-3 px-3 font-sans font-bold text-slate-900">BEN ELLIS (UK)</td>
                    <td class="py-3 px-3 text-slate-600">12.08.2026</td>
                    <td class="py-3 px-3 font-mono text-slate-600">26340200EX008104</td>
                    <td class="py-3 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">301 - Mal İhracatı</span></td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">£8.525,00</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺384.648,00</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">İBKB Kapatıldı ✓</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('İBKB Belgesi ve DAB Yazdırılıyor...', 'success')" class="px-2 py-1 border border-slate-200 rounded text-xs text-slate-700">DAB PDF</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">EFT2026000000095</td>
                    <td class="py-3 px-3 font-sans font-semibold text-slate-800">MILANO TESSUTI SRL</td>
                    <td class="py-3 px-3 text-slate-600">24.07.2026</td>
                    <td class="py-3 px-3 font-mono text-slate-600">26340200EX007551</td>
                    <td class="py-3 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">301 - Mal İhracatı</span></td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">€14.800,00</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺554.289,60</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">İBKB Kapatıldı ✓</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('DAB Belgesi Açılıyor...', 'success')" class="px-2 py-1 border border-slate-200 rounded text-xs text-slate-700">DAB PDF</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">EFT2026000000091</td>
                    <td class="py-3 px-3 font-sans font-semibold text-slate-800">DEFACTO PERAKENDE TİC. A.Ş.</td>
                    <td class="py-3 px-3 text-slate-600">15.07.2026</td>
                    <td class="py-3 px-3 font-mono text-slate-400">Yurtiçi Satış</td>
                    <td class="py-3 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">%10 KDV</span></td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">-</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺367.540,80</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Tahsil Edildi ✓</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('e-Fatura Görüntüleyici...', 'success')" class="px-2 py-1 border border-slate-200 rounded text-xs text-slate-700">Fatura PDF</button>
                    </td>
                  </tr>
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
              <div class="text-lg font-bold font-mono text-slate-900 mt-1">₺342.180,00</div>
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
              <table class="w-full text-left border-collapse text-xs font-mono">
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
                <tbody class="divide-y divide-slate-100">
                  <tr class="hover:bg-slate-50 bg-amber-50/20">
                    <td class="py-3 px-3 font-bold text-slate-900">GİB2026000084920</td>
                    <td class="py-3 px-3 font-sans font-bold text-slate-900">BİRLİK KUMAŞÇILIK SAN. TİC. LTD.</td>
                    <td class="py-3 px-3 font-sans text-slate-600">150.01 Ham Dokuma Kumaş Alımı</td>
                    <td class="py-3 px-3 font-bold text-amber-700">14.10.2026 (2 Gün)</td>
                    <td class="py-3 px-3 text-right text-slate-800">168.181,82</td>
                    <td class="py-3 px-3 text-right text-slate-600">16.818,18</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺185.000,00</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">Ödenecek</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('Garanti Bankası EFT talimatı hazırlandı.', 'success')" class="px-2.5 py-1 bg-slate-800 text-white rounded text-xs font-semibold">Öde / Havale</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50 bg-amber-50/20">
                    <td class="py-3 px-3 font-bold text-slate-900">GİB2026000047291</td>
                    <td class="py-3 px-3 font-sans font-bold text-slate-900">ÇETİN MENSUCAT BOYA APRE LTD.</td>
                    <td class="py-3 px-3 font-sans text-slate-600">770.04 Fason Kumaş Boyama &amp; Terbiye</td>
                    <td class="py-3 px-3 font-bold text-amber-700">16.10.2026 (4 Gün)</td>
                    <td class="py-3 px-3 text-right text-slate-800">84.000,00</td>
                    <td class="py-3 px-3 text-right text-slate-600">8.400,00</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺92.400,00</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">Ödenecek</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('Havale talimatı oluşturuluyor...', 'success')" class="px-2.5 py-1 bg-slate-800 text-white rounded text-xs font-semibold">Öde / Havale</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">GİB2026000019230</td>
                    <td class="py-3 px-3 font-sans font-semibold text-slate-800">MARİFET İPLİK SANAYİ A.Ş.</td>
                    <td class="py-3 px-3 font-sans text-slate-600">150.02 Pamuk İplik Ne 30/1</td>
                    <td class="py-3 px-3 text-slate-600">26.10.2026</td>
                    <td class="py-3 px-3 text-right text-slate-800">58.890,91</td>
                    <td class="py-3 px-3 text-right text-slate-600">5.889,09</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺64.780,00</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Vadeli</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('Detay görüntüleniyor...', 'info')" class="px-2 py-1 border border-slate-200 rounded text-xs">Görüntüle</button>
                    </td>
                  </tr>
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
              <button onclick="window.print()" class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">print</span>
                <span>Cari Ekstre Yazdır (PDF)</span>
              </button>
              <button onclick="openModal('modal-new-payment')" class="px-3.5 py-1.5 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">add</span>
                <span>+ Tahsilat / Havale Eşle</span>
              </button>
            </div>
          </div>

          <!-- Ben Ellis Highlight Card -->
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
                <span>Bakiye: <strong class="text-slate-900 font-bold font-mono">£12.139,22 GBP</strong></span>
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
          </div>

          <!-- All Cariler Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-800">Müşteri ve Tedarikçi Cari Hesap Kartları</span>
              <span class="text-slate-500">6 Cari Hesap Kayıtlı</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono">
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
                <tbody class="divide-y divide-slate-100">
                  <tr class="hover:bg-slate-50 bg-blue-50/20">
                    <td class="py-3 px-3 font-bold text-slate-900">CR-GB-0024</td>
                    <td class="py-3 px-3 font-sans font-bold text-slate-900">BEN ELLIS</td>
                    <td class="py-3 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">İhracat Müşterisi</span></td>
                    <td class="py-3 px-3">GB9283741</td>
                    <td class="py-3 px-3 font-sans">Manchester, İngiltere</td>
                    <td class="py-3 px-3 text-right font-bold text-emerald-700">£12.139,22 (Alacak)</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">ETGB Bekliyor</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="openModal('modal-dab-calculator')" class="px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-semibold">TCMB Bozum</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">CR-TR-0018</td>
                    <td class="py-3 px-3 font-sans font-bold text-slate-900">BİRLİK KUMAŞÇILIK SAN. LTD.</td>
                    <td class="py-3 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">Hammadde Tedarikçisi</span></td>
                    <td class="py-3 px-3">1780492811</td>
                    <td class="py-3 px-3 font-sans">Güngören, İstanbul</td>
                    <td class="py-3 px-3 text-right font-bold text-rose-700">₺185.000,00 (Borç)</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900">Vade: 14 Eki</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('Cari Ekstre Yazdırılıyor...', 'info')" class="px-2 py-1 border border-slate-200 rounded text-xs">Ekstre</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">CR-TR-0022</td>
                    <td class="py-3 px-3 font-sans font-bold text-slate-900">ÇETİN MENSUCAT BOYA LTD.</td>
                    <td class="py-3 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">Fason Tedarikçi</span></td>
                    <td class="py-3 px-3">2450891234</td>
                    <td class="py-3 px-3 font-sans">Çorlu, Tekirdağ</td>
                    <td class="py-3 px-3 text-right font-bold text-rose-700">₺92.400,00 (Borç)</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900">Vade: 16 Eki</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('Cari Ekstre Yazdırılıyor...', 'info')" class="px-2 py-1 border border-slate-200 rounded text-xs">Ekstre</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">CR-TR-0045</td>
                    <td class="py-3 px-3 font-sans font-semibold text-slate-800">ZİRVE TEKSTİL PAZARLAMA A.Ş.</td>
                    <td class="py-3 px-3 font-sans"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Yurtiçi Müşteri</span></td>
                    <td class="py-3 px-3">9820147612</td>
                    <td class="py-3 px-3 font-sans">Merter, İstanbul</td>
                    <td class="py-3 px-3 text-right font-bold text-indigo-700">₺150.000,00 (Çek Alındı)</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Çek Portföyde</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="switchView('checks')" class="px-2 py-1 border border-slate-200 rounded text-xs">Çek Gör</button>
                    </td>
                  </tr>
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

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div class="font-mono text-xl font-bold text-slate-900 mt-2">£48.250,00</div>
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
              <div class="font-mono text-xl font-bold text-slate-900 mt-2">₺845.200,00</div>
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
          </div>

          <!-- Bank Movements Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-800">Son Banka &amp; Kasa Hareketleri</span>
              <span class="text-emerald-700 font-semibold">Garanti BBVA API Entegre</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono">
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
                <tbody class="divide-y divide-slate-100">
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
              <div class="text-2xl font-bold text-slate-900 mt-1">₺420.000,00</div>
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
              <table class="w-full text-left border-collapse text-xs font-mono">
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
                <tbody class="divide-y divide-slate-100">
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">CK-849201</td>
                    <td class="py-3 px-3 font-sans font-semibold text-slate-800">Zirve Tekstil Pazarlama A.Ş.</td>
                    <td class="py-3 px-3 font-sans text-slate-600">İş Bankası Merter</td>
                    <td class="py-3 px-3 font-bold text-amber-700">18.10.2026 (6 Gün)</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺150.000,00</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">Portföyde</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('Çek Garanti BBVA Tahsilata Verildi.', 'success')" class="px-2 py-1 bg-slate-800 text-white rounded text-xs">Banka Tahsilata Ver</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">CK-918234</td>
                    <td class="py-3 px-3 font-sans font-semibold text-slate-800">Korteks İplik Dokuma Sanayi</td>
                    <td class="py-3 px-3 font-sans text-slate-600">Yapı Kredi Bursa</td>
                    <td class="py-3 px-3 text-slate-600">28.10.2026</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺120.000,00</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">Portföyde</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('Çek cirolama ekranı...', 'success')" class="px-2 py-1 border border-slate-200 rounded text-xs">Ciro Et</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">CK-552109</td>
                    <td class="py-3 px-3 font-sans font-semibold text-slate-800">Akdeniz Triko Konfeksiyon</td>
                    <td class="py-3 px-3 font-sans text-slate-600">Garanti BBVA Osmanbey</td>
                    <td class="py-3 px-3 text-slate-600">05.11.2026</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺85.000,00</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">Portföyde</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('Çek cirolama...', 'info')" class="px-2 py-1 border border-slate-200 rounded text-xs">Ciro Et</button>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-bold text-slate-900">CK-330912</td>
                    <td class="py-3 px-3 font-sans font-semibold text-slate-800">Marmara Mensucat ve İplik</td>
                    <td class="py-3 px-3 font-sans text-slate-600">Akbank Zeytinburnu</td>
                    <td class="py-3 px-3 text-slate-600">15.11.2026</td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900">₺65.000,00</td>
                    <td class="py-3 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">Portföyde</span></td>
                    <td class="py-3 px-3 text-right font-sans">
                      <button onclick="showToast('Detay açılıyor...', 'info')" class="px-2 py-1 border border-slate-200 rounded text-xs">Detay</button>
                    </td>
                  </tr>
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
              <button onclick="showToast('Garanti BBVA Toplu Maaş Ödeme TXT Dosyası İndirildi.', 'success')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
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
              <table class="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase border-b border-slate-200 font-sans">
                    <th class="py-2.5 px-3">Sicil No</th>
                    <th class="py-2.5 px-3">Adı Soyadı</th>
                    <th class="py-2.5 px-3">Görevi / Departman</th>
                    <th class="py-2.5 px-3 text-right">Brüt Ücret (₺)</th>
                    <th class="py-2.5 px-3 text-right">SGK Kesintisi (₺)</th>
                    <th class="py-2.5 px-3 text-right">Gelir Vergisi (₺)</th>
                    <th class="py-2.5 px-3 text-right">Net Ödenecek (₺)</th>
                    <th class="py-2.5 px-3 text-center">Banka &amp; Durum</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr class="hover:bg-slate-50">
                    <td class="py-2.5 px-3 font-bold text-slate-900">BRS-001</td>
                    <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Mustafa Yıldırım</td>
                    <td class="py-2.5 px-3 font-sans text-slate-600">Üretim &amp; Dokuma Ustabaşı</td>
                    <td class="py-2.5 px-3 text-right text-slate-800">45.000,00</td>
                    <td class="py-2.5 px-3 text-right text-rose-700">6.750,00</td>
                    <td class="py-2.5 px-3 text-right text-blue-700">3.200,00</td>
                    <td class="py-2.5 px-3 text-right font-bold text-emerald-700">35.050,00</td>
                    <td class="py-2.5 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Garanti Maaş Hesabı</span></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2.5 px-3 font-bold text-slate-900">BRS-002</td>
                    <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Ayşe Demir</td>
                    <td class="py-2.5 px-3 font-sans text-slate-600">İhracat Operasyon Uzmanı</td>
                    <td class="py-2.5 px-3 text-right text-slate-800">42.000,00</td>
                    <td class="py-2.5 px-3 text-right text-rose-700">6.300,00</td>
                    <td class="py-2.5 px-3 text-right text-blue-700">2.900,00</td>
                    <td class="py-2.5 px-3 text-right font-bold text-emerald-700">32.800,00</td>
                    <td class="py-2.5 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Garanti Maaş Hesabı</span></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2.5 px-3 font-bold text-slate-900">BRS-003</td>
                    <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Mehmet Kaya</td>
                    <td class="py-2.5 px-3 font-sans text-slate-600">Dokuma Tezgah Operatörü</td>
                    <td class="py-2.5 px-3 text-right text-slate-800">32.000,00</td>
                    <td class="py-2.5 px-3 text-right text-rose-700">4.800,00</td>
                    <td class="py-2.5 px-3 text-right text-blue-700">1.800,00</td>
                    <td class="py-2.5 px-3 text-right font-bold text-emerald-700">25.400,00</td>
                    <td class="py-2.5 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Garanti Maaş Hesabı</span></td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2.5 px-3 font-bold text-slate-900">BRS-004</td>
                    <td class="py-2.5 px-3 font-sans font-bold text-slate-900">Fatma Şahin</td>
                    <td class="py-2.5 px-3 font-sans text-slate-600">Kalite Kontrol &amp; Paketleme</td>
                    <td class="py-2.5 px-3 text-right text-slate-800">28.000,00</td>
                    <td class="py-2.5 px-3 text-right text-rose-700">4.200,00</td>
                    <td class="py-2.5 px-3 text-right text-blue-700">1.200,00</td>
                    <td class="py-2.5 px-3 text-right font-bold text-emerald-700">22.600,00</td>
                    <td class="py-2.5 px-3 text-center font-sans"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Garanti Maaş Hesabı</span></td>
                  </tr>
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
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">e-Defter Kebir Beratı</span>
              <div class="text-lg font-bold text-emerald-700 mt-1">✓ Doğrulandı &amp; Mühürlendi</div>
              <span class="text-xs text-slate-500">Ekim 2026 Defter-i Kebir (XML)</span>
            </div>
            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span class="text-slate-500 text-xs font-semibold uppercase">e-İrsaliye Entegrasyonu</span>
              <div class="text-lg font-bold text-slate-900 mt-1">Canlı / Karekodlu</div>
              <span class="text-xs text-slate-500">Taşıyıcı: Ekol Lojistik (34 BRS 190)</span>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODULE 10: Ba/Bs & e-MUTABAKAT -->
        <!-- ========================================== -->
        <div id="view-mutabakat" class="module-view space-y-5">
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
            <button onclick="showToast('Yeni Kumaş Tanımlama Ekranı...', 'success')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span>+ Yeni Ürün Tanımla</span>
            </button>
          </div>

          <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
            <span class="font-bold text-xs text-slate-900 uppercase">Kumaş &amp; İplik Envanter Değeri:</span>
            <div class="text-2xl font-bold font-mono text-slate-900 mt-1">₺3.702.750,00</div>
            <p class="text-xs text-slate-500 mt-1">GTİP: 5208.52.00 Dokuma Gömleklik (14.850 m), 6006.22.00 Penye Süprem (8.200 kg), 5205.12.00 Pamuk İplik (4.500 kg)</p>
          </div>

          <!-- Stock Table -->
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-800">Depo Stok Kartları &amp; İhracat GTİP Kodları</span>
              <span class="text-slate-500">İkitelli Ana Depo</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-mono">
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
                <tbody class="divide-y divide-slate-100">
                  <tr class="hover:bg-slate-50">
                    <td class="py-2.5 px-3 font-bold text-slate-900">STK-KM-01</td>
                    <td class="py-2.5 px-3 font-sans font-bold text-slate-800">Baskılı Pamuk Dokuma Gömleklik Kumaş</td>
                    <td class="py-2.5 px-3 font-bold text-blue-700">5208.52.00.00.00</td>
                    <td class="py-2.5 px-3 text-right font-bold text-slate-900">14.850</td>
                    <td class="py-2.5 px-3 font-sans">Metre</td>
                    <td class="py-2.5 px-3 text-right text-slate-700">145,00</td>
                    <td class="py-2.5 px-3 text-right font-bold text-slate-900">₺2.153.250,00</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2.5 px-3 font-bold text-slate-900">STK-KM-02</td>
                    <td class="py-2.5 px-3 font-sans font-bold text-slate-800">Boyalı Penye Süprem %100 Pamuk Örme Kumaş</td>
                    <td class="py-2.5 px-3 font-bold text-blue-700">6006.22.00.00.00</td>
                    <td class="py-2.5 px-3 text-right font-bold text-slate-900">8.200</td>
                    <td class="py-2.5 px-3 font-sans">Kg</td>
                    <td class="py-2.5 px-3 text-right text-slate-700">115,00</td>
                    <td class="py-2.5 px-3 text-right font-bold text-slate-900">₺943.000,00</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="py-2.5 px-3 font-bold text-slate-900">STK-IP-01</td>
                    <td class="py-2.5 px-3 font-sans font-semibold text-slate-700">%100 Pamuk Open-End İplik Ne 30/1</td>
                    <td class="py-2.5 px-3 font-bold text-blue-700">5205.12.00.00.00</td>
                    <td class="py-2.5 px-3 text-right font-bold text-slate-900">4.500</td>
                    <td class="py-2.5 px-3 font-sans">Kg</td>
                    <td class="py-2.5 px-3 text-right text-slate-700">135,00</td>
                    <td class="py-2.5 px-3 text-right font-bold text-slate-900">₺606.500,00</td>
                  </tr>
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
            <button onclick="showToast('Tüm Mali Raporlar Paketi İndirildi.', 'success')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5">
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
            <button onclick="showToast('Sistem ayarları güncellendi.', 'success')" class="px-3.5 py-2 rounded-lg bg-[#00AA6C] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm">
              Ayarları Kaydet
            </button>
          </div>

          <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-slate-500 font-semibold mb-1">Resmi Şirket Unvanı</label>
                <input class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-900 bg-slate-50" value="BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ." readonly/>
              </div>
              <div>
                <label class="block text-slate-500 font-semibold mb-1">Vergi Dairesi &amp; Vergi No</label>
                <input class="w-full p-2 border border-slate-300 rounded font-mono text-slate-900" value="İkitelli Vergi Dairesi • 1870492109"/>
              </div>
              <div>
                <label class="block text-slate-500 font-semibold mb-1">Garanti BBVA GBP IBAN</label>
                <input class="w-full p-2 border border-slate-300 rounded font-mono text-slate-900" value="TR32 0006 2000 1827 0009 2381 01"/>
              </div>
              <div>
                <label class="block text-slate-500 font-semibold mb-1">GİB Özel Entegratör</label>
                <input class="w-full p-2 border border-slate-300 rounded text-slate-900" value="Uyumsoft Bilgi Sistemleri (API Canlı)"/>
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
  <!-- INTERACTIVE MODALS -->
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
          <select class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
            <option>BEN ELLIS (CR-GB-0024 - Manchester, UK)</option>
            <option>MILANO TESSUTI SRL</option>
            <option>DEFACTO PERAKENDE TİC. A.Ş.</option>
            <option>ZİRVE TEKSTİL PAZARLAMA A.Ş.</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Fatura Tipi</label>
            <select class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
              <option>İSTİSNA (301 - Mal İhracatı / ETGB)</option>
              <option>TEVKİFATLI (Fason Tekstil 7/10)</option>
              <option>TEMEL FATURA (%10 KDV)</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Para Birimi &amp; Kur</label>
            <input class="w-full p-2 border border-slate-300 rounded font-mono" value="GBP (£) • 45.1200 TCMB" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">ETGB No (Gümrük Beyan)</label>
            <input class="w-full p-2 border border-slate-300 rounded font-mono" placeholder="Örn: 26340200EX..." />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">GTİP Kodu</label>
            <input class="w-full p-2 border border-slate-300 rounded font-mono" value="5208.52.00 Dokuma Gömleklik" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Fatura Tutarı (£)</label>
            <input class="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900" placeholder="12139.22" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Vade (Yasal İBKB 180 Gün)</label>
            <input type="date" class="w-full p-2 border border-slate-300 rounded" value="2026-11-30" />
          </div>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button onclick="closeModal('modal-new-invoice')" class="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">İptal</button>
        <button onclick="submitNewInvoice()" class="px-4 py-2 bg-[#00AA6C] hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm">Faturayı Kes &amp; GİB'e Gönder</button>
      </div>
    </div>
  </div>

  <!-- MODAL 2: NEW EXPENSE -->
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
          <select class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
            <option>BİRLİK KUMAŞÇILIK SAN. LTD. (1780492811)</option>
            <option>ÇETİN MENSUCAT BOYA LTD. (2450891234)</option>
            <option>MARİFET İPLİK SANAYİ A.Ş.</option>
            <option>Diğer Masraf / Akaryakıt / Elektrik</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">TDHP Gider Hesabı</label>
            <select class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
              <option>150.01 - Ham Kumaş Alımı</option>
              <option>770.04 - Fason Boyahane Gideri</option>
              <option>770.01 - Yönetim &amp; Fabrika Masrafları</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">KDV Oranı</label>
            <select class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
              <option>%10 KDV (Tekstil &amp; Kumaş)</option>
              <option>%20 KDV (Genel Masraf)</option>
              <option>%0 KDV (İstisna)</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Fatura Tutarı (KDV Dahil ₺)</label>
            <input class="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900" placeholder="185000.00" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Vade Tarihi</label>
            <input type="date" class="w-full p-2 border border-slate-300 rounded" value="2026-10-25" />
          </div>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button onclick="closeModal('modal-new-expense')" class="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">İptal</button>
        <button onclick="showToast('Gider kaydedildi ve 320 Satıcılar cari hesabına işlendi.', 'success'); closeModal('modal-new-expense')" class="px-4 py-2 bg-[#00AA6C] hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm">Gideri Kaydet</button>
      </div>
    </div>
  </div>

  <!-- MODAL 3: NEW PAYMENT -->
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
          <select class="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800">
            <option>BEN ELLIS (£12.139,22 Açık Bakiye)</option>
            <option>MILANO TESSUTI SRL (€14.800,00)</option>
            <option>ZİRVE TEKSTİL PAZARLAMA A.Ş. (₺150.000,00)</option>
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
        <button onclick="showToast('Tahsilat cari hesaba işlendi ve ETGB kapatıldı.', 'success'); closeModal('modal-new-payment')" class="px-4 py-2 bg-[#00AA6C] hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm">Tahsilatı Eşle &amp; Kaydet</button>
      </div>
    </div>
  </div>

  <!-- MODAL 4: NEW CHECK -->
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
            <input class="w-full p-2 border border-slate-300 rounded font-mono" placeholder="Örn: CK-98214" />
          </div>
        </div>
        <div>
          <label class="block text-slate-600 font-semibold mb-1">Keşideci Firma &amp; Banka</label>
          <input class="w-full p-2 border border-slate-300 rounded" placeholder="Örn: Zirve Tekstil A.Ş. • İş Bankası Merter" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Çek Tutarı (₺)</label>
            <input class="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900" placeholder="150000.00" />
          </div>
          <div>
            <label class="block text-slate-600 font-semibold mb-1">Vade Tarihi</label>
            <input type="date" class="w-full p-2 border border-slate-300 rounded" value="2026-11-15" />
          </div>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button onclick="closeModal('modal-new-check')" class="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">İptal</button>
        <button onclick="showToast('Yeni çek portföye başarıyla eklendi (TDHP 121).', 'success'); closeModal('modal-new-check')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm">Çeki Portföye Al</button>
      </div>
    </div>
  </div>

  <!-- MODAL 5: TCMB %40 BOZUM MASASI & DAB HESAPLAMA -->
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
        <button onclick="showToast('Garanti Bankası TCMB Bozum Talimat Dilekçesi İndirildi (PDF).', 'success')" class="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
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

  <!-- TOAST NOTIFICATION POPUP -->
  <div id="toast-container" class="fixed bottom-12 right-6 z-50 flex flex-col space-y-2 pointer-events-none"></div>

  <!-- JAVASCRIPT APP CONTROLLER -->
  <script>
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

    // Modal Handlers
    function openModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.remove('hidden');
    }
    function closeModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.add('hidden');
    }

    // Confirm DAB Exchange
    function confirmDabExchange() {
      closeModal('modal-dab-calculator');
      showToast('TCMB %40 Bozum Gerçekleşti! £4.855,69 bozuldu, ₺219.088,73 TRY hesabına geçti. İBKB kapatıldı!', 'success');
    }

    // Submit New Invoice
    function submitNewInvoice() {
      closeModal('modal-new-invoice');
      showToast('e-İhracat faturası oluşturuldu ve GİB portalına gönderildi. İstisna: 301.', 'success');
    }

    // Refresh Dashboard
    function refreshDashboard() {
      showToast('Veriler GİB ve Banka API üzerinden güncellendi.', 'success');
    }

    // Toast Notifications
    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'pointer-events-auto px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg text-white transition-all transform duration-300 flex items-center gap-2 ' +
        (type === 'success' ? 'bg-emerald-600' : type === 'info' ? 'bg-slate-800' : 'bg-rose-600');
      
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[16px]';
      icon.innerText = type === 'success' ? 'check_circle' : 'info';
      
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

    // Global shortcut Ctrl+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        if (input) input.focus();
      }
    });
  </script>
</body>
</html>
"""

def main():
    target_path = os.path.join(os.path.dirname(__file__), "app", "index.html")
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)
    print("SUCCESS: Full Enterprise Accounting & ERP index.html written.")

if __name__ == "__main__":
    main()
