define([
], function (
) {
    "use strict";

    var eventListeners = {};

    function addEventListener(eventName, eventListener) {
        // Add event if not in table:
        if (eventListeners[eventName] == null) eventListeners[eventName] = [];

        // Check if eventListener is a function:
        if (eventListener == null || eventListener.constructor !== Function) throw "addEventListener requires argument 'eventListener' of type Function";
        
        // Check if eventListener is already added:
        if (eventListeners[eventName].indexOf(eventListener) >= 0) return;

        // Add event listener:
        eventListeners[eventName].push(eventListener);
    }

    function removeEventListener(eventName, eventListener) {
        // If event listeners don't exist, bail:
        if (eventListeners[eventName] == null) return;

        // Check if eventListener is a function:
        if (eventListener == null || eventListener.constructor !== Function) throw "removeEventListener requires argument 'eventListener' of type Function";

        // Remove event listener, if exists:
        var index = eventListeners[eventName].indexOf(eventListener);
        if (index >= 0) eventListeners[eventName].splice(index, 1);
    }

    function triggerEvent(eventName, args) {
        // If event listeners don't exist, bail:
        if (eventListeners[eventName] == null) return;

        for (var index = 0; index < eventListeners[eventName].length; index += 1) {
            eventListeners[eventName][index].apply(eventListeners[eventName][index], args);
        }
    }

    return {
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        triggerEvent: triggerEvent
    };
});
