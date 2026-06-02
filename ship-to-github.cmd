@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ship-to-github.ps1" %*
