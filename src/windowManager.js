define([
], function (
) {
    "use strict";

    var mainWindow,
        windows = [],
        applicationWindows = [],
        eventListeners = {},
        allowableEventTypes = new Set(["register", "remove"]);


    function addEventListener(eventName, eventListener) {
        // Check if this event can be subscribed to via this function:
        if (!allowableEventTypes.has(eventName)) return;

        // Add event if not in table:
        if (eventListeners[eventName] == null) eventListeners[eventName] = [];

        // Check if eventListener is a function:
        if (eventListener == null || eventListener.constructor !== Function) throw "addEventListener requires argument 'eventListener' of type Function";

        // Check if eventListener is already added:
        if (eventListeners[eventName].indexOf(eventListener) >= 0) return;

        // Add event listener:
        eventListeners[eventName].push(eventListener);
    }
	var on = addEventListener;
	
	function once(eventName, eventListener) {
		function onceListener() {
			off(eventName, onceListener);
			eventListener.apply(this, arguments);
		}
		
		on(eventName, onceListener);
	};

    function removeEventListener(eventName, eventListener) {
        // If event listeners don't exist, bail:
        if (eventListeners[eventName] == null) return;

        // Check if eventListener is a function:
        if (eventListener == null || eventListener.constructor !== Function) throw "removeEventListener requires argument 'eventListener' of type Function";

        // Remove event listener, if exists:
        var index = eventListeners[eventName].indexOf(eventListener);
        if (index >= 0) eventListeners[eventName].splice(index, 1);
    }
	var off = removeEventListener;

    function triggerEvent(eventName) {
        // If event listeners don't exist, bail:
        if (eventListeners[eventName] == null) return;

        var args = [];
        for (var index = 1; index < arguments.length; index += 1) {
            args.push(arguments[index]);
        }

        for (var index = 0; index < eventListeners[eventName].length; index += 1) {
            // Call listener with the 'this' context as the current window:
            eventListeners[eventName][index].apply(null, args);//.apply(this, args);
        }
    }

    function registerWindow(window) {
        windows.push(window);
        triggerEvent("register", window);
    }

    function registerApplicationWindow(window) {
        applicationWindows.push(window);
    }

    function removeWindow(window) {
        var index = windows.indexOf(window);
        if (index >= 0) {
            windows.splice(index, 1);
            triggerEvent("remove", window);
        }
    }

    function removeApplicationWindow(window) {
        var index = applicationWindows.indexOf(window);
        if (index >= 0) applicationWindows.splice(index, 1);
    }

    function getWindow(title) {
        for (var index = 0; index < windows.length; index += 1) {
            if (windows[index].getTitle() === title) return windows[index];
        }
    }

    function getWindows() {
        return windows.slice();
    }

    function getApplicationWindows() {
        return applicationWindows.slice();
    }

    function getWindowByElement(element) {
        // Function returns the window object that contains the element:
        /*var elWindow = element.ownerDocument.defaultView;

        for (var wndID in wnds) {
            if (elWindow === wnds[wndID].contentWindow) return wnds[wndID];
        }*/
        return element.ownerDocument.defaultView.windowWrapper;
    }

    function getWindowByName(name) {
        for (var i = 0; i < windows.length; i += 1) {
            if (windows[i]._config.name === name) {
                return windows[i];
            }
        }
    }

    var lut = []; for (var i = 0; i < 256; i++) { lut[i] = (i < 16 ? '0' : '') + (i).toString(16); }
    function genUID_e7() {
        var d0 = Math.random()*0xffffffff|0;
        var d1 = Math.random()*0xffffffff|0;
        var d2 = Math.random()*0xffffffff|0;
        var d3 = Math.random()*0xffffffff|0;
        return lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
          lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
          lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
          lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
    }
    function getUniqueWindowName() {
        var nameExists = true,
            name = "window" + genUID_e7();

        // Generate random UUID window name:
        for (var i = 0; i < windows.length; i += 1) {
            if (windows[i].getTitle() === name) {
                name = "window" + genUID_e7();
                i = 0;
            }
        }

        return name;
    }
	
	function getVisibleWindows() {
		var visibleWindows = [];
		
        for (var index = 0; index < windows.length; index += 1) {
            if (windows[index].isVisible()) visibleWindows.push(windows[index]);
        }
		
		return visibleWindows;
	}

    return {
        addEventListener: addEventListener,
		on: on,
		once: once,
        removeEventListener: removeEventListener,
		off: off,
        registerWindow: registerWindow,
        registerApplicationWindow: registerApplicationWindow,
        removeWindow: removeWindow,
        removeApplicationWindow: removeApplicationWindow,
	    getWindow: getWindow,
	    getWindows: getWindows,
	    getApplicationWindows: getApplicationWindows,
	    getWindowByElement: getWindowByElement,
	    getWindowByName: getWindowByName,
        getUniqueWindowName: getUniqueWindowName,
		getVisibleWindows: getVisibleWindows
	};
});
