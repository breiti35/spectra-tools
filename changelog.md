# Changelog - Version 0.1.5.2 Alpha

## [0.1.5.2 Alpha] - 2026-01-17
### Fixed
- **Library:** Negative prompts are now correctly displayed in the library cards.
- **Library:** Fixed a bug where copying a prompt would fail due to variable shadowing.
- **Database:** Corrected mapping of `negative_prompt` field from API response.
- **Stability:** Extensive code refactoring to resolve linter errors (hoisting, unused variables) across all components.

### Added
- **Linux Support:** Added helper scripts (`dev.sh`, `start.sh`, `build.sh`) for easier usage on Linux/Unix systems.

## [0.1.5.1 Alpha] - 2026-01-04
### Added
- **UI:** New welcome page (Home) with module descriptions.
- **UI:** Sidebar navigation update with Home link.
- **i18n:** New translations for welcome page.
- **Version:** Bumped to 0.1.5.1.

## [0.1.5 Alpha] - 2026-01-04
### Added
- **Security:** Path Traversal protection for Image View API.
- **Security:** Command Injection mitigation for ComfyUI start.
- **Security:** Cloud Mode restrictions for filesystem APIs.
- **Performance:** Async I/O refactoring for all file operations.
- **Feature:** Wildcard support in Generator (backend integration).
- **Docs:** Updated README with security & performance section.

## [0.1.4 Alpha] - 2026-01-03

### ✨ Neue Features
- **Wildcard-System (Magic Prompts):**
    - Unterstützung für benutzerdefinierte Wortlisten via `__wildcard__` Syntax.
    - Automatisches Auflösen von Platzhaltern beim Generieren.
    - **Visual Highlighting:** Wildcards werden im Output farblich markiert (Lila) und zeigen beim Hover den ursprünglichen Platzhalter an.
    - **Quick-Access Buttons:** Dynamische Anzeige verfügbarer Wildcards unter dem Eingabefeld.
    - **Interaktiver Info-Hint:** Erklärt den Speicherort (`server/wildcards/`) für eigene Listen.

### 🛠️ Optimierungen & Fixes
- **Generator Logik:** Komplette Überarbeitung des Prompt-Resolvers, um die Herkunft jedes Wortes (fest getippt vs. gewürfelt) zu tracken.

## [0.1.3] - 2026-01-02

### ✨ Neue Features
- **Integrierte ComfyUI Konsole:** Echtzeit-Anzeige der Konsolenausgabe direkt im Spectra Tools Dashboard (Web-Terminal).
- **Robuster Prozess-Stopp:** Neue Kill-Logik, die den ComfyUI-Prozess zuverlässig über den belegten Port (8188) beendet.
- **Start-Methoden:** Unterstützung für verschiedene `.bat`-Dateien der portablen ComfyUI-Version.
- **UI Branding:** Browser-Tab Titel auf "Spectra Tools" geändert und Projekt-Logo als Favicon integriert.

### 🛠️ Optimierungen & Fixes
- **Console UX:** Auto-Scroll auf den Log-Container begrenzt (kein Springen der gesamten Seite mehr).
- **Theme-Support:** Terminal-Konsole für den Hellmodus optimiert (helles Design statt komplett schwarz).
- **Kompakter Mode-Toggle:** Der Dark/Light-Mode Button wurde verkleinert und platzsparender gestaltet.
- **Bugfixes:** Synchronisation beim Leeren der Konsole verbessert.

## [0.1.2] - 2026-01-02

### ✨ Neue Features
- **ComfyUI Integration:**
    - Direktes Starten von ComfyUI aus Spectra Tools heraus.
    - Unterstützung für portable Versionen und Batch-Dateien (`run_nvidia_gpu.bat`).
    - Echtzeit-Statusüberwachung via Port-Check (Port 8188).
    - Modell-Browser für installierte Checkpoints im ComfyUI-Ordner.
    - Option "Als Administrator starten" für Windows-Kompatibilität hinzugefügt.
- **Projekt Dokumentation:**
    - `Agent.md`: Tiefgreifende technische Dokumentation für KI-Agenten.
    - `BACKLOG.md`: Strukturierte Liste für zukünftige Optimierungen und Features.

### 🛠️ Optimierungen & Fixes
- **Windows Prozess-Management:** Umstellung auf PowerShell `Start-Process`, um ComfyUI in einem sichtbaren Fenster zu starten (bessere Fehlersuche).
- **Backend Stabilität:** Verbesserte Pfad-Erkennung und Fehlerbehandlung beim Ausführen externer Programme.
- **UI/UX:** Dynamische Sidebar-Navigation (ComfyUI erscheint nur bei konfiguriertem Pfad).
- **Bugfixes:** JSX-Syntaxfehler in den Einstellungen behoben.

## [0.1.1] - 2026-01-02

### ✨ Neue Features
- **Generator History:** Die letzten 5 generierten Prompts werden nun im Verlauf angezeigt und können mit einem Klick wiederhergestellt werden.
- **Generator Dice Roll (Inspiration):** Ein neuer Würfel-Button ermöglicht das Einfügen von zufälligen, kreativen Motiv-Ideen.
- **Token-Counter:** Live-Anzeige der Wortanzahl im Generator-Output zur besseren Kontrolle der Prompt-Länge.
- **Negativ-Prompt Presets:** Schnellauswahl-Buttons für Universal, Realistic und Artistic Negative-Prompts.
- **Favoriten-System (Bibliothek):** Prompts können jetzt mit einem Stern markiert werden.
- **Bibliothek Management:** Button zum vollständigen Leeren der Prompt-Bibliothek hinzugefügt.
- **GitHub Ready:** Vollständige Unterstützung für lokale und Cloud-Umgebungen via `APP_MODE`.

### 🛠️ Optimierungen & Fixes
- **Metadaten-Workflow:**
    - Paste-Support (Strg+V) für Bilder hinzugefügt.
    - Strukturierte Anzeige von Sampler, Steps, CFG und Modell.
    - "An Generator senden" Funktion implementiert.
    - Prompt-Cleaner (✨) zur Entfernung technischer Tags.
    - "Speichern"-Button in Metadaten entfernt, um die Bibliothek exklusiv für den Generator zu halten.
- **Calculator Upgrade:**
    - Visuelle Live-Vorschau des Seitenverhältnisses.
    - Social Media Presets hinzugefügt (TikTok, Instagram).
    - Upscaling-Dimensionen (1.5x, 2x, 4x) mit Kopierfunktion.
    - Anpassbare Pixel-Rundung (8, 16, 32, 64).
- **Internationalisierung (i18n):** Alle Texte und dynamischen Meldungen (Alerts/Fehler) sind nun auf Deutsch und Englisch verfügbar.
- **UI/UX:**
    - Neues Logo implementiert und Größe optimiert.
    - Farbschema vollständig auf ein einheitliches Blau harmonisiert.
    - Dark/Light Mode Logik gefixt und CSS-Integration via Tailwind v4 optimiert.
- **Datenbank:** Konfigurationen (wie Sprache) werden jetzt permanent in der SQLite-Datenbank gespeichert.

---
*Vorbereitet für den Push auf GitHub.*
