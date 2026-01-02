# Spectra Tools (v0.1.3)

Spectra Tools ist eine All-in-One-Suite für KI-Bildgenerierungs-Workflows. Diese Webanwendung vereint leistungsstarke Tools zur Prompt-Erstellung, Bildanalyse und Verwaltung in einer modernen, benutzerfreundlichen Oberfläche.

## Aktuelle Updates & Features

### 🧩 ComfyUI Integration (Neu!)
- **Control Center:** Starte und stoppe ComfyUI direkt aus der App heraus.
- **Integrierte Konsole:** Verfolge den Server-Status in einem Web-Terminal mit Echtzeit-Logs.
- **Modell-Browser:** Übersicht über installierte Checkpoints direkt im ComfyUI-Ordner.
- **Windows-Optimiert:** Unterstützung für portable Versionen (`.bat`-Dateien) und Admin-Rechte.

### 🌐 Internationalisierung (i18n)
- **Vollständige Mehrsprachigkeit:** Unterstützung für Deutsch 🇩🇪 und Englisch 🇺🇸.
- **Datenbank-Persistenz:** Deine Sprachwahl wird permanent in der SQLite-Datenbank gespeichert.

### 🖼️ Optimierter Metadaten-Inspektor
- **Paste-Support (Strg+V):** Bilder direkt aus der Zwischenablage einfügen.
- **Strukturierte Parameter:** Automatische Extraktion von Sampler, Steps, CFG Scale und Modell-Informationen (A1111 & ComfyUI).
- **Direkt-Workflow:** Prompts mit einem Klick (🚀) direkt in den Generator laden.
- **Prompt-Cleaner:** Bereinigung technischer Tags (`<lora...>`, Gewichte) für sauberes Kopieren.

### 🧮 Professional Calculator
- **Visuelle Vorschau:** Dynamische Darstellung des gewählten Seitenverhältnisses.
- **Social Media Presets:** Vordefinierte Formate für TikTok, Instagram & Co.
- **Upscale-Rechner:** Sofortige Vorschau der Dimensionen für 1.5x, 2x und 4x Upscaling.

### 📚 Streamlined Library & Gallery
- **Favoriten-System (⭐):** Markiere deine besten Prompts; wird permanent in der DB gespeichert.
- **Local Gallery:** Durchsuche deine lokalen Bilderordner direkt in der App.
- **Generator History:** Die letzten 5 generierten Prompts sind jederzeit abrufbar.

### 🌓 Theme & UI
- **Modernes Design:** Dark/Light Mode mit kompaktem Toggle und Tailwind v4 Integration.
- **Custom Branding:** Einheitliches Farbschema und optimiertes Browser-Icon.

## Tech-Stack

- **Frontend:** React 19 (Vite), Tailwind CSS v4
- **Backend:** Node.js + Express
- **Datenbank:** SQLite (`server/pormt.db`)

## Projektstruktur

```text
pormt/
|-- client/                 # React/Vite Frontend
|   |-- src/
|   |   |-- components/     # UI-Module (Generator, ComfyManager, Gallery, etc.)
|   |   |-- lib/            # i18n, DB-Helper, Metadata-Logik
|-- server/
|   |-- server.js           # Express API & Konfiguration (ComfyUI Steuerung)
|   |-- database.js         # SQLite Schema-Setup
|   |-- pormt.db            # Permanente Datenspeicherung
|-- Agent.md                # Technische Dokumentation für Agenten
|-- BACKLOG.md              # Geplante Features & Optimierungen
|-- dev.bat                 # Development-Start (Nodemon + Vite)
```

## Installation und Start

Voraussetzung: Node.js (LTS empfohlen).

1. **Abhängigkeiten installieren:**
   ```bash
   npm install && cd client && npm install
   ```

2. **Konfiguration:**
   Erstelle eine `.env` Datei im Hauptverzeichnis:
   ```env
   PORT=3000
   APP_MODE=local  # 'local' für volle Features (Windows), 'cloud' für Server
   DB_PATH=./pormt.db
   ```

3. **Start:**
   Führe die `dev.bat` aus oder starte Server und Client manuell via `npm run dev`.

## Dokumentation für Entwickler
Weitere Details zur Architektur und zum Code findest du in der [Agent.md](./Agent.md). Geplante Features sind im [BACKLOG.md](./BACKLOG.md) gelistet.

## Lizenz

## 👨‍💻 Author & Philosophy

**Developed by [breiti35](https://github.com/breiti35)**

This project, `spectra-tools`, is the result of dedicated work to simplify spectral analysis tools.
The logic and structure reflect a specific approach to handling data efficiently.

If you use this tool or parts of its code, please respect the [MIT License](LICENSE) and keep the attribution to the original author.

> *"Respect the code, respect the creator."*
