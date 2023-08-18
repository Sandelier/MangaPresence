## Version 2.0.1

### Fixed
- Certain manga/anime URLs falsely detected as sensitive information.
  - Example: "Murim login" manga detected "login" incorrectly.
- Removed config things from serverTray which in turn fixed the bug where in some pc's the program would freeze up because i think the program was modifying windows tray before its initialized.

### Removed
- Logger: Removed since it was unnecessary.
- configModify: Removed due to lack of updating.
- Brave extension folder: now uses "Chromium" folder.
- Renamed Chrome extension folder to "Chromium" for clarity.

### Added
- Added two buttons to tray. "Check updates" will check if there are new releases and if there is then "Update" will become unlocked and redirects you to the newest release.
- Added as default that it will show the github buttons on the preferences. These can be removed in preferences.json.

### To Do
- Making sure that the program works on linux too.