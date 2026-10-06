# -*- coding: utf-8 -*-
import os
import subprocess
import urllib.parse

def setup_launchers():
    dir_path = os.path.dirname(os.path.abspath(__file__))
    app_html = os.path.join(dir_path, "app", "index.html")
    
    # 1. Bat file in current directory
    bat_path = os.path.join(dir_path, "BROSAN ERP BAŞLAT.bat")
    with open(bat_path, "w", encoding="cp1254", errors="ignore") as f:
        f.write('@echo off\r\n')
        f.write('chcp 65001 >nul\r\n')
        f.write('title BROSAN ERP\r\n')
        f.write('echo Brosan ERP Sistemi Baslatiliyor...\r\n')
        f.write('start "" "%~dp0app\\index.html"\r\n')
        f.write('exit\r\n')
    print("Created:", bat_path)

    # 2. Cmd file in current directory
    cmd_path = os.path.join(dir_path, "BASLAT.cmd")
    with open(cmd_path, "w", encoding="cp1254", errors="ignore") as f:
        f.write('@echo off\r\n')
        f.write('start "" "%~dp0app\\index.html"\r\n')
        f.write('exit\r\n')
    print("Created:", cmd_path)

    # 3. Fix Desktop shortcuts
    desktop_onedrive = r"C:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü"
    if os.path.exists(desktop_onedrive):
        # 3a. URL Shortcut with proper percent-encoded path
        url_file = os.path.join(desktop_onedrive, "BROSAN ERP.url")
        # URL encode path
        encoded_path = "file:///" + urllib.parse.quote(app_html.replace("\\", "/"))
        with open(url_file, "w", encoding="utf-8") as f:
            f.write("[InternetShortcut]\n")
            f.write(f"URL={encoded_path}\n")
            f.write(r"IconFile=C:\Program Files\Google\Chrome\Application\chrome.exe" + "\n")
            f.write("IconIndex=0\n")
        print("Updated Desktop URL:", url_file)

        # 3b. Create .LNK shortcut via PowerShell
        ps_script = f"""
$sh = New-Object -ComObject WScript.Shell
$sc = $sh.CreateShortcut('{desktop_onedrive}\\BROSAN ERP KOKPITI.lnk')
$sc.TargetPath = 'cmd.exe'
$sc.Arguments = '/c start "" "{app_html}"'
$sc.WorkingDirectory = '{dir_path}'
$sc.Description = 'Brosan Tekstil Tam Tesekkullu On ve Genel Muhasebe ERP Sistemi'
if (Test-Path 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') {{
    $sc.IconLocation = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe,0'
}}
$sc.Save()
"""
        subprocess.run(["powershell", "-NoProfile", "-Command", ps_script], check=True)
        print("Created Desktop LNK:", os.path.join(desktop_onedrive, "BROSAN ERP KOKPITI.lnk"))

if __name__ == "__main__":
    setup_launchers()
