# Spectra Tools

Spectra Tools ist eine All-in-One-Suite für KI-Bildgenerierungs-Workflows. Diese Webanwendung vereint leistungsstarke Tools zur Prompt-Erstellung, Bildanalyse und Verwaltung in einer modernen, benutzerfreundlichen Oberfläche.

## Aktuelle Updates & Features

### 🌐 Internationalisierung (i18n)
- **Vollständige Mehrsprachigkeit:** Unterstützung für Deutsch 🇩🇪 und Englisch 🇺🇸.
- **Datenbank-Persistenz:** Deine Sprachwahl wird permanent in der SQLite-Datenbank gespeichert.

### 🖼️ Optimierter Metadaten-Inspektor
- **Paste-Support (Ctrl+V):** Bilder direkt aus der Zwischenablage einfügen.
- **Strukturierte Parameter:** Automatische Extraktion von Sampler, Steps, CFG Scale und Modell-Informationen (Automatic1111).
- **Direkt-Workflow:** Prompts mit einem Klick (🚀) direkt in den Generator laden.
- **Prompt-Cleaner:** Bereinigung technischer Tags (`<lora...>`, Gewichte) für sauberes Kopieren.

### 🧮 Professional Calculator
- **Visuelle Vorschau:** Dynamische Darstellung des gewählten Seitenverhältnisses.
- **Social Media Presets:** Vordefinierte Formate für TikTok, Instagram & Co. (9:16, 4:5).
- **Upscale-Rechner:** Sofortige Vorschau der Dimensionen für 1.5x, 2x und 4x Upscaling.
- **Pixel-Rounding:** Wählbare Rundung (8, 16, 32, 64 px) für optimierte KI-Generierung.

### 📚 Streamlined Library
- **Minimalistisches Design:** Fokus auf Textinhalte für maximale Übersicht.
- **Favoriten-System (⭐):** Markiere deine besten Prompts; wird permanent in der DB gespeichert.
- **Sortierung & Suche:** Sortierung nach Neueste, Älteste oder Favoriten.
- **Exklusivität:** Die Bibliothek ist dem Generator vorbehalten, um eine saubere Sammlung zu garantieren.

### 🌓 Theme & UI
- **Dark/Light Mode:** Voll funktionsfähiger Toggle mit Tailwind v4 `@config` Integration.
- **Vereinheitlichtes Farbschema:** Konsistente Nutzung von Blau als Primärfarbe in der gesamten App.

## Tech-Stack

- **Frontend:** React 19 (Vite), Tailwind CSS v4
- **Backend:** Node.js + Express
- **Datenbank:** SQLite (`server/pormt.db`)

## Projektstruktur

```text
pormt/
|-- client/                 # React/Vite Frontend
|   |-- src/
|   |   |-- components/     # UI-Module (Generator, Gallery, Calculator, etc.)
|   |   |-- lib/            # i18n, DB-Helper, Metadata-Logik
|-- server/
|   |-- server.js           # Express API & Konfiguration
|   |-- database.js         # SQLite Schema-Setup
|   |-- pormt.db            # Permanente Datenspeicherung
|-- dev.bat                 # Development-Start
|-- start.bat               # Production-Start
```

## Installation und Start

Voraussetzung: Node.js (empfohlen: LTS).

1. **Abhängigkeiten installieren:**
   ```bash
   npm install && cd client && npm install
   ```

2. **Konfiguration:**
   Erstelle eine `.env` Datei im Hauptverzeichnis (basierend auf `.env.example`):
   ```env
   PORT=3000
   APP_MODE=local  # 'local' für volle Features, 'cloud' für Server-Deployment
   DB_PATH=./pormt.db
   ```

3. **Start (Entwicklung):**
   Führe die `dev.bat` aus oder:
   ```bash
   # Terminal 1
   node server/server.js
   # Terminal 2
   cd client && npm run dev
   ```

## Lizenz

Dieses Projekt ist für die persönliche Nutzung und Weiterentwicklung gedacht.