import os
import re

ERP_BUILD_PATH = "build_ultimate_enterprise_erp.py"

with open(ERP_BUILD_PATH, "r", encoding="utf-8") as f:
    code = f.read()

print("Original code length:", len(code))

# 1. Update Sidebar Nav for Mutabakat
old_nav_mutabakat = """<!-- 10. Ba/Bs & e-Mutabakat -->
        <button data-module="mutabakat" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-[18px]">fact_check</span>
            <span>Ba/Bs &amp; e-Mutabakat</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">₺5.000+</span>
        </button>"""

new_nav_mutabakat = """<!-- 10. Faruk Aytin Fason & e-Mutabakat -->
        <button data-module="mutabakat" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 text-xs font-medium transition-colors group">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-amber-400 group-hover:text-amber-300 text-[18px]">handshake</span>
            <span>Faruk Aytin &amp; Mutabakat</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/40 font-mono font-bold">-$10.335 USD</span>
        </button>"""

if old_nav_mutabakat in code:
    code = code.replace(old_nav_mutabakat, new_nav_mutabakat)
    print("✓ Replaced sidebar nav mutabakat")
else:
    print("! Sidebar nav mutabakat not matched directly, checking regex")

# 2. Check if Ben Ellis in sidebar contacts count
old_sidebar_contacts = """<span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">Ben Ellis</span>"""
new_sidebar_contacts = """<span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold">15 Canlı Cari</span>"""
code = code.replace(old_sidebar_contacts, new_sidebar_contacts)

# Save updated script
with open(ERP_BUILD_PATH, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated build_ultimate_enterprise_erp.py saved.")
