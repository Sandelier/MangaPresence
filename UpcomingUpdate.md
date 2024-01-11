## Version 2.1.1

### Fixed
- reloadServer was using the child process kill, which is asynchronous. However, I was doing it synchronously, which meant that when I called stopServer right after startServer, it was essentially killing the server that I had just started with startServer
- Forget to set encoding for SetServerOnStartup.bat caused path to be wrongly assigned for special characters Like "Työpöytä" became "Ty”p”yt„".
- Fixed the program console not opening sometimes. The reason was that in startUpScrit.js the path that was in "serverTray" variable was not properly handling spaces when launching an shell.
- Fixed couple console logs in server.js that were not display the errors.
- Fixed the default "Watch together" to show "Watching in room. ep (ep)" becaue before it was showing accidentaly "Watching in room (ep)" which was confusing.
- Fixed the issue where chapter count was not properly being retrieved in example in "Mangakakalot" because the chapter count was using underscore instead of hyphen which i was not checking.
- Fixed the contentscript if statement for unknown pages where I was previously checking if chEp.count === null, but I forgot to account for the fact that earlier in the code, I am making chEp null, which means it was causing errors to be thrown because I was trying to access the key of a value that was null.
- The Looking state had a problem where I was checking in discordPresence.js if data.installment.count is defined, but the problem with it is that the Looking state doesn't have count; instead, the installment is null, which caused errors to be thrown when using the Looking state.
- Fixed contentScript failing to get SELECT values correctly. Previously, it was selecting all values in SELECT and not the one that was currently selected, which was causing an error because the state was longer than 128 characters.
- Fixed contentScript not using default methods for familiar sites to get the title when trying to use selectors, and it returns null.
- In discordPresence.js, the type was doing a case-sensitive check instead of a non-case-sensitive one.
- server.js now resets oldDetails and oldState from discordPresence.js when the closeRPC message is called.
- In Chromium contentScript, I just learned that sendMessage in Chromium doesn't have a catch method, so I modified it to use try and catch
- In discordPresence.js and contentScript on two lines i was using (installment) to check if it was undefined or null but i forgot to include an check if its also an zero which meant that previously "Chapter 0" would be false since 0 gives out an false instead of truth.

### Removed
- Removed the unnecessary (Y/N) in SetServerOnStartup since it already contains the [Y/N].
- Removed toggleMessageListener when executing contentScript since its not necessary anymore instead we are doing it when startExtension is called so popup html and contentscript both can work with messageListener immediately. Since if we execute toggleMessageListener when executing contentScript only then it means the popup html would only work on sites where the program can scrape.

### Added
- Added a way to exit the child process with "Ctrl + C" when using the console interface.
- Added an "arrays" array to the background script that contains preferences, familiarArray, and excludedSites so we can retrieve them easily with arrays[arrayname].
- Contentscript familiar sites check now tries to get the type if it's not given.
- Added a Popup HTML where you can modify familiarArray/excludedSites/preferences so you don't need to modify them directly in the JSON config file.
- Added that installment is retrieved from the title of the document in contentScript, which increases accuracy for default ways since some sites have the chapter count in the title instead of the URL.
- Modified the pageData response message to be in a switch statement and also added a case for a 204 code.
- Modified the closing of presence from 3 minutes to 1 minute.

### To Do
- Maybe I could use a query selector to find popular ways of showing episodes/chapters or titles.
- In Chromium, the content script is not executed right after the extension connects to the server, unlike in Firefox where it does work