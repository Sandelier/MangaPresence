## Version 2.1.1

### Fixed
- reloadServer was using the child process kill, which is asynchronous. However, I was doing it synchronously, which meant that when I called stopServer right after startServer, it was essentially killing the server that I had just started with startServer
- Forget to set encoding for SetServerOnStartup.bat caused path to be wrongly assigned for special characters Like "Työpöytä" became "Ty”p”yt„".
- Fixed the program console not opening sometimes. The reason was that in startUpScrit.js the path that was in "serverTray" variable was not properly handling spaces when launching an shell.
- Fixed couple console logs in server.js that were not display the errors.
- Fixed the default "Watch together" to show "Watching in room. ep (ep)" becaue before it was showing accidentaly "Watching in room (ep)" which was confusing.
- Fixed the issue where chapter count was not properly being retrieved in example in "Mangakakalot" because the chapter count was using underscore instead of hyphen which i was not checking.

### Removed
- Removed the unnecessary (Y/N) in SetServerOnStartup since it already contains the [Y/N].

### Added
- Added way to exit child process with "Ctrl + C" when using console interface.

### To Do
- Adding popup html where you can edit + see familiarArray, excludedSites and preferences.