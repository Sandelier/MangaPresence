## Version 2.0.2

### Fixed
- Added that it removes an trailing " -" at the end if the title contains like "Solo leveling -". This makes it so if in example title name is "Solo leveling - Chapter 20" it would be displayed as "Solo leveling" instead of "Solo leveling -". This was an issue mainly in the default scraping methods.


### Removed
- 

### Added
- Expanded the recognition of sites by including it to check for "manhua" and "manwha" urls. Previously it was unable to check websites like "topmanhua" because the program only checked "manga/anime" domains.
- Expanded the chapter count to show "Vol" instead of "Ch" if you are reading volumes. Also with this now if you put {installment} to preferences it will be automatically have the correct type on front of it like 'Ep', 'Vol' or 'Ch'.

### To Do
- Making sure that the program works on linux too.
