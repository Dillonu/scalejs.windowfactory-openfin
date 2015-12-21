define([
    './geometry',
    './eventSystem'
], function (
    geometry,
    eventSystem
) {
    "use strict";

    var _isReady = false,
        readyListeners = [],
        openFinManager = {
            version: "0.0.0.0",
            majorVersion: 0,
            isReady: function () {
				return _isReady;
			},
			onReady: function (callback) {
				// Check if already is ready:
				if (_isReady) return callback();

				// Check if eventListener is a function:
				if (callback == null || callback.constructor !== Function) throw "onReady requires argument 'callback' of type Function";
				
				// Check if eventListener is already added:
				if (readyListeners.indexOf(callback) >= 0) return;

				// Add event listener:
				readyListeners.push(callback);
			}
        };
    
	fin.desktop.main(function () {
	    fin.desktop.System.getVersion(function (version) {
	        openFinManager.version = version;
	        openFinManager.majorVersion = +version.split(".")[0];
	        _isReady = true;
			for (var index = 0; index < readyListeners.length; index += 1) {
				readyListeners[index]();
			}
			readyListeners = [];
	    });
	});

	return openFinManager;
});
