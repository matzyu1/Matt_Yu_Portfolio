@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ship-to-github.ps1" %*
