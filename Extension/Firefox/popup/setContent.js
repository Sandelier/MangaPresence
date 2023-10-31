document.addEventListener("DOMContentLoaded", function() {

	const setContentBtns = document.querySelectorAll('.setContent-btn');
	const dataDivs = document.querySelectorAll('div[dataCont]');
	// Hides all the other containers that dont have the same attribute as the clicked btn.
	setContentBtns.forEach(setContentBtn => {
		setContentBtn.addEventListener('click', () => {
			const dataAttr = setContentBtn.getAttribute('data');

			dataDivs.forEach(div => {
				if (div.getAttribute('dataCont') === dataAttr) {
					div.style.display = 'block';
				}
				else {
					div.style.display = 'none';
				}
			});
		});
	});

	const addEntryBtns = document.querySelectorAll('.addEntry-btn');

	addEntryBtns.forEach(addEntryBtn => {
		addEntryBtn.addEventListener('click', () => {
			const dataAttr = addEntryBtn.getAttribute('data');
			switch (dataAttr) {
				case 'familiarArray':
					addEmptyEntryToContent('familiarArray', familiarArrayTemplate);
					break;
				case 'excludedSites':
					addEmptyEntryToContent('excludedSites', excludedSitesTemplate);
					break;
			}
		});
	});

	sendPopupMessage('isServerOn');
});

// TemplateMap is an json that contains the expected structure.
// If the data is missing lets say "installment" it will add it if template has it.
function setContent(dataCont, templateMap, data) {
	const contentContainer = document.querySelector(`div[dataCont="${dataCont}"]`);
	contentContainer.style.display = 'none';

	const fragment = document.createDocumentFragment();

	if (dataCont === 'preferences') {
		for (let key in data) {
			const item = data[key];
			const parentElement = document.createElement('div');
			const domStrucEle = dynamicDomStructure(item, templateMap[key]);
			commonHandling(parentElement, domStrucEle, key);
			fragment.appendChild(parentElement);
		}
	}
	else {
		if (dataCont === 'familiarArray') {
			// Handles displayLookingState and useFamiliarArrayOnly.
			// Can't really think of any other way to handle them other than this currently.
			let index = 0;


			for (let key in boolConfigTemplate) {
				const parentElement = document.createElement('div');

				const childDiv = document.createElement("div");
				parentElement.appendChild(childDiv);

				const keyDiv = createEleHelper("div", '', 'item-style');
				keyDiv.setAttribute('key', key);

				const value = data[index][key] || boolConfigTemplate[key];
				const input = createEleHelper("input", value, "input-style");

				keyDiv.appendChild(input);
				childDiv.appendChild(keyDiv);

				commonHandling(parentElement, childDiv, key);
				fragment.appendChild(parentElement);
				index++;
			}
		}

		data.forEach(item => {
			if (!item.hasOwnProperty('displayLookingState') && !item.hasOwnProperty('useFamiliarArrayOnly')) {
				const parentElement = document.createElement('div');
				const domStrucEle = dynamicDomStructure(item, templateMap);

				commonHandling(parentElement, domStrucEle, item);
				fragment.appendChild(parentElement);
			}
		});
	}

	contentContainer.appendChild(fragment);

	// Just returning in case we want to, let's say, display block one of the content.
	return contentContainer;
}

function commonHandling(parentElement, domStrucEle, key) {
	domStrucEle.classList.add('tooltip');
	domStrucEle.style.display = 'none';
	const clickableText = createClickableText(key, domStrucEle);
	parentElement.appendChild(clickableText);
	parentElement.appendChild(domStrucEle);
}

// Adds an button to add an empty entry to familiar or excluded sites from template.
function addEmptyEntryToContent(dataCont, template) {
    const contentContainer = document.querySelector(`div[dataCont="${dataCont}"]`);
    const childDiv = document.createElement('div');

    const emptyDivTemplate = dynamicDomStructure(template, template);
    commonHandling(childDiv, emptyDivTemplate, 'empty');

    contentContainer.appendChild(childDiv);
}



// Takes template which is what the data can have and then data is added to each template key.
// Then returns the dom element.
// Container is not meant to be sent when you call this.
function dynamicDomStructure(data, template, container) {
	const baseDiv = container || document.createElement("div");
	for (const key in template) {
		const keyDiv = createEleHelper("div", key, "item-style");
		keyDiv.style.marginLeft = '20px';
		keyDiv.setAttribute('key', key);

		baseDiv.appendChild(keyDiv);

		// These are data that are in the data that was given by user. 
		// If the data is not object then we use template to get the correct key.
		if (typeof data[key] === "object") {
			if (Array.isArray(data[key])) {
				if (key === 'Installment' || key === 'Title') {
					keyDiv.textContent = '';
					keyDiv.appendChild(addNewEmptyBtn(key));

					data[key].forEach((value) => {
						const valueDiv = createEleHelper("input", value, 'input-style');
						keyDiv.appendChild(valueDiv);
					});

					// For buttons in preferences.
				}
				else {
					data[key].forEach((arrayObj) => {
						const arrayDiv = createEleHelper("div", "", "item-style");
						keyDiv.appendChild(arrayDiv);
						for (const arrayProp in template[key][0]) {
							const arrayHolder = createEleHelper("div", arrayProp, "item-style");
							arrayHolder.setAttribute('key', arrayProp);
							arrayHolder.style.marginLeft = '20px';

							const arrayPropDiv = createEleHelper("input", arrayObj[arrayProp] || "", "input-style");
							arrayHolder.appendChild(arrayPropDiv);
							arrayDiv.appendChild(arrayHolder);
						}
					});
				}
			}
			else {
				dynamicDomStructure(data[key], template[key], keyDiv);
			}

			//  Checking if buttons are missing in data if they are then adding from template.
		}
		else if (key === "buttons" && !data[key]) {
			const buttonsTemplate = template[key];
			buttonsTemplate.forEach((button) => {
				const buttonDiv = createEleHelper("div", "", "item-style");
				keyDiv.appendChild(buttonDiv);

				for (const buttonProp in button) {
					const arrayHolder = createEleHelper("div", buttonProp, "item-style");
					arrayHolder.style.marginLeft = '20px';

					const buttonPropDiv = createEleHelper("input", button[buttonProp] || "", "input-style");
					arrayHolder.appendChild(buttonPropDiv);
					buttonDiv.appendChild(arrayHolder);
				}
			});
		}
		else {
			// let because if key is type we can change it.
			let valueDiv = createEleHelper('input', "", 'input-style');
			valueDiv.value = data[key] || "";

			// If the user given data dosent contain scrapeInfo.
			if (Object.keys(template[key]).length > 1) {
				for (let arrayKey in template[key]) {

					let arrayKeyDiv = createEleHelper('div', '', 'item-style');
					arrayKeyDiv.setAttribute('key', arrayKey);
					arrayKeyDiv.style.marginLeft = '20px';

					if (key == 'scrapeInfo') {
						arrayKeyDiv.appendChild(addNewEmptyBtn(arrayKey));
					}

					const arrayValue = createEleHelper("input", '', 'input-style');
					arrayKeyDiv.appendChild(arrayValue);
					keyDiv.appendChild(arrayKeyDiv);
					valueDiv = null;
				}
			}

			if (key === 'url') {
				keyDiv.textContent = '';

				const btnParent = createEleHelper('div', key, 'btnParent');

				const rootUrlBtn = createEleHelper('button', '🏠', 'btnStyles');

				rootUrlBtn.addEventListener('click', function() {
					const elementNum = this.getAttribute('data-button-num');
					sendPopupMessage('getUrl', {
						which: 'rootUrl',
						number: elementNum
					});
				});

				const fullUrlBtn = createEleHelper('button', '', 'btnStyles');
				fullUrlBtn.style.backgroundImage = "url('images/browser.webp')";

				fullUrlBtn.addEventListener('click', function() {
					const elementNum = this.getAttribute('data-button-num');
					sendPopupMessage('getUrl', {
						which: 'fullUrl',
						number: elementNum
					});
				});

				btnParent.appendChild(rootUrlBtn);
				btnParent.appendChild(fullUrlBtn);


				keyDiv.appendChild(btnParent);

				// When url input changes we change the clickableText value.
				valueDiv.addEventListener('input', function() {
					const inputValue = valueDiv.value;
					const spanElement = valueDiv.parentElement.parentElement.parentElement.querySelector("span");
					spanElement.textContent = inputValue;

					if (spanElement.textContent.length == 0) {
						spanElement.textContent = 'empty';
					}
				});
				// Adds the buttons for installment or title if they do not exist.
			}
			else if (key === 'Installment' || key === 'Title') {
				keyDiv.textContent = '';
				keyDiv.appendChild(addNewEmptyBtn(key));
				// Creates type checkbox.
			}
			else if (key === 'Type') {

				valueDiv = createEleHelper('select', '', 'select-style');

				const options = ['', 'Anime', 'Manga', 'Manwha', 'Manhua'];

				let isOptionSelected = false;
				for (let i = 0; i < options.length; i++) {
					const option = document.createElement('option');
					option.value = options[i];
					option.text = options[i];

					if (data[key] && options[i].toLowerCase() === data[key].toLowerCase()) {
						option.selected = true;
						isOptionSelected = true;
					}

					valueDiv.appendChild(option);
				}

				if (!isOptionSelected) {
					valueDiv[0].selected = true;
				}
			}
			if (valueDiv != null) {
				keyDiv.appendChild(valueDiv);
			}
		}
	}

	return baseDiv;
}


// Just an helper so we dont need to keep copying same code constantly.
// Creates an element and returns it depending on what args you give.

let elementNum = 0;

function createEleHelper(type, text, classString) {
	const element = document.createElement(type);
	if (classString) {
		var classes = classString.split(' ');
		element.classList.add(...classes);
	}

	// Giving buttons an number so we can identify which button activated what, when talking with background script.
	if (type === 'button') {
		element.setAttribute('data-button-num', elementNum);
		elementNum++;
	}

	if (type == 'input') {
		element.value = text;
		return element;
	}

	element.textContent = text;
	return element;
}

function addNewEmptyBtn(key) {
	const btnParent = createEleHelper('div', key, 'btnParent');
	const addNewBtn = createEleHelper('button', '+', 'btnStyles');

	btnParent.appendChild(addNewBtn);

	addNewBtn.addEventListener('click', function() {
		const inputElements = btnParent.parentElement.querySelectorAll('input.input-style');

		// Checking if the inputs have data in them and if they do then create new input
		// Otherwise dont create.
		const inputsData = Array.from(inputElements).every(input => input.value.trim() !== '');

		if (inputsData) {
			const inputElement = createEleHelper('input', '', 'input-style');
			btnParent.parentElement.appendChild(inputElement);
		}
	});

	return btnParent;
}

// Creates the span that can be clicked to showcase the tooltip.
function createClickableText(item, domStrucEle) {

	const clickableText = createEleHelper('span', '', 'clickableTextStyle');
	let parentDiv;

	// Adding remove entry btn to entrys that have url.
	if (domStrucEle.querySelector(`div[key="url"]`)) {
		parentDiv = createEleHelper('div', '', 'btnParent');
		parentDiv.style.justifyContent = 'space-between';
		const trashBtn = createEleHelper('button', '🗑', 'btnStyles');

		trashBtn.addEventListener('dblclick', function() {
			const parentElement = trashBtn.parentElement;
			parentElement.parentElement.remove();
		});

		parentDiv.appendChild(clickableText);
		parentDiv.appendChild(trashBtn);
	}

	const firstKey = Object.keys(item)[0];
	if (firstKey == 0) {
		// For item that is not an json instead just an string.
		clickableText.textContent = item;
	}
	else if (firstKey === 'url' && item.url) {
		// Item that is for the queryselectors.
		clickableText.textContent = item.url;
	}
	else {
		// Booleans.
		clickableText.textContent = firstKey;
	}

	clickableText.addEventListener('click', function() {
		const allTooltips = document.querySelectorAll('.tooltip');
		allTooltips.forEach(tooltip => {
			if (tooltip !== domStrucEle) {
				tooltip.style.display = 'none';
			}
		});
		if (domStrucEle.style.display === 'none') {
			domStrucEle.style.display = 'block';
		}
		else {
			domStrucEle.style.display = 'none';
		}
	});

	if (parentDiv) {
		return parentDiv;
	}
	return clickableText;
}


function handleUrlButtons(url, eleNum, which) {
	if (which !== 'fullUrl' && which !== 'rootUrl') {
		console.warn(`Unknown 'which' value given to handleUrlButtons. ${which}`);
		return;
	}

	url = new URL(url);

	const correctUrl = which === 'fullUrl' ? url : url.origin;
	const buttonClicked = document.querySelector(`button[data-button-num="${eleNum}"]`);

	if (buttonClicked) {
		const parentElement = buttonClicked.parentElement;
		const inputElement = parentElement.nextElementSibling;
		inputElement.value = correctUrl;

		const inputEvent = new Event('input', {
			bubbles: true
		});
		inputElement.dispatchEvent(inputEvent);
	}
	else {
		console.warn(`Button with data-button-num="${eleNum}" not found.`);
	}
}