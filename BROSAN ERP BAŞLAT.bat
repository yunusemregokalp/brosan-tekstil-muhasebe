@echo off
chcp 65001 >nul
title BROSAN ERP
echo Brosan ERP Sistemi Baslatiliyor...
start "" "%~dp0app\index.html"
exit
