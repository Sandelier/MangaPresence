## Version 2.0.1

### Fixed
- Certain manga/anime URLs falsely detected as sensitive information.
  - Example: "Murim login" manga detected "login" incorrectly.

### Removed
- Logger: Removed since it was unnecessary.
- configModify: Removed due to lack of updating.
- Brave extension folder: now uses "Chromium" folder.
- Renamed Chrome extension folder to "Chromium" for clarity.

### To Do
- Identified bugs with NoConsole.bat not working on some PCs.
  - Possible antivirus false positives on hidden.vbs due to its behavior.
    - Possible fix could be to use something like [this](https://github.com/s-h-a-d-o-w/create-nodew-exe/tree/master) instead of vbs.