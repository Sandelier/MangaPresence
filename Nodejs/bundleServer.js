const exe = require('@angablue/exe');

const build = exe({
    entry: './package.json',
    out: './bin/MangaPresence.exe',
    version: '2.2.0',
    target: 'latest-win-x64',
    icon: './icon/icon.ico',
    properties: {
        FileDescription: 'MangaPresence',
        ProductName: 'MangaPresence',
        LegalCopyright: 'MangaPresence https://github.com/Sandelier/MangaPresence/blob/main/LICENSE',
        OriginalFilename: 'MangaPresence.exe'
    }
});

build.then(() => console.log('Build completed!'));