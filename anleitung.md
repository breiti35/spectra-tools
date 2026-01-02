# Git & GitHub Schritt-für-Schritt Anleitung

Diese Anleitung hilft dir dabei, das Projekt **Spectra Tools** (pormt) sicher auf GitHub hochzuladen und zu verwalten.

## 1. Vorbereitung (Einmalig)

Bevor du startest, stelle sicher, dass du [Git installiert](https://git-scm.com/) hast und einen Account auf [GitHub](https://github.com/) besitzt.

### Git Identität festlegen
Öffne ein Terminal (PowerShell oder CMD) und gib deine Daten ein (falls noch nicht geschehen):
```bash
git config --global user.name "Dein Name"
git config --global user.email "deine-email@example.com"
```

---

## 2. Lokales Repository initialisieren

Gehe in dein Projektverzeichnis (`D:\Entwicklungsordnung\pormt`) und führe folgende Befehle aus:

1. **Repository erstellen:**
   ```bash
   git init
   ```

2. **Dateien vormerken:**
   (Dank der bereits erstellten `.gitignore` werden Datenbanken und `node_modules` automatisch ignoriert)
   ```bash
   git add .
   ```

3. **Ersten Commit erstellen:**
   ```bash
   git commit -m "Initial commit: Spectra Tools mit i18n, neuem Calculator und Cloud-Support"
   ```

---

## 3. Auf GitHub hochladen

1. Gehe auf GitHub und erstelle ein neues Repository (Name z.B. `spectra-tools`). **Wichtig:** Wähle *keine* README, .gitignore oder Lizenz aus, da wir diese bereits lokal haben.
2. Kopiere die URL deines neuen Repositories (z.B. `https://github.com/DEIN_USERNAME/spectra-tools.git`).
3. Verbinde dein lokales Projekt mit GitHub:
   ```bash
   # Ersetze die URL mit deiner eigenen
   git remote add origin https://github.com/DEIN_USERNAME/spectra-tools.git
   ```
4. Den Haupt-Branch umbenennen (Standard ist heute `main`):
   ```bash
   git branch -M main
   ```
5. Dateien hochladen:
   ```bash
   git push -u origin main
   ```

---

## 4. Laufende Arbeit & Updates

Wenn du später Änderungen am Code vornimmst, gehst du so vor:

1. **Änderungen prüfen:** `git status`
2. **Änderungen hinzufügen:** `git add .`
3. **Änderungen speichern:** `git commit -m "Beschreibe was du geändert hast"`
4. **Hochladen:** `git push`

---

## 5. Wichtige Hinweise für Spectra Tools

*   **Die `.env` Datei:** Diese Datei wird NICHT auf GitHub hochgeladen (sie steht in der `.gitignore`). Das ist wichtig, um deine privaten Einstellungen (wie Ports oder Pfade) zu schützen.
*   **Die Datenbank:** Deine lokale `pormt.db` wird ebenfalls nicht hochgeladen. Auf GitHub wird nur der Code geteilt. Wenn jemand anderes das Projekt klont, wird beim ersten Start automatisch eine neue, leere Datenbank erstellt.
*   **Cloud-Deployment:** Wenn du das Projekt in der Cloud (z.B. Render oder Vercel) hostest, musst du dort in den Einstellungen ("Environment Variables") den Wert `APP_MODE=cloud` setzen.

---

Viel Erfolg mit deinem Projekt auf GitHub! 🚀
