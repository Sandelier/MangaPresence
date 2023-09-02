## Version 2.1.0

### Fixed
- Added a function to remove any trailing " -" at the end of the title if it contains something like "Solo leveling -". This change ensures that if, for example, the title is "Solo leveling - Chapter 20," it will be displayed as "Solo leveling" instead of "Solo leveling -". This issue mainly occurred with the default scraping methods.


### Removed
- NoConsole.bat and Hidden.vbs

### Added
- Expanded site recognition to include checking for "manhua" and "manhwa" URLs. Previously, the program only checked "manga/anime" domains, making it unable to check websites like "topmanhua."
- Expanded the chapter count to show "Vol" instead of "Ch" if you are reading volumes. Also with this now if you put {installment} to preferences it will be automatically have the correct type on front of it like 'Ep', 'Vol' or 'Ch'.
- Changed the program's launch to "MangaPresence.exe," and if you want to display the console, you can find the "Console.bat" file in the startup folder.
- Started using @angeblue/exe, allowing for easy inclusion of the application name and application image in the .exe file.
- Added a new main entry to the program, which starts a hidden child process if no arguments are given. This change renders NoConsole.bat and Hidden.vbs useless, leading to their removal. It also allows the .exe to be the automatic startup file, rather than just "NoConsole.bat" in the task manager.
- SetServerOnStartup dosent anymore add an registery key instead it just adds an shortcut to startup folder.

### To Do
- Making sure that the program works on linux too.
