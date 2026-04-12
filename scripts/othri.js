'use strict';

// Storage wrapper to isolate app data in localStorage
const storage = {
    APP_KEY: 'othri_data',

    _getData() {
        const data = localStorage.getItem(this.APP_KEY);
        return data ? JSON.parse(data) : { items: {}, settings: {} };
    },

    _saveData(data) {
        localStorage.setItem(this.APP_KEY, JSON.stringify(data));
    },

    getItem(key) {
        const data = this._getData();
        return data.items[key] || null;
    },

    setItem(key, value) {
        const data = this._getData();
        data.items[key] = value;
        this._saveData(data);
    },

    removeItem(key) {
        const data = this._getData();
        delete data.items[key];
        this._saveData(data);
    },

    getAllKeys() {
        const data = this._getData();
        return Object.keys(data.items);
    },

    getSetting(key) {
        const data = this._getData();
        return data.settings[key] || null;
    },

    setSetting(key, value) {
        const data = this._getData();
        data.settings[key] = value;
        this._saveData(data);
    },

    removeSetting(key) {
        const data = this._getData();
        delete data.settings[key];
        this._saveData(data);
    },

    clear() {
        this._saveData({ items: {}, settings: {} });
    }
};

const model = {
    createItem(itemDesc, itemDateTime) {
        if (!this.isValidItem(itemDesc, itemDateTime)) return ""; // if item not valid, exit

        const itemId = itemDateTime;
        if (storage.getItem(itemId) === null) { // make sure key doesn't already exist
            storage.setItem(itemId, `${itemDesc}@@@@@${itemDateTime}`);
        }
        else itemId = ""; // set back to blank if couldn't create item

        return itemId;
    },

    createItemJSON(itemDesc, itemDateTime) {
        if (!this.isValidItem(itemDesc, itemDateTime)) return ""; // if item not valid, exit

        const itemId = itemDateTime;
        if (storage.getItem(itemId) === null) { // make sure key doesn't already exist
            storage.setItem(itemId, `${itemDesc}@@@@@${itemDateTime}`);
        }
        else itemId = ""; // set back to blank if couldn't create item

        return itemId;
    },    

    readItem(itemId) {
        const item = storage.getItem(itemId);
        const itemArray = item.split("@@@@@");
        const itemObj = {}
        itemObj.itemDesc = itemArray[0];
        itemObj.itemDateTime = itemArray[1];
        return itemObj;
    },

    readItems(descSearch, dateTimeSearch) { // [[id1, desc1, datetime1], [id2, desc2, datetime2]..]
        let localStorageKeys = storage.getAllKeys();
        localStorageKeys.sort();

        descSearch = descSearch.trim(); // search string cleanup: trim search string
        let descSearchTerms = [];
        if (descSearch.length > 0) {
            while (descSearch.indexOf("  ") >= 0) { // search string cleanup: remove any extraneous spaces
                descSearch = descSearch.replace("  ", " ");
            }
            descSearchTerms = descSearch.split(" "); // if multiple search terms, break them out into array
        }

        dateTimeSearch = dateTimeSearch.trim(); // search string cleanup: trim search string
        let dateTimeSearchTerms = [];
        if (dateTimeSearch.length > 0) {
            while (dateTimeSearch.indexOf("  ") >= 0) { // search string cleanup: remove any extraneous spaces
                dateTimeSearch = dateTimeSearch.replace("  ", " ");
            }
            dateTimeSearchTerms = dateTimeSearch.split(" "); // if multiple search terms, break them out into array
        }

        let items = [];
        for (let i = 0; i < localStorageKeys.length; i++) {
            const itemObj = this.readItem(localStorageKeys[i]);

            let posDescMatch = false; let hasDescPosTerms = false;
            let negDescMatch = false; let hasDescNegTerms = false;
            let posDateTimeMatch = false; let hasDateTimePosTerms = false;
            let negDateTimeMatch = false; let hasDateTimeNegTerms = false;
            
            if (descSearchTerms.length > 0) { // neg desc terms
                for (let searchTerm of descSearchTerms) { // check item vs all neg terms
                    searchTerm = searchTerm.trim(); 
                    if (searchTerm[0] == '-') { 
                        hasDescNegTerms = true;
                        if (itemObj.itemDesc.toLowerCase().includes(searchTerm.slice(1).toLowerCase())) { 
                            negDescMatch = true; 
                            break; 
                        }
                    }
                }
            }

            if (dateTimeSearchTerms.length > 0) { // neg date/time terms
                for (let searchTerm of dateTimeSearchTerms) { // check item vs all neg terms
                    searchTerm = searchTerm.trim(); 
                    if (searchTerm[0] == '-') { 
                        hasDateTimeNegTerms = true;
                        
                        const formattedDateTime = utilities.formatDateTime(itemObj.itemDateTime);                         
                            if (formattedDateTime.toLowerCase().includes(searchTerm.slice(1).toLowerCase())) {                             
                            negDateTimeMatch = true; 
                            break; 
                        }
                    }
                }
            }            

            if (descSearchTerms.length > 0) { // pos desc terms
                for (let searchTerm of descSearchTerms) { 
                    searchTerm = searchTerm.trim(); 
                    if (searchTerm[0] != '-') { 
                        hasDescPosTerms = true;
                        if (itemObj.itemDesc.toLowerCase().includes(searchTerm.toLowerCase())) { 
                            posDescMatch = true; 
                            break; 
                        }
                    }
                }
            }

            if (dateTimeSearchTerms.length > 0) { // pos date/time terms
                for (let searchTerm of dateTimeSearchTerms) { // check item vs all neg terms
                    searchTerm = searchTerm.trim(); 
                    if (searchTerm[0] != '-') { 
                        hasDateTimePosTerms = true;

                        const formattedDateTime = utilities.formatDateTime(itemObj.itemDateTime);                                                 
                        if (formattedDateTime.toLowerCase().includes(searchTerm.toLowerCase())) { 
                            posDateTimeMatch = true; 
                            break; 
                        }
                    }
                }
            }            

            //debugger;

            let searchHandled = false;
            if (!searchHandled)
                if (hasDescNegTerms && negDescMatch) searchHandled = true; // neg term/match: exclude

            if (!searchHandled)
                if (hasDateTimeNegTerms && negDateTimeMatch) searchHandled = true; // pos term/match: exclude

            if (!searchHandled)
                if (hasDescPosTerms && !posDescMatch) searchHandled = true; // pos term/no match: exclude

            if (!searchHandled)
                if (hasDateTimePosTerms && !posDateTimeMatch) searchHandled = true; // pos term/no match: exclude

            if (!searchHandled) { // include in every other case
                items.push([localStorageKeys[i], itemObj.itemDesc, itemObj.itemDateTime]);
                searchHandled = true;    
            }            
        }

        return items;
    },

    updateItem(currentItemId, itemDesc, itemDateTime) {
        const newItemId = itemDateTime;

        if (newItemId != currentItemId) { // if date/time changed..
            if (storage.getItem(newItemId) === null) { // and new date/time/itemId doesn't already exist..
                this.deleteItem(currentItemId); // delete old item and..
                storage.setItem(newItemId, `${itemDesc}@@@@@${itemDateTime}`); // create new one
                return newItemId;
            }
        }
        else { // otherwise if date/time didn't change, just update existing item
            storage.setItem(currentItemId, `${itemDesc}@@@@@${itemDateTime}`); // create new one
            return currentItemId;
        }

        return "";
    },    

    deleteItem(itemId) {
        storage.removeItem(itemId);
    },

    deleteItems(items) {
        for (let i = 0; i < items.length; i++) {
            this.deleteItem(items[i]);
        }
    },

    deleteAllItems() {
        storage.clear();
    },

    isValidItem(itemDesc, itemDateTime) { 
        itemDesc = this.sanitizeItemDesc(itemDesc);
        if (itemDesc.length <= 0) {
            return false;
        }

        if (itemDesc.indexOf("@@@@@") >= 0) {
            return false;
        }

        if (!this.isValidDateTime(itemDateTime)) {
            return false;
        }
        return true;
    },

    isValidDateTime(dateTime) { 
        let timestamp = Date.parse(dateTime);
        if (isNaN(timestamp) == false) return true;
        return false;
    },   

    sanitizeItemDesc(itemDesc) { 
        let sanitizedItemDesc = itemDesc.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return sanitizedItemDesc.trim();
    },

    createSetting(settingName, settingValue) {
        storage.setSetting(settingName, settingValue);
    },

    readSetting(settingName) {
        return storage.getSetting(settingName);
    },

    deleteSetting(settingName) {
        return storage.removeSetting(settingName);
    }
};

const view = {
    addItemToList(itemId, itemDesc, itemDateTime) { 
        const itemsList = document.getElementById("items_list");
    
        const itemDescDiv = document.createElement('div');
        itemDescDiv.setAttribute("id", `item_desc_${itemId}`);       
        let innerHtml = `<span id='item_desc_${itemId}'>${itemDesc}</span> `;
        itemDescDiv.innerHTML = innerHtml;
        itemsList.insertBefore(itemDescDiv, itemsList.children[itemsList.children.length-0]);        

        const itemActionDiv = document.createElement('div');
        itemActionDiv.setAttribute("id", `item_action_${itemId}`);
        itemActionDiv.setAttribute("class", "align-right");
        innerHtml = `<span id='item_datetime_${itemId}' class='small-italic-gray' style='display: none'>(date/time)</span>` + 
            `<span id='item_datetime_br_${itemId}' style='display: none'><br></span>`;
        innerHtml += `<span id='item_elapsed_vs_now_${itemId}' class='small-italic-blue' style='display: none'>(total elapsed)</span>` + 
            `<span id='item_elapsed_vs_now_br_${itemId}' style='display: none'><br></span>`;
        innerHtml +=  `<span id='item_elapsed_vs_prior_${itemId}' class='small-italic-olive' style='display: none'>(elapsed vs prior)</span>`;
        itemActionDiv.innerHTML = innerHtml; 
        itemsList.insertBefore(itemActionDiv, itemsList.children[itemsList.children.length-0]);
    },

    removeItemFromList(itemId) {
        const itemsList = document.getElementById("items_list");
        itemsList.removeChild(document.getElementById(`item_desc_${itemId}`));
        itemsList.removeChild(document.getElementById(`item_action_${itemId}`));
    },

    selectItem(itemId) {
        document.getElementById(`item_desc_${itemId}`).setAttribute("class", "selected");
        document.getElementById(`item_action_${itemId}`).setAttribute("class", "selected align-right");
        document.getElementById("item_datetime").setAttribute("class", "datetime-show");
        document.getElementById("process_item").innerHTML = "<img src='images/tabler-icons.io/check.svg' id='process_item' title='Update Item'>";
        document.getElementById("delete_item").removeAttribute("hidden");
    },

    stripeItemsList() {
        let div_class = "odd";

        const itemsList = document.getElementById("items_list");
    
        for(let i = 0; i < itemsList.children.length; i++) {
            let div = itemsList.children[i];
            
            if (div.id.startsWith("item_desc_")) {
                div.setAttribute("class", div_class);
            }
    
            if (div.id.startsWith("item_action_")) {
                div.setAttribute("class", div_class + " align-right");
                if (div_class === "odd") 
                    div_class = "even";
                else    
                    div_class = "odd";
            }
        }        
    },

    refreshElapsedTimes(displayDateTime, displayElapsedVsNow, displayElapsedVsPrior) {
        let itemsList = document.getElementById("items_list");
        let priorTimestamp = '';

        for(let i = 0; i < itemsList.children.length; i++) {
            const div = itemsList.children[i];
            
            if (div.id.startsWith("item_desc_")) {
                const timestamp = div.id.replace("item_desc_", "");
                const dateTimeSpan = document.getElementById(`item_datetime_${timestamp}`);
                const dateTimeBrSpan = document.getElementById(`item_datetime_br_${timestamp}`);

                const elapsedTimeSpan = document.getElementById(`item_elapsed_vs_now_${timestamp}`);
                const elapsedTotalBrSpan = document.getElementById(`item_elapsed_vs_now_br_${timestamp}`);

                const elapsedVsPriorSpan = document.getElementById(`item_elapsed_vs_prior_${timestamp}`);                

                let timestampDate = utilities.formatDateTime(timestamp); 

                let startDate = luxon.DateTime.fromISO(timestamp); // 
                let endDate = luxon.DateTime.now();
                let preciseDiff = endDate.diff(startDate, ['years', 'months', 'days', 'hours', 'minutes', 'seconds']);
                preciseDiff.toObject(); //=> { years: xx, months: 1, days: xx, hours: xx, minutes: xx }  
                let totalElapsed = `!${preciseDiff.values.years}y! !${preciseDiff.values.months}m! !${preciseDiff.values.days}d! ` +
                    `!${preciseDiff.values.hours}h! !${preciseDiff.values.minutes}m! !${preciseDiff.values.seconds}s!`;
                totalElapsed = totalElapsed.replace(/\.\d*s/g, 's');
                totalElapsed = totalElapsed.replace('!0y!', '').replace('!0m!', '').replace('!0d!', '').replace('!0h!', '').replace('!0m!', '').replace('!0s!', '');
                totalElapsed = totalElapsed.replace(/!/g, '');
                totalElapsed = totalElapsed.replace(/-/g, '').trim();                
                totalElapsed = `${totalElapsed}`;

                let elapsedVsPrior = '';
                if (priorTimestamp != '') {
                    startDate = luxon.DateTime.fromISO(priorTimestamp);
                    endDate = luxon.DateTime.fromISO(timestamp);
                    preciseDiff = endDate.diff(startDate, ['years', 'months', 'days', 'hours', 'minutes', 'seconds']);
                    elapsedVsPrior = `!${preciseDiff.values.years}y! !${preciseDiff.values.months}m! !${preciseDiff.values.days}d! ` +
                        `!${preciseDiff.values.hours}h! !${preciseDiff.values.minutes}m! !${preciseDiff.values.seconds}s!`;
                    elapsedVsPrior = elapsedVsPrior.replace(/\.\d*s/g, 's');
                    elapsedVsPrior = elapsedVsPrior.replace('!0y!', '').replace('!0m!', '').replace('!0d!', '').replace('!0h!', '').replace('!0m!', '').replace('!0s!', '');
                    elapsedVsPrior = elapsedVsPrior.replace(/!/g, '').trim();
                    if (elapsedVsPrior != "") elapsedVsPrior = `${elapsedVsPrior}`;
                }
    
                priorTimestamp = timestamp;
                
                dateTimeSpan.innerHTML = `${timestampDate}`;
                elapsedTimeSpan.innerHTML = `${totalElapsed}`;
                elapsedVsPriorSpan.innerHTML = `${elapsedVsPrior}`;

                if (!displayDateTime) {
                    dateTimeSpan.style.display = "none";
                    dateTimeBrSpan.style.display = "none";
                }                 
                else {
                    dateTimeSpan.style.display = "inline";
                    if (displayElapsedVsNow || (displayElapsedVsPrior && elapsedVsPrior != "")) dateTimeBrSpan.style.display = "inline";
                }

                if (!displayElapsedVsNow) {
                    elapsedTimeSpan.style.display = "none";
                    elapsedTotalBrSpan.style.display = "none";
                }
                else {
                    elapsedTimeSpan.style.display = "inline";
                    elapsedTotalBrSpan.style.display = "inline";
                }

                if (!displayElapsedVsPrior) {
                    elapsedVsPriorSpan.style.display = "none";
                }
                else {
                    elapsedVsPriorSpan.style.display = "inline";
                } 
            }
        }
    },    

    setItemDesc(itemDesc) {
        document.getElementById("item_desc").value = itemDesc;
    },

    setItemDateTime(itemDateTime) {
        document.getElementById("item_datetime").value = itemDateTime;
    },

    removeAllItemsFromList() {
        const itemsList = document.getElementById('items_list');
        const divList = itemsList.getElementsByTagName('div');

        for(let i = divList.length - 1; i >= 0; i--) {
            if (divList[i].id.startsWith("item_desc_") || divList[i].id.startsWith("item_action_")) {
                divList[i].parentNode.removeChild(divList[i]);
            }
        }
    },

    displayAllItems(items) {
        this.removeAllItemsFromList();
        for (const item of items) {
            this.addItemToList(item[0], item[1], item[2]); // key, desc, dateTime
        }
    },

    showSettings() {
        document.getElementById("settings_div").setAttribute("class", "settings-div-show");
    },

    hideSettings() {
        document.getElementById("settings_div").setAttribute("class", "settings-div-hide");
    },

    outputToDebug(msg, clear=false) {
        const debug = document.getElementById("debug");
        debug.setAttribute("class", "debug-show");
        if (clear) debug.value = "";
        debug.value += `${msg}\n`;
    },
};

const controller = {
    intervalRefreshEnabled: true,
    currentItemId: "",
    isMobile: false,
    displayElapsedVsNow: false,
    displayElapsedVsPrior: false,
    displayDateTime: false,
    displaySettings: false,

    handleClickEvents(event) { 
        let eventHandled = false;

        if (!eventHandled && event.target.id == "process_item") { // create/update clicked
            controller.processItem();
            eventHandled = true;
        }

        if (!eventHandled && event.target.id == "delete_item") { // delete clicked
            const itemDesc = model.readItem(controller.currentItemId).itemDesc;

            if (confirm(`are you sure you want to delete '${itemDesc}'?`)) {
                model.deleteItem(controller.currentItemId);
                view.removeItemFromList(controller.currentItemId);
                controller.resetItemsList();
            }

            eventHandled = true;
        }

        if (!eventHandled && event.target.id.startsWith("item_desc_")) { // specific item clicked
            const itemId = event.target.id.replace("item_desc_", "");
            controller.selectItem(itemId);
            eventHandled = true;
        }

        if (!eventHandled && event.target.id.startsWith("item_action_")) { // specific item clicked
            const itemId = event.target.id.replace("item_action_", "");
            controller.selectItem(itemId);
            eventHandled = true;
        }        

        if (!eventHandled && event.target.id.startsWith("item_elapsed_vs_now_")) { // specific item clicked
            const itemId = event.target.id.replace("item_elapsed_vs_now_", "");
            controller.selectItem(itemId);
            eventHandled = true;
        }

        if (!eventHandled && event.target.id.startsWith("item_elapsed_vs_prior_")) { // specific item clicked
            const itemId = event.target.id.replace("item_elapsed_vs_prior_", "");
            controller.selectItem(itemId);
            eventHandled = true;
        }

        if (!eventHandled && event.target.id == "delete_all") { // remove all clicked
            if (confirm("are you sure you want to delete all visible items?")) {
                controller.intervalRefreshEnabled = false;
                controller.deleteAllVisibleItems();
                controller.reloadItemsList(); 
                controller.intervalRefreshEnabled = true;
            }
            eventHandled = true;
        }

        if (!eventHandled && event.target.id == "display_elapsed_vs_now") { // display count up/dn checkbox
            if (event.target.checked) {
                controller.displayElapsedVsNow = true; 
                model.createSetting("settings-display-elapsed-vs-now", true);
            }
            else {
                controller.displayElapsedVsNow = false; 
                model.deleteSetting("settings-display-elapsed-vs-now");
            }
            eventHandled = true;
        }

        if (!eventHandled && event.target.id == "display_elapsed_vs_prior") { // display count up/dn checkbox
            if (event.target.checked) {
                controller.displayElapsedVsPrior = true; 
                model.createSetting("settings-display-elapsed-vs-prior", true);
            }
            else {
                controller.displayElapsedVsPrior = false; 
                model.deleteSetting("settings-display-elapsed-vs-prior");
            }
            eventHandled = true;
        }        

        if (!eventHandled && event.target.id == "display_datetime") { // display count up/dn checkbox
            if (event.target.checked) {
                controller.displayDateTime = true; 
                model.createSetting("settings-display-datetime", true);
            } 
            else {
                controller.displayDateTime = false;
                model.deleteSetting("settings-display-datetime");
            }
            eventHandled = true;
        }        

        if (!eventHandled && event.target.id == "settings") { 
            if (controller.displaySettings) {
                controller.displaySettings = false;
                model.deleteSetting("settings-display-settings");
                view.hideSettings();
            }
            else {
                controller.displaySettings = true;
                model.createSetting("settings-display-settings", true);
                view.showSettings();
            }
            eventHandled = true;
        }        

        if (!eventHandled && event.target.id == "item_desc") { // do nothing on click
            eventHandled = true;
        }

        if (!eventHandled && event.target.id == "item_datetime") { // do nothing on click
            eventHandled = true;
        }

        if (!eventHandled && event.target.id == "desc_search") { // do nothing on click
            eventHandled = true;
        }

        if (!eventHandled && event.target.id == "datetime_search") { // do nothing on click
            eventHandled = true;
        }

        if (!eventHandled && event.target.id == "debug") { // do nothing on click
            eventHandled = true;
        }

        if (!eventHandled) { // all other clicks
            controller.resetItemsList();
            eventHandled = true;
        }
    },

    selectItem(itemId) {
        controller.resetItemsList(); 
        controller.intervalRefreshEnabled = false; // has to follow resetItemsList because resetItemsList sets this to true
        view.selectItem(itemId); 
        let item = model.readItem(itemId);
        view.setItemDesc(item.itemDesc);
        view.setItemDateTime(item.itemDateTime);
        controller.currentItemId = itemId;
    },

    processItem() { 
        let itemDesc = document.getElementById("item_desc").value.trim();
        itemDesc = model.sanitizeItemDesc(itemDesc);

        if (controller.currentItemId == "") { // create item
            const itemDateTime = utilities.getLocalISOTime();
            const itemId = model.createItem(itemDesc, itemDateTime);
            if (itemId !== "") {
                controller.reloadItemsList(); 
            }                            
        }

        if (controller.currentItemId != "") { // update item
            const itemDateTime = document.getElementById("item_datetime").value;
            const itemId = model.updateItem(controller.currentItemId, itemDesc, itemDateTime);
            if (itemId != "") { // successful update
                controller.currentItemId = "";
                controller.reloadItemsList();
                controller.intervalRefreshEnabled = true;
            }            
        }        
    },

    reloadItemsList() { 
        let items = model.readItems(document.getElementById("desc_search").value.trim(), document.getElementById("datetime_search").value.trim());
        view.displayAllItems(items);
        controller.resetItemsList();
    },

    handlePageLoad() { 
        if (Math.min(window.screen.width, window.screen.height) < 768 || navigator.userAgent.indexOf("Mobi") > -1)
            controller.isMobile = true;
        let descSearch = model.readSetting("settings-search");
        let dateTimeSearch = model.readSetting("settings-datetime-search");

        if (model.readSetting("settings-display-datetime")) { 
            document.getElementById("display_datetime").checked = true;
            controller.displayDateTime = true;
        }

        if (model.readSetting("settings-display-elapsed-vs-now")) { 
            document.getElementById("display_elapsed_vs_now").checked = true; 
            controller.displayElapsedVsNow = true;
        }

        if (model.readSetting("settings-display-elapsed-vs-prior")) {
            document.getElementById("display_elapsed_vs_prior").checked = true;
            controller.displayElapsedVsPrior = true;
        }

        if (descSearch && descSearch.length > 0)
            document.getElementById("desc_search").value = model.readSetting("settings-search");

        if (dateTimeSearch && dateTimeSearch.length > 0)
            document.getElementById("datetime_search").value = model.readSetting("settings-datetime-search");            

        if (model.readSetting("settings-display-settings")) {
            controller.displaySettings = true;
            view.showSettings();
        }
        
        controller.reloadItemsList();

        /*
        // fetch test - begin
        //https://javascript.info/promise-chaining has examples of json responses, try this!
        //let p1 = fetch("https://roylu.com/fetchtest"); 
        let p1 = fetch("https://api.weather.gov/alerts/active?area=TX");

        // the initial resolve from fetch returns a response object, but it only includes headers
        // we have to create a new promise from this intial response like this to get the full url text..
        p1.then(function(response) { 
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            return response.text(); // this returns a new promise that we can handle with the next chained 'then'
            //return response.json(); // could call this instead which returns a promise that returns a json object instead
        }
        ).then(function(text) {
            view.outputToDebug(`text: ${text}`, true); // at this point in the flow we finally have the full text of the url..
        });
        // fetch test - end
        */

        //view.outputToDebug(`handlePageLoad end: ${controller.displayDateTime}`);
    },

    handleKeyUpEvents(event) {
        if (event.keyCode === 27) { // esc key
            controller.resetItemsList(); 
        }    
    },

    handleItemKeyUpEvent(event) { 
        if (event.keyCode === 13) { // enter key
            controller.processItem();
        }    
    },

    handleItemSearchKeyUpEvent(event) { 
        if (event.keyCode === 13) { // enter key
            const descSearch = document.getElementById("desc_search").value.trim()
            if (descSearch.length > 0)
                model.createSetting("settings-search", descSearch);
            else
                model.deleteSetting("settings-search");

            const dateTimeSearch = document.getElementById("datetime_search").value.trim()
            if (dateTimeSearch.length > 0)
                model.createSetting("settings-datetime-search", dateTimeSearch);
            else
                model.deleteSetting("settings-datetime-search");                
            
            controller.intervalRefreshEnabled = true;
            controller.reloadItemsList();
        }    
    },    

    resetItemsList() {
        view.stripeItemsList(); 

        controller.currentItemId = ""; 
        controller.intervalRefreshEnabled = true;
        document.getElementById("item_datetime").setAttribute("class", "datetime-hide");
        document.getElementById("process_item").innerHTML = "<img src='images/tabler-icons.io/plus.svg' id='process_item' title='Add Item'>";
        document.getElementById("delete_item").setAttribute("hidden", "");
        
        let itemDesc = document.getElementById("item_desc");
        itemDesc.value = '';
        //itemDesc.focus();
    },

    deleteAllVisibleItems() {
        const itemsList = document.getElementById("items_list");    

        let items = [];
        for(let i = 0; i < itemsList.children.length; i++) { // build array of all visible itemId's
            const div = itemsList.children[i];            
            if (div.id.startsWith("item_desc_")) 
                items.push(div.id.replace("item_desc_", ""));    
        }
        model.deleteItems(items);
        controller.reloadItemsList();
    },

    intervalRefresh() {
        if (controller.intervalRefreshEnabled) {
            //view.refreshItemDateTime();
            view.refreshElapsedTimes(controller.displayDateTime, controller.displayElapsedVsNow, controller.displayElapsedVsPrior);
            
            if (!(controller.displayDateTime || controller.displayElapsedVsNow || controller.displayElapsedVsPrior)) {
                document.getElementById("items_list").setAttribute("class", "app-layout-wide"); // if we're not displaying any time fields
            }
            else {
                document.getElementById("items_list").setAttribute("class", "app-layout"); // if we are displaying some time field(s)
            }
        }
    },
};

const utilities = {
    formatDateTime(timestamp) { // return this kind of format: 7/4/23 9:35am
        let timestampDate = new Date(timestamp); 
        timestampDate = timestampDate.toLocaleString('en-US');
        const commaPos = timestampDate.indexOf(","); // make year 2 digits
        timestampDate = timestampDate.substring(0, commaPos-4) + timestampDate.substring(commaPos-2); // make year 2 digits
        timestampDate = timestampDate.replace(/, /ig, " "); // remove comma
        timestampDate = timestampDate.replace(/:\d{2} /ig, " "); // remove seconds
        timestampDate = timestampDate.replace(/ AM/ig, "am"); // remove seconds
        timestampDate = timestampDate.replace(/ PM/ig, "pm"); // remove seconds
        return timestampDate;
    },

    getLocalISOTime() { // return this kind of format: 2023-01-25T09:15
        let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
        let localISOTime = (new Date(Date.now() - tzoffset)).toISOString().substring(0, 19);
        return localISOTime;
    },

}

// wire events to controller
document.getElementById("item_desc").addEventListener('keyup', controller.handleItemKeyUpEvent);
document.getElementById("item_datetime").addEventListener('keyup', controller.handleItemKeyUpEvent);
document.getElementById("desc_search").addEventListener('keyup', controller.handleItemSearchKeyUpEvent);
document.getElementById("datetime_search").addEventListener('keyup', controller.handleItemSearchKeyUpEvent);
document.addEventListener('keyup', controller.handleKeyUpEvents);
window.addEventListener('click', controller.handleClickEvents);
window.addEventListener("load", controller.handlePageLoad);
window.setInterval(controller.intervalRefresh, 1000);
