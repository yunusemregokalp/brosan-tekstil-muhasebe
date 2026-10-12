import os
import win32com.client
from urllib.parse import quote

shell = win32com.client.Dispatch('WScript.Shell')

desktop = 'C:/Users/YUNUS EMRE GÖKALP/OneDrive/Masaüstü'
muhasebe_folder = 'C:/Users/YUNUS EMRE GÖKALP/OneDrive/Masaüstü/MUHASEBE BROSAN TEKSTİL'
target_app_dir = 'C:/Users/YUNUS EMRE GÖKALP/OneDrive/Masaüstü/MUHASEBE BROSAN TEKSTİL/YÜKLEME EVRAKLARI ANTIGRAVITY/app'
index_html = os.path.join(target_app_dir, 'index.html').replace('\\', '/')
icon_path = os.path.join(target_app_dir, 'brosan_muhasebe.ico').replace('/', '\\')

chrome_exe = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_exe):
    chrome_exe = r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'

# Live Cloud Production URL (https://brosangroup.com/muhasebe)
cloud_url = 'https://brosangroup.com/muhasebe'
cloud_app_arg = f'--app="{cloud_url}"'

# Local Offline Fallback
url_encoded_path = quote(index_html, safe='/:')
local_app_arg = f'--app="file:///{url_encoded_path}"'

cloud_shortcuts = [
    os.path.join(desktop, 'BROSAN MUHASEBE PROGRAMI.lnk'),
    os.path.join(desktop, 'BROSAN MUHASEBE.lnk'),
    os.path.join(desktop, 'BROSAN ERP KOKPITI.lnk'),
    os.path.join(desktop, 'BROSAN ERP.lnk'),
    os.path.join(muhasebe_folder, 'BROSAN MUHASEBE PROGRAMI.lnk')
]

for sc_path in cloud_shortcuts:
    sc = shell.CreateShortcut(sc_path)
    sc.TargetPath = chrome_exe
    sc.Arguments = cloud_app_arg
    sc.WorkingDirectory = target_app_dir.replace('/', '\\')
    sc.Description = 'Brosan Tekstil Ön & Genel Muhasebe ERP Programı (Canlı Bulut Linki)'
    if os.path.exists(icon_path):
        sc.IconLocation = f'{icon_path},0'
    sc.Save()
    print('Created cloud shortcut:', sc_path)

# Emergency offline fallback shortcut
local_sc_path = os.path.join(desktop, 'BROSAN MUHASEBE (Lokal Çevrimdışı).lnk')
sc_local = shell.CreateShortcut(local_sc_path)
sc_local.TargetPath = chrome_exe
sc_local.Arguments = local_app_arg
sc_local.WorkingDirectory = target_app_dir.replace('/', '\\')
sc_local.Description = 'Brosan Tekstil Muhasebe (Lokal Çevrimdışı Yedek)'
if os.path.exists(icon_path):
    sc_local.IconLocation = f'{icon_path},0'
sc_local.Save()
print('Created local offline shortcut:', local_sc_path)
