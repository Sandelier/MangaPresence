const fs = require('fs');
const readline = require('readline');


function readFile(filePath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        const emptyData = '[]';
        fs.writeFileSync(filePath, emptyData, 'utf8');
      }
  
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

async function main() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	let shouldExit = false;

	while(!shouldExit) {
		console.log('Choose an option:');
		console.log('1 - Open Familiararray');
		console.log('2 - Open Excludedarray');
		console.log('3 - Open Clientid');
		console.log('0 - Exit');

        const userInput = await askQuestion(rl, `Please enter 0, 1, 2, or 3: `);

		switch(userInput) {
			case '0':
				console.log('Exiting the program...');
				shouldExit = true;
				break;
			case '1':
				try {
					await handleArray(rl, './configs/familiarArray.json', 'familiarArray');
				} catch (error) {
					console.error('Error reading familiarArray:', error);
				}
				break;
			case '2':
				try {
					await handleArray(rl, './configs/excludedArray.json', 'excludedArray');
				} catch (error) {
					console.error('Error reading excludedArray:', error);
				}
				break;
			case '3':
				try {
					const clientId = await readFile('configs/clientId.json');
					await handleClientId(clientId, rl);
				} catch (error) {
					console.error('Error reading clientId:', error);
				}
				break;
			default:
				console.log('Invalid input. Please try again.');
				break;
		}
	}

	rl.close();
}
main();

async function handleArray(rl, savePath, arrayName) {
    try {
        const array = await readFile(savePath);
        const originalArray = JSON.parse(JSON.stringify(array));
        const folderPath = './configs/oldConfigs';
        const filePath = `${folderPath}/${arrayName}_oldArray.json`;

        console.clear();
        let exitLoop = false;

        while (!exitLoop) {
            if (0 < array.length) {
                console.log(`${arrayName} Array:`);
                array.forEach((obj, index) => {
                    console.log(`${index} - ${JSON.stringify(obj.url)}`);
                    console.log('Enter the index of the object you want to see.');
                    console.log(`To remove an object use "index remove"`);
                });
            } else {
                console.log(`${arrayName} is empty`);
            }

            console.log(`To add a new object write "add"`);
            console.log('Type "exit" to exit');

            const userInput = await askQuestion(rl, ' ');

            if (userInput.toLowerCase().startsWith('exit')) {
                console.log(`Exiting ${arrayName} array list.`);
                exitLoop = true;
            } else if (userInput.toLowerCase().startsWith('add')) {
                while (true) {
                    const newObject = arrayName === 'familiarArray' ? await addFamiliarUrlData(rl) : await addExcludedUrlData(rl);
                    array.push(newObject);

                    const continueAdding = await askQuestion(rl, 'Do you want to add another url? (yes/no): ');
                    if (continueAdding.toLowerCase() !== 'yes') {
                        break;
                    }
                }
            } else {
                const index = parseInt(userInput);
                console.clear();

                if (isNaN(index) || index < 0 || index >= array.length) {
                    console.log('Invalid index. Please enter a valid index or type "exit" to exit.');
                } else {
                    const selectedObject = array[index];
                    console.log(`Selected Object at index ${index}:`);
                    console.log(selectedObject);

                    const inputParts = userInput.split(" ");
                    if (inputParts.length === 2 && inputParts[1].toLowerCase() === "remove") {
                        const confirmRemove = await askQuestion(rl, 'Are you sure you want to remove this object? (yes/no): ');

                        if (confirmRemove === "yes") {
                            array.splice(index, 1);
                            console.log(`Selected Object at index ${index} has been removed.`);
                        } else {
                            console.log('Object removal canceled.');
                        }
                    }
                }
            }
        }

        const saveUpdatedArray = await askQuestion(rl, `Do you want to save the updated ${arrayName} array? (yes/no): `);

        if (saveUpdatedArray === "yes") {
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }

            fs.writeFileSync(savePath, JSON.stringify(array, null, 2));
            fs.writeFileSync(filePath, JSON.stringify(originalArray, null, 2));

            console.log(`Updated ${arrayName} array has been saved.`);
        } else {
            console.log(`Updated ${arrayName} array was not saved.`);
        }

        console.clear();
    } catch (error) {
        console.error(`Error reading or handling ${arrayName} array:`, error);
    }
}

async function addExcludedUrlData(rl) {
    const jsonObject = {};

    const urlSelector = await askQuestion(rl, 'Enter a url: ');

    jsonObject.url = urlSelector;

    console.log('Your JSON object:');
    console.log(JSON.stringify(jsonObject, null, 2));

    return jsonObject;
}

async function addFamiliarUrlData(rl) {
    const jsonObject = {
        url: '',
        scrapeInfo: {},
    };

    jsonObject.url = await askQuestion(rl, 'Enter the URL: ');

    const title = await gatherSelectors(rl, 'Title');
    if (Array.isArray(title) && title.length > 0) {
        jsonObject.scrapeInfo.Title = title;
    }

    const episode = await gatherSelectors(rl, 'Episode');
    if (Array.isArray(episode) && episode.length > 0) {
        jsonObject.scrapeInfo.Episode = episode;
    }

    const watch2togetherInfo = await getWatch2TogetherInfo(rl);
    if (watch2togetherInfo) {
        jsonObject.Watch2Token = watch2togetherInfo.token;
    }

    jsonObject.imageKey = await askQuestion(rl, 'Enter the imageKey value: ');
    jsonObject.imageText = await askQuestion(rl, 'Enter the imageText value: ');

    console.log('Your JSON object:');
    console.log(JSON.stringify(jsonObject, null, 2));

    return jsonObject;
}

async function gatherSelectors(rl, selectorType) {
    const selectors = [];

    while (true) {
        const selector = await askQuestion(rl, `Enter a selector for the ${selectorType} (or "done" to finish): `);

        if (selector === 'done') {
            break;
        } else {
            selectors.push(selector);
        }
    }

    return selectors;
}

async function getWatch2TogetherInfo(rl) {
    while (true) {
        const watch2togetherQuestion = await askQuestion(rl, 'Does the website have watch together? (yes/no)');

        switch (watch2togetherQuestion) {
            case 'yes':
                const watch2getherToken = await askQuestion(rl, 'Enter the Watch2Token value: ');
                return { token: watch2getherToken };
            case 'no':
                return null;
            default:
                console.log('Invalid input. Please answer "yes" or "no".');
        }
    }
}

function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function handleClientId(clientId, rl) {
    console.clear();

    console.log('Current clientId:', clientId);
    const newClientId = await askQuestion(rl, 'Provide a new clientId: ');

    const newJsonId = {
        'clientId': newClientId
    };

    const saveUpdatedArray = await askQuestion(rl, 'Do you want to save the updated clientId? (yes/no): ');

    if (saveUpdatedArray.toLowerCase() === "yes") {
        const folderPath = './configs/oldConfigs';
        const filePath = `${folderPath}/clientId_oldArray.json`;

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }

        fs.writeFileSync('./configs/clientId.json', JSON.stringify(newJsonId, null, 2));
        fs.writeFileSync(filePath, JSON.stringify(clientId, null, 2));

        console.log(`Clientid has been saved.`);
    } else {
        console.log(`Clientid was not saved.`);
    }

    console.clear();
}