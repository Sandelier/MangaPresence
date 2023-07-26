
# MangaPresence

MangaPresence is a browser extension for Firefox that enhances your Discord presence by automatically updating it in real-time based on the anime or manga you are currently watching or reading. This extension utilizes a Node.js server to facilitate seamless communication between the extension and Discord's rich presence API.

![Reading](showcase/Reading%20manga.png)
![Watching](showcase/Watching%20anime.png)
![Watching in room](showcase/Watching%20in%20room.png)

# Table of Contents

- [MangaPresence](#mangapresence)
- [How to Use MangaPresence](#how-to-use-mangapresence)
  - [Installing MangaPresence Extension](#installing-mangapresence-extension)
  - [Create Your Discord Bot](#create-your-discord-bot)
  - [Configuring Excluded and Familiar Sites](#configuring-excluded-and-familiar-sites)
- [Host Name Requirements](#Host-Name-Requirements)
- [Automatic Startup (Recommended)](#automatic-startup-recommended)
- [Manual Startup](#manual-startup)
- [Compatibility](#compatibility)
- [Questions](#Questions)
  - Common Errors
    - Server
    - Extension
  - Plans
  - Uninstalling
- [Privacy policy](#privacy-policy)
- [Licensing](#licensing)
- [Acknowledgement](#acknowledgement)

## How to Use MangaPresence

To use MangaPresence effectively and take advantage of its real-time Discord rich presence functionality, follow these steps:
## Installing MangaPresence Extension

1. Download the MangaPresence extension from the "Firefox" folder of this project.
2. Open Firefox and enter "about:debugging" in the address bar.
3. In the left sidebar, click on "This Firefox."
4. Click the "Load Temporary Add-on" button.
5. Navigate to the location where you downloaded the MangaPresence extension and select the main extension file (usually named "manifest.json").
The MangaPresence extension will be loaded as a temporary addon in Firefox.

## Create Your Discord Bot

To enable the extension to update your Discord presence, you need to create your own Discord bot. Follow these steps:

1. Go to [here](https://discord.com/developers/applications?new_application=true).
2. Create a new application and give it a name that represents your bot.
3. In the sidebar, navigate to the "OAuth2" section.
4. Copy your bot's client ID.
5. Open Helper terminal (instructions below) and select clientId and paste your clientId there.

Once you have successfully created your Discord bot and added its client ID to the extension, **make sure that your discord is running** and then the MangaPresence extension will be ready to function.
## Configuring Excluded and Familiar Sites

To enhance the accuracy of the extension and customize its behavior, you can use the helper terminal to add, remove, and modify excluded and familiar sites and excluded sites in the extension.

  ### Using Helper Terminal for Config Modifications
  1. Open the MangaPresence extension and click on the "Configs" option in the tray menu.
  2. The helper terminal will open, guiding you through the process of adding, removing, or modifying familiar and excluded sites, as well as changing the client ID for your Discord bot.
  3. Simply follow the prompts in the terminal to add or remove sites. The terminal will handle the JSON syntax automatically, so you don't need to worry about it.


### Host Name Requirements

MangaPresence primarily works with host names containing "manga" or "anime." However, you can manually include other URLs in the familiarArray to extend the extension's support for other websites. For example, you can include URLs like "https://www.crunchyroll.com/" in the familiarArray, even though they don't explicitly contain "manga" or "anime" in the host name. This way, you can make the extension work on additional sites that you want to track on Discord's rich presence.

Remember that MangaPresence is designed to be adaptable to various websites and user preferences. By customizing the familiarArray with appropriate CSS selectors and URLs, you can ensure that the extension accurately reflects your anime or manga activities on Discord.
Starting the Server

To ensure the proper functioning of MangaPresence, you need to start the Node.js server. The necessary scripts are located in the "startup" folder.
### Automatic Startup (Recommended)
Run the "SetServerOnStartup.bat" script located in the "startup" folder. This script will add a registry entry to make the server start automatically on system startup. Please note that this is the only part of the setup process where admin permissions will be required. The script adds a registry entry to ensure the server starts automatically on system startup, which requires admin privileges.

### Manual Startup
To start the server manually, run the "NoConsole.bat" script located in the "startup" folder.

With the server up and running, your MangaPresence extension will function as intended, providing real-time updates to your Discord rich presence based on your anime or manga activities.

<details>
   <summary><h3>Compatibility</h3></summary>
   
  **MangaPresence has been tested and works well on the following versions of Firefox**:  
    * Firefox version 115.0.2 and above  
    * Please note that the extension may work on other versions of Firefox as well, but it has been thoroughly tested and confirmed to function correctly on the versions mentioned above.
    * The MangaPresence server is currently designed for Windows, but there are plans to make it available on Linux and Mac in the future.
</details>

<details>
  <summary><h3>Questions</h3></summary>  
  
  ### Server  
  - **Server closing instantly**
	    There are various reasons why the server might close instantly, but the most common issue is an invalid file in the config folder or Discord running in the background. Please double-check that Discord is running, and ensure that your bot's client ID is correct in the "clientId.json" config file. Another possible cause could be invalid entries in your familiar or exclude lists, although this is unlikely to be the main reason for the program shutting down. You can verify if the JSON syntax in your config files is valid by using [this tool](https://jsonlint.com/).

   - **Investigating error reasons**
     The "Nodejs" folder contains a logfile that records events and errors, which might provide helpful information. If it didn't log the specific error, you have a couple of options:
     1. The easiest option is to modify the code in the "hidden.vbs" file located in the "Nodejs/startup" directory. Change the code from  
        ```"CreateObject("Wscript.Shell").Run """" & WScript.Arguments(0) & """", 0, False"```  
        to  
        ```"CreateObject("Wscript.Shell").Run """" & WScript.Arguments(0) & """", 1, False"```  
        This modification will open the program in the terminal, allowing you to view all the errors that may occur.
     2. Another option is to download [Node.js](https://nodejs.org/en), open the command prompt (cmd), navigate to the program's directory path in the command prompt, and execute "npm start". This will start the program in the terminal, enabling you to see all the errors.

  ### Extension
   - **Can't scrape a page?**
     1. If you want to specify a URL that doesn't contain "manga" or "anime" in its hostname, you can add the URL to the "familiarArray.json" file. However, please note that some sites may still not load due to security reasons. For instance, URLs containing "register," "login," or "account" might be blocked.
     2. Certain query selectors are not allowed, even if you add them to the familiarArray, due to security reasons. The restricted query selectors include "form," "password," and "username."

   ### Plans
   - **More Support**
      * I plan to make the extension work on Brave and Chrome in the future.
      * I am also working on adding support for Mac and Linux systems.
      * I plan to add more configuration settings so you can add your own blacklisted words and making that you can style discord presence in your own style.
      * I plan to add that the elapsed time would show the actual time left in the anime (impossible to make it work perfectly because of rate limit but i will try my best)

   ### Uninstalling
   - **How to uninstall?**
      * If you have set the server to start up automatically, you can press it again, and it will prompt you to remove the registry key. Once you remove the key, you can delete the server files.
      * For the extension, you don't need to do anything other than reloading the browser session, and the extension will no longer be active.
</details>



<details>
   <summary><h3>Privacy policy</h3></summary>
   
   **Data Privacy**: MangaPresence does not save any data from the web pages it scrapes. Your browsing history, anime or manga titles, and episode information are not persistently stored or logged. The extension operates in a way that prioritizes user privacy, ensuring that your browsing activity remains private and confidential.
   
   **External Connections**: The only external server MangaPresence connects to is Discord's official server via the "discord-rpc" library. This connection is used solely to update your Discord presence and provide real-time information about the anime or manga you are currently watching or reading. MangaPresence does not establish connections to any other external servers or services. Other than the Discord server, MangaPresence exclusively uses localhost for all its operations.
   
   **Real-Time Operations**: All data processing and updates in MangaPresence are performed in real-time. When you visit a webpage related to anime or manga, the extension extracts relevant information, such as the title and episode number, directly from the page on-the-fly to update your Discord presence. This real-time approach means that no data is stored or logged from the web pages you browse.
</details>

<details>
   <summary><h2>Licensing</h2></summary>
   MangaPresence is open-source software distributed under the MIT License. This means that you are free to use, modify, and distribute the extension as long as you include the original copyright notice and disclaimers. For more details, please refer to the LICENSE file.
</details>

<details>
   <summary><h3>Acknowledgement</h3></summary>
   
   [discord-rpc](https://www.npmjs.com/package/discord-rpc) - Used for easy access to discord rich api  
   [pino](https://www.npmjs.com/package/pino) - Used for logging  
   [systray](https://www.npmjs.com/package/systray) - Used for tray  

</details>
