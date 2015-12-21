define([
    'scalejs!core',
    './geometry',
    './monitorManager',
    './windowManager',
    './openFinManager',
    './BaseWindow',
    './DockWindow'
], function (
    core,
    geometry,
    monitorManager,
    windowManager,
    openFinManager,
    BaseWindow,
    DockWindow
) {
    'use strict';

    // There are few ways you can register an extension.
    // 1. Core and Sandbox are extended in the same way:
    //      core.registerExtension({ part1: part1 });
    //
    // 2. Core and Sandbox are extended differently:
    //      core.registerExtension({
    //          core: {corePart: corePart},
    //          sandbox: {sandboxPart: sandboxPart}
    //      });
    //
    // 3. Core and Sandbox are extended dynamically:
    //      core.registerExtension({
    //          buildCore: buildCore,
    //          buildSandbox: buildSandbox
    //      });
	
	var _isReady = false,
		mainWindow,
        readyListeners = [];
	
	function isGlobalReady() {
        return _isReady;
    }
	
    function onReady(callback) {
        // Check if already is ready:
        if (isGlobalReady()) return callback();

        // Check if eventListener is a function:
        if (callback == null || callback.constructor !== Function) throw "onReady requires argument 'callback' of type Function";
        
        // Check if eventListener is already added:
        if (readyListeners.indexOf(callback) >= 0) return;

        // Add event listener:
        readyListeners.push(callback);
    }
	
    function getMainWindow() {
        return mainWindow;
    }
	
	fin.desktop.main(function () {
        var app = fin.desktop.Application.getCurrent();
        mainWindow = new DockWindow(fin.desktop.Window.getCurrent());
        mainWindow._isSetup = true;
        mainWindow.onSetup = function (callback) {
            if (mainWindow._isSetup) {
                callback.call(this);
            } else {
                this.addEventListener("setup", callback);
            }
        };
		monitorManager.onReady(function () {
			openFinManager.onReady(function () {
				_isReady = true;
				for (var index = 0; index < readyListeners.length; index += 1) {
					readyListeners[index]();
				}
				readyListeners = [];
			});
		});
    });
	
    core.registerExtension({
        windowfactory: {
			Vector: geometry.Vector,
			Position: geometry.Vector,
			Size: geometry.Vector,
			BaseWindow: BaseWindow,
			DockWindow: DockWindow,
			monitorManager: monitorManager,
			windowManager: windowManager,
			openFinManager: openFinManager,
			getMainWindow: getMainWindow,
			onReady: onReady,
			isReady: isGlobalReady
		}
    });
});

