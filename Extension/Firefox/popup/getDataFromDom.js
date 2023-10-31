


const arrays = {
	familiarArray: {
		data: [],
		modified: false
	},
	excludedSites: {
		data: [],
		modified: false
	},
	preferences: {
		data: [],
		modified: false
	}
};

document.addEventListener("DOMContentLoaded", function() {

	const saveButtons = document.querySelectorAll(".saveEntry-btn");
	saveButtons.forEach(function(saveBtn) {
		saveBtn.addEventListener("click", function() {
			const datacontValue = saveBtn.closest("[datacont]").getAttribute("datacont");
			const jsonData = getDataFromDom(datacontValue);

			// We could do an check if arrays[datacontValue] is same as jsondata but we would need to stringify it which is quite intensive task.
			// So we doing it in the server.
			arrays[datacontValue].data = jsonData;
			arrays[datacontValue].modified = true;
		});
	});
});

// Takes "familiarArray", "excludedSites" or "preferences"
function getDataFromDom(dataCont) {
	const tooltips = document.querySelectorAll(`div[datacont="${dataCont}"] .tooltip`);
	let datas;

	if (dataCont == 'preferences') {
		datas = {};
	}
	else {
		datas = [];
	}

	tooltips.forEach(tooltip => {
		if (dataCont === 'familiarArray') {
			const urlElement = tooltip.querySelector('.item-style[key="url"] .input-style');
			// if urlElement since the config booleans dont have url but they are in familiarArray.
			if (urlElement) {
				const url = urlElement.value.trim();

				// Checking if url is valid since that's the only thing that is necessary to be in the data.
				// If it errors, then we just skip the tooltip.
				try {
					new URL(url);
				}
				catch (error) {
					return;
				}
			}
		}

		let data = {};

		if (dataCont === 'preferences') {
			const span = tooltip.previousElementSibling;

			// Four deep meanins its either manga/anime since they are four item-styles deep.
			const isFourDeep = tooltip.querySelectorAll('.item-style .item-style .item-style .item-style');

			// itemStyles contain either the details/state/buttons or it will contain the item divs that contains them.
			const itemStyles = tooltip.querySelectorAll('.item-style:not(.item-style .item-style)');

			if (isFourDeep.length > 0) {
				const currentKey = span.textContent.trim();
				const currentData = datas[currentKey] || {};
				itemStyles.forEach(item => {
					const textContent = Array.from(item.childNodes)
						.filter(node => node.nodeType === Node.TEXT_NODE)
						.map(node => node.textContent)
						.join('');
					currentData[textContent] = loopPreferencesTooltip(item, true);
				});
				datas[currentKey] = currentData;
			}
			else if (span && span.tagName === 'SPAN') {
				const currentKey = span.textContent.trim();
				datas[currentKey] = loopPreferencesTooltip(tooltip);
			}
		}
		else {
			// Getting all items that have a key in them that are direct children of the tooltip
			tooltip.querySelectorAll('.item-style[key]:not(.item-style[key] .item-style[key])').forEach(item => {
				data = loopThroughToolTips(item, data);
			});
		}

		if (Object.keys(data).length > 0) {
			datas.push(data);
		}
	});

	return datas;
}

// Used to get json data from familiar array and excluded array tooltip dom structure.
function loopThroughToolTips(item, data) {
	const key = item.getAttribute('key');
	const valueElements = item.querySelector('.input-style, .select-style');
	const values = [];

	const value = valueElements.value;
	if (value) {
		if (value.toLowerCase() === 'true') {
			values.push(true);
		}
		else if (value.toLowerCase() === 'false') {
			values.push(false);
		}
		else {
			values.push(value);
		}
	}

	// Handle scrapeInfo structure
	if (key === 'scrapeInfo') {
		const scrapeInfo = processScrapeInfo(item);
		if (scrapeInfo) {
			data[key] = scrapeInfo;
		}
	}
	else {
		if (values.length === 1) {
			data[key] = values[0];
		}
		else if (values.length > 1) {
			data[key] = values;
		}
	}

	return data;
}

function processScrapeInfo(item) {
	const scrapeInfo = {};
	item.querySelectorAll('.item-style[key]').forEach(scrapeItem => {
		const scrapeKey = scrapeItem.getAttribute('key');
		const scrapeValueElements = scrapeItem.querySelectorAll('.input-style');

		if (!scrapeInfo[scrapeKey]) {
			scrapeInfo[scrapeKey] = [];
		}

		scrapeValueElements.forEach(scrapeEle => {
			const scrapeValue = scrapeEle.value;
			if (scrapeKey && scrapeValue) {
				scrapeInfo[scrapeKey].push(scrapeValue);
			}
		});

		if (scrapeInfo[scrapeKey].length <= 0) {
			delete scrapeInfo[scrapeKey];
		}
	});

	return Object.keys(scrapeInfo).length > 0 ? scrapeInfo : undefined;
}


// Used to get json data from preferences tooltip dom structure.
function loopPreferencesTooltip(tooltip, deeper = false) {
	const currentData = {};

	let topLevelItemStyles;

	// Deeper is used for values of manga and anime since their structure is little bit different.
	if (deeper) {
		topLevelItemStyles = tooltip.querySelectorAll('.item-style .item-style:not(.item-style .item-style .item-style');
	}
	else {
		topLevelItemStyles = tooltip.querySelectorAll('.item-style:not(.item-style .item-style)');
	}


	topLevelItemStyles.forEach(itemStyle => {
		const key = itemStyle.getAttribute('key');
		const input = itemStyle.querySelector('input');
		if (key && key === 'buttons') {
			currentData.buttons = [];
			const buttonItems = itemStyle.querySelectorAll('.item-style[key="label"]');
			buttonItems.forEach(buttonItem => {
				const label = buttonItem.querySelector('input').value;
				const url = buttonItem.nextElementSibling.querySelector('input').value;
				currentData.buttons.push({
					label,
					url
				});
			});
		}
		else if (key && input) {
			currentData[key] = input.value;
		}
	});
	return currentData;
}