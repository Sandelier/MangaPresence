## Version 2.1.1

### Fixed
- reloadServer was using the child process kill, which is asynchronous. However, I was doing it synchronously, which meant that when I called stopServer right after startServer, it was essentially killing the server that I had just started with startServer
- Forget to set encoding for SetServerOnStartup.bat caused path to be wrongly assigned for special characters Like "Työpöytä" became "Ty”p”yt„".
- Fixed the program console not opening sometimes. The reason was that in startUpScrit.js the path that was in "serverTray" variable was not properly handling spaces when launching an shell.
- Fixed couple console logs in server.js that were not display the errors.
- Default "Watch together" was showing "Watching in room (ep)" even tho it was supposed to be "Watching in room. ep (ep)"

### Removed
- Removed the unnecessary (Y/N) in SetServerOnStartup since it already contains the [Y/N].

### Added
- Added way to exit child process with "Ctrl + C" when using console interface.

### To Do
<<<<<<< HEAD
- Making sure that the program works on linux too.
=======
- The program sometimes doesn't start on different pcs. The reason is currently unknown. When I tested it on a clean virtual machine, it worked fine, so I don't really know where the issue lies. My first thought was that it's something to do with the startup script, but since a clean virtual machine can start it up, I don't really know the reason for the unexpected launching problem
- Making sure that the program works on linux too.
>>>>>>> 8a1a1da76be8e52dd3e5cb9c104f52d7cf3951ce
