
# MangaPresence

MangaPresence is a browser extension that, with a node.js server, updates your Discord rich presence based on the manga or anime you're currently reading/watching. Currently MangaPresence is only for windows currently. What sets it apart from other similar anime or manga Discord rich presence applications is its dynamic functionality. It functions seamlessly on most sites right out of the package, and with minimal effort, it can practically work on most websites.

- Size: ~43mb

![Reading](showcase/Reading%20manga.png)
![Watching](showcase/Watching%20anime.png)
![Watching in room](showcase/Watching%20in%20room.png)


## Table of Contents
- [MangaPresence](#MangaPresence)
- [How to use MangaPresence](#how-to-use-mangapresence)
  - [Install latest release](#install-latest-release)
  - [Installing MangaPresence Extension](#installing-mangapresence-extension)
  - [Creating discord bot](#creating-discord-bot)
- [Startup](#startup)
  - [Automatic startup](#automatic-startup)
  - [Manual Startup](#manual-startup)
- [Filtering of sites](#filtering-of-sites)
  - **Popup**
  - **Familiar array**
  - **Excluded sites**
- [Customizing Discord Presence Preferences](#customizing-discord-presence-preferences)
- [Compatibility](#compatibility)
- [Questions](#questions)
- [Licensing](#licensing)
- [Acknowledgement](#acknowledgement)


## How to use MangaPresence
To use MangaPresence follow these steps:

1. ### Install latest release
   - You can install latest release of the extension and server in [here](https://github.com/Sandelier/MangaPresence/releases/latest).

2.  ### Installing MangaPresence Extension
	- Firefox
    	- Go to the firefox folder in the extension folder
		- Simply drag and drop the xpi file onto your firefox browser
		- And an prompt will appear, asking if you want to add the extension.
	- Chrome and brave
		- Go to url chrome://extensions/
		- Enable "Developer mode" in the top right corner of the page
		- Click the "Load unpacked"
		- And select the corresponding folder in the extensions folder.

3. ### Creating discord bot
	  To update discord rich presence you need an discord bot and below is instructions to how you can create your own discord bot.
	- Go to [here](https://discord.com/developers/applications?new_application=true).
	- Create a new application and give it a name that represents your bot.
	- In the sidebar, navigate to the "OAuth2" section.
	- Copy your bot's client ID.
	- Open clientId config file in the server's config folder and put your clientId into the "clientId" key.
	- If you want to show the website icon then you can read instructions in the "Filtering of sites" part. In short you have to send the website icons into your discord bot and include the name in familiarArray so that it can retrieve the icon.

Once you have successfully created your Discord bot and added its client ID to the client Id config file, **make sure that your discord is running** and then MangaPresence will be ready to function but you might want to change like familiarArray.json or preferences.json that are talked more down on readme.

## Startup 

1. ###  Automatic startup
   If you want that the server starts up on startup you can run "SetServerOnStartup.bat" that will create an shortcut to your start up folder. 

2. ### Manual Startup
   To start the server manually, run the "NoConsole.bat" or "Console.bat" in the "server/startup" folder.


## Filtering of sites
- **Popup**
  - With popup you can modify familiar sites, excluded sites and preferences without the need of modifying the config files directly.
- **Familiar array**
  - MangaPresence works primarily by checking the hostnames of the urls and checking if they contain "manga" or "anime". However, you can manually include urls in the familiar array in the configs folder to extend the accuracy of scraping. With familiar array you can include urls, discord images, watch together, query selectors for titles and episodes/chapters, should it show "looking" type sites and should it only scrape websites that have been specified in familiar array. With familiar array you can also include like crunchyroll website even tho it dosent contain "manga" or "anime" in its hostname. I talk little bit more about query selectors in the questions.
 - **Excluded sites**
	 - You can exclude domains or subdomains by adding domains to excluded sites in configs folder.

## Customizing Discord Presence Preferences
- MangaPresence allows you to modify preferences to tailor your own preferences. To modify them follow the steps below.
	- Go to "configs" folder in the server directory and then find "preferences.json"
	- Inside the JSON file, you'll find sections for different types of states and preferences for them.
	```
	"Manga": {
	  "Reading": {
	    "details": "Reading {title}",
	    "state": "{installment}",
	    "buttons": [
	      { "label": "Reading", "url": "{siteUrl}" },
	      { "label": "Github", "url": "https://github.com/Sandelier/MangaPresence" }
	    ]
	  }
	}
	```
	- The "details", "state" and "buttons" have certain limitations.
		- They have to be fewer then 32 characters, as discord limits them to this length and if you do exceed the limit the program will automatically truncate the content to prevent errors.
		- Maximium of two buttons.
	- If you dont add any content to them then program will default to using the manga or anime title and installment number.

	- You can utilize variables within the "details", "state" and "buttons" to dynamically insert information
		- {title}: Represents the title of the manga or anime you're currently watching. If you have set familiarArray to scrape "Looking" states then it will also show the current website name when in "Looking" state.
		- {installment}: Displays the chapter or episode number if available.
		- {siteUrl}: Provides the url of the current website, suitable for buttons ot link dynamically.
	


## Compatibility
1. Tested on Firefox version 115.0.2
2. Tested on Chrome version 115.0.5790.171
3. Tested on Brave version 1.56.20
4. Tested on Node.js version 18.17.1
5. Made in Node.js version 20.3.1
	- Librarys:
		- discord-rpc - 4.0.1
		- systray - 1.0.5
		- pkg - 5.8.1
		- @angablue/exe - 2.0.2

<details>
<summary><h2>Questions</h2></summary> 

- ### Server
   - **Why is my server closing instantly**
     - There are many reasons as to why the server might close instantly, but the most common issue is either that you forgot to include client id in the configs terminal or your discord is not on. If its not those reasons then you could launch "Console.bat" in the "startup" folder which enables you to see terminal so you can identify the error.
- ### Extension
	- **Can't scrape a page? Not scraping correctly?**
		- If you want to specify an url that dosen't contain "manga" or "anime" in its hostname, you can add the url to the familiar array in the configs terminal. However, the familiar array wont allow you to scrape every page even if you specify the url in the array if it contains blacklisted words like "register", "login" or "account"
		- Certain query selectors arent allowed on familiar array due to security reasons. The keywords include "form", "password", and "username"
	- **Don't want an page to be scraped?**
		- You can include an excluded urls in the configs terminal and selecting the "excluded sites" in the terminal to exclude subdomains or full domains.
- ### Privacy policy
	- MangaPresence dosen't save any data that is provided to it by the browser. The only things that is saved are the config files that you edit via the configs terminal.
	- MangaPresence dosen't connect to any other external servers other then discords api through "discord-rpc" library other then that everything is done in localhost.
- ### Uninstalling
	- If you have set the sever to start up automatically, you can press the "StartServerOnStartup" again and it will prompt you to remove the shortcut, Once you remove the shortcut, you can delete the server files.
- ### Query selectors examples.
	- Query selectors are methods to select elements in webpages. Below i will show couple examples on how to accurately select query selectors.
	- **Scraping title**
		-  ```
			<div class="wrapper">
			  <aside class="content">
			    <div class="poster">...</div>
			    <div class=" info">
		          <div class="meta">...</div>
		          <div class="name" itemprop="name">Title</div>
		      ```
			
			-	To retrieve the title we can for example use ```div.info div.name[itemprop="name"]```
	-	**Scraping chapter**
		-	```
			<li class="page-item w-100">
			  <button id="numberlist-toggler" class="btn btn-sidebar">
			    <span class="menu-collapsed">
			      <span class="number-current-type">Chapter</span>
			      <span class="number-current">0</span>
		      ```
			-	To retrieve the chapter count we can for example use ```button#numberlist-toggler span.menu-collapsed span.number-current```
</details>

<details>
   <summary><h2>Licensing</h2></summary>

   MangaPresence is open-source software distributed under the MIT License. This means that you are free to use, modify, and distribute the extension as long as you include the original copyright notice and disclaimers. For more details, please refer to the [LICENSE](https://github.com/Sandelier/MangaPresence/blob/main/LICENSE) file.
</details>



<details>
   <summary><h2>Acknowledgement</h2></summary>
   
   [discord-rpc](https://www.npmjs.com/package/discord-rpc) - Used for easy access to discord rich api  
   [systray](https://www.npmjs.com/package/systray) - Used for tray  
   [pkg](https://www.npmjs.com/package/pkg) - Used for bundling  
   [@angablue/exe](https://www.npmjs.com/package/@angablue/exe) - Used so we can easily modify the exe file.

</details>
