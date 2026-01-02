# Changelog - Version 0.1.1

Alle aktuellen Änderungen und Optimierungen in der Übersicht.

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
