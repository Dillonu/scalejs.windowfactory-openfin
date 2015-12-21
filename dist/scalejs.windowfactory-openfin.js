
define('geometry',[
], function (
) {
	"use strict";

	function Vector(left, top) {
	    var obj = left;
	    if (obj != null && obj.constructor !== Number) {
	        //new Vector(obj)
	        this.left = obj.left;
	        this.top = obj.top;
	    } else {
	        //new Vector(left, top)
	        this.left = left;
	        this.top = top;
	    }
	}
	Vector.prototype.clone = function () {
	    return new Vector(this);
	};
	Vector.prototype.getVector = function () {
	    // We have this method, so any prototype in this script will return their position, and if they are one it will return itself.
	    // This simplifies code, and prevents having to do a ton of checks.
	    return this;
	}
	Vector.prototype.getBoundingBox = function () {
	    // We have this method, so any prototype in this script will return their position, and if they are one it will return itself.
	    // This simplifies code, and prevents having to do a ton of checks.
	    return new BoundingBox(this.left, this.top, this.left, this.top);
	}
	Vector.prototype.set = function (other) {
	    if (other == null) throw "set requires argument 'other'";
	    other = other.getVector();
	    if (other.constructor !== Vector) throw "set requires argument 'other' to resolve to type Vector";

	    this.left = other.left;
	    this.top = other.top;
	    return this;
	};
	Vector.prototype.add = function (other) {
	    if (other == null) throw "add requires argument 'other'";
	    other = other.getVector();
	    if (other.constructor !== Vector) throw "add requires argument 'other' to resolve to type Vector";

	    this.left += other.left;
	    this.top += other.top;
	    return this;
	};
	Vector.prototype.subtract = function (other) {
	    if (other == null) throw "subtract requires argument 'other'";
	    other = other.getVector();
	    if (other.constructor !== Vector) throw "subtract requires argument 'other' to resolve to type Vector";

	    this.left -= other.left;
	    this.top -= other.top;
	    return this;
	};
	Vector.prototype.moveTo = function (left, top) {
	    if (left != null && left.constructor === Number) this.left = left;
	    if (top != null && top.constructor === Number) this.top = top;
	    return this;
	};


	function BoundingBox(left, top, right, bottom) {
	    var obj = left;
	    if (obj != null && obj.constructor !== Number) {
	        if (obj.getBoundingBox != null) obj = obj.getBoundingBox();
	        //new BoundingBox(obj)
	        this.left = obj.left;
	        this.top = obj.top;
	        this.right = obj.right;
	        this.bottom = obj.bottom;
	    } else {
	        //new BoundingBox(left, top, right, bottom)
	        this.left = left;
	        this.top = top;
	        this.right = right;
	        this.bottom = bottom;
	    }
	}
	BoundingBox.prototype.clone = function () {
	    return new BoundingBox(this);
	};
	BoundingBox.prototype.getWidth = function () {
	    return Math.abs(this.right - this.left);
	};
	BoundingBox.prototype.getHeight = function () {
	    return Math.abs(this.bottom - this.top);
	};
	BoundingBox.prototype.getSize = function () {
	    return new Vector(this.getWidth(), this.getHeight());
	};
	BoundingBox.prototype.getPosition = function () {
	    return new Vector(this.left, this.top);
	};
	BoundingBox.prototype.getBoundingBox = function () {
	    // We have this method, so any prototype in this script will return their bounding box, and if they are one it will return itself.
	    // This simplifies code, and prevents having to do a ton of checks.
	    return this;
	};
	BoundingBox.prototype.getCollisionMesh = function () {
	    return new CollisionMesh(this);
	};
	BoundingBox.prototype.getCenterPosition = function () {
	    return new Vector(this.left + this.getWidth() / 2, this.top + this.getHeight() / 2);
	};
	BoundingBox.prototype.getCenteredOnPosition = function (other) {
	    if (other == null) throw "getCenteredOnPosition requires argument 'other'";
	    other = other.getBoundingBox();
	    if (other.constructor !== BoundingBox) throw "getCenteredOnPosition requires argument 'other' to resolve to type BoundingBox";

	    return other.getCenterPosition().subtract(this.getCenterPosition().subtract(this.getPosition()));
	};
	BoundingBox.prototype.moveTo = function (left, top) {
	    var newPosition = new Vector(left, top);
	    if (newPosition.left != null) {
	        this.right = newPosition.left + (this.right - this.left);
	        this.left = newPosition.left;
	    }
	    if (newPosition.top != null) {
	        this.bottom = newPosition.top + (this.bottom - this.top);
	        this.top = newPosition.top;
	    }
	    return this;
	};
	BoundingBox.prototype.moveBy = function (left, top) {
	    var newPosition = new Vector(left, top);
	    if (newPosition.left != null) {
	        this.left += newPosition.left;
	        this.right += newPosition.left;
	    }
	    if (newPosition.top != null) {
	        this.top += newPosition.top;
	        this.bottom += newPosition.top;
	    }
	    return this;
	};

	BoundingBox.prototype.resizeTo = function (width, height) {
	    var newSize = new Vector(width, height);
	    if (newSize.left != null) this.right = this.left + newSize.left;
	    if (newSize.top != null) this.bottom = this.top + newSize.top;
	    return this;
	};
	BoundingBox.prototype.isContains = function (other) {
	    if (other == null) throw "isContains requires argument 'other'";
	    other = other.getBoundingBox();
	    if (other.constructor !== BoundingBox) throw "isContains requires argument 'other' to resolve to type BoundingBox";

	    return other.left >= this.left && other.right <= this.right && other.top >= this.top && other.bottom <= this.bottom;
	};
	BoundingBox.prototype.someContains = function (others) {
	    if (others == null) throw "someContains requires argument 'others'";
	    if (others.constructor !== Array) throw "someContains requires argument 'others' of type Array";

	    for (var index = 0; index < others.length; index += 1) {
	        if (this.isContains(others[index])) return true;
	    }
	    return false;
	};
	BoundingBox.prototype.isTouching = function (other) {
	    if (other == null) throw "isTouching requires argument 'other'";
	    other = other.getBoundingBox();
	    if (other.constructor !== BoundingBox) throw "isTouching requires argument 'other' to resolve to type BoundingBox";

	    return ((this.top <= other.bottom && this.bottom >= other.top) && (this.left === other.right || this.right === other.left)) ||
               ((this.left <= other.right && this.right >= other.left) && (this.top === other.bottom || this.bottom === other.top));
	};
	BoundingBox.prototype.someTouching = function (others) {
	    if (others == null) throw "someTouching requires argument 'others'";
	    if (others.constructor !== Array) throw "someTouching requires argument 'others' of type Array";

	    for (var index = 0; index < others.length; index += 1) {
	        if (this.isTouching(others[index])) return true;
	    }
	    return false;
	};
	BoundingBox.prototype.isColliding = function (other) {
	    if (other == null) throw "isColliding requires argument 'other'";
	    other = other.getBoundingBox();
	    if (other.constructor !== BoundingBox) throw "isColliding requires argument 'other' to resolve to type BoundingBox";

	    return this.left < other.right && this.right > other.left && this.top < other.bottom && this.bottom > other.top;
	};
	BoundingBox.prototype.someColliding = function (others) {
	    if (others == null) throw "someColliding requires argument 'others'";
	    if (others.constructor !== Array) throw "someColliding requires argument 'others' of type Array";

	    for (var index = 0; index < others.length; index += 1) {
	        if (this.isColliding(others[index])) return true;
	    }
	    return false;
	};
	BoundingBox.prototype.getColliding = function (others) {
	    if (others == null) throw "getColliding requires argument 'others'";
	    if (others.constructor !== Array) throw "getColliding requires argument 'others' of type Array";

	    for (var index = 0; index < others.length; index += 1) {
	        if (this.isColliding(others[index])) return others[index];
	    }
	};
	BoundingBox.prototype.isTouchingEdge = function (other) {
	    if (other == null) throw "isTouchingEdge requires argument 'other'";
	    other = other.getBoundingBox();
	    if (other.constructor !== BoundingBox) throw "isTouchingEdge requires argument 'other' to resolve to type BoundingBox";

	    return this.left === other.right || this.right === other.left || this.top === other.bottom || this.bottom === other.top;
	};
	/*BoundingBox.prototype.getXEdgeDistance = function (other) {
	    if (others == null) throw "getColliding requires argument 'others'";
	    if (others.constructor !== Array) throw "getColliding requires argument 'others' of type Array";

	    var distance = 1000000; // Arbitrary distance
	    for (var index = 0; index < this.boxes.length; index += 1) {
	        for (var j = 0; j < other.boxes.length; j += 1) {
	            distance = Math.min(distance, this.boxes[index].getXEdgeDistance(other.boxes[j]));
	        }
	    }
	    return distance;
	};*/

	function CollisionMesh(boxes) {
	    if (boxes == null) throw "CollisionMesh constructor requires argument 'boxes'";
	    if (boxes.constructor !== Array) boxes = [boxes];
	    this.boxes = [];
	    for (var index = 0; index < boxes.length; index += 1) {
	        if (boxes[index].constructor === BoundingBox) {
	            this.boxes.push(boxes[index]);
	        } else if (boxes[index].constructor === CollisionMesh) {
	            this.boxes = this.boxes.concat(boxes[index].boxes);
	        } else {
	            this.boxes = this.boxes.concat(boxes[index].getCollisionMesh().boxes);
	        }
	    }
	}

	CollisionMesh.prototype.clone = function () {
	    var boxes = [];
	    for (var index = 0; index < this.boxes; index += 1) {
	        boxes[index] = this.boxes[index].clone();
	    }
	    return new CollisionMesh(boxes);
	};
    
	CollisionMesh.prototype.getWidth = function () {
	    if (this.boxes.length === 0) return 0;

	    var left = this.boxes[0].left,
	        right = this.boxes[0].right;

	    for (var index = 1; index < this.boxes.length; index += 1) {
	        // This assumes left is least, and right is most in terms of value:
	        left = Math.min(left, this.boxes[index].left);
	        right = Math.max(right, this.boxes[index].right);
	    }

	    return right - left;
	};
	CollisionMesh.prototype.getHeight = function () {
	    if (this.boxes.length === 0) return 0;

	    var top = this.boxes[0].top,
	        bottom = this.boxes[0].bottom;

	    for (var index = 1; index < this.boxes.length; index += 1) {
	        // This assumes top is least, and bottom is most in terms of value:
	        top = Math.min(top, this.boxes[index].top);
	        bottom = Math.max(bottom, this.boxes[index].bottom);
	    }

	    return bottom - top;
	};
	CollisionMesh.prototype.getSize = function () {
	    return new Vector(this.getWidth(), this.getHeight());
	};
	CollisionMesh.prototype.getPosition = function () {
	    return new Vector(this.getBoundingBox());
	};
	CollisionMesh.prototype.getBoundingBox = function () {
	    if (this.boxes.length === 0) return 0;

	    var left = this.boxes[0].left,
            top = this.boxes[0].top,
	        right = this.boxes[0].right,
	        bottom = this.boxes[0].bottom;

	    for (var index = 1; index < this.boxes.length; index += 1) {
	        left = Math.min(left, this.boxes[index].left);
	        top = Math.min(top, this.boxes[index].top);
	        right = Math.max(right, this.boxes[index].right);
	        bottom = Math.max(bottom, this.boxes[index].bottom);
	    }

	    return new BoundingBox(left, top, right, bottom);
	};
	CollisionMesh.prototype.getCollisionMesh = function () {
	    return this;
	};
	CollisionMesh.prototype.moveTo = function (left, top) {
	    var newPosition = new Vector(left, top);
	    this.moveBy(newPosition.subtract(this.getPosition()));
	    return this;
	};
	CollisionMesh.prototype.moveBy = function (left, top) {
	    var newPosition = new Vector(left || 0, top || 0);
	    for (var index = 0; index < this.boxes.length; index += 1) {
	        this.boxes[index].moveBy(newPosition);
	    }
	    return this;
	};
	CollisionMesh.prototype.isContains = function (other) {
	    if (other == null) throw "isContains requires argument 'other'";
	    other = (other.constructor === Array ? new CollisionMesh(other) : other.getCollisionMesh());
	    if (other.constructor !== CollisionMesh) throw "isContains requires argument 'other' to resolve to type CollisionMesh";

	    for (var index = 0; index < this.boxes.length; index += 1) {
	        if (this.boxes[index].someContains(other.boxes)) return true;
	    }
	    return false;
	};
	CollisionMesh.prototype.isTouching = function (other) {
	    if (other == null) throw "isTouching requires argument 'other'";
	    other = (other.constructor === Array ? new CollisionMesh(other) : other.getCollisionMesh());
	    if (other.constructor !== CollisionMesh) throw "isTouching requires argument 'other' to resolve to type CollisionMesh";

	    for (var index = 0; index < this.boxes.length; index += 1) {
	        if (this.boxes[index].someTouching(other.boxes)) return true;
	    }
	    return false;
	};
	CollisionMesh.prototype.someTouching = function (others) {
	    if (others == null) throw "someTouching requires argument 'others'";
	    if (others.constructor !== Array) throw "someTouching requires argument 'others' to resolve to type Array";

	    for (var index = 0; index < others.length; index += 1) {
	        if (this.isTouching(others[index])) return true;
	    }
	    return false;
	};
	CollisionMesh.prototype.isColliding = function (other) {
	    if (other == null) throw "isColliding requires argument 'other'";
	    other = (other.constructor === Array ? new CollisionMesh(other) : other.getCollisionMesh());
	    if (other.constructor !== CollisionMesh) throw "isColliding requires argument 'other' to resolve to type CollisionMesh";

	    for (var index = 0; index < this.boxes.length; index += 1) {
	        if (this.boxes[index].someColliding(other.boxes)) return true;
	    }
	    return false;
	};
	CollisionMesh.prototype.getColliding = function (other) {
	    if (other == null) throw "getColliding requires argument 'other'";
	    other = (other.constructor === Array ? new CollisionMesh(other) : other.getCollisionMesh());
	    if (other.constructor !== CollisionMesh) throw "getColliding requires argument 'other' to resolve to type CollisionMesh";

	    for (var index = 0; index < this.boxes.length; index += 1) {
	        var collided = this.boxes[index].getColliding(other.boxes);
	        if (collided) return collided;
	    }
	};
	CollisionMesh.prototype.someColliding = function (others) {
	    if (others == null) throw "someColliding requires argument 'others'";
	    if (others.constructor !== Array) throw "someColliding requires argument 'others' to resolve to type Array";

	    for (var i = 0; i < others.length; i += 1) {
	        for (var j = 0; j < this.boxes.length; j += 1) {
	            if (this.boxes[j].isColliding(others[i])) return true;
	        }
	    }
	    return false;
	};
	/*CollisionMesh.prototype.getXEdgeDistance = function (other) {
	    if (other == null) throw "isTouching requires argument 'other'";
	    other = (other.constructor === Array ? new CollisionMesh(other) : other.getCollisionMesh());
	    if (other.constructor !== CollisionMesh) throw "isTouching requires argument 'other' to resolve to type CollisionMesh";

	    var distance = 1000000; // Arbitrary distance
	    for (var index = 0; index < this.boxes.length; index += 1) {
	        for (var j = 0; j < other.boxes.length; j += 1) {
	            distance = Math.min(distance, this.boxes[index].getXEdgeDistance(other.boxes[j]));
	        }
	    }
	    return distance;
	};*/

	return {
	    Vector: Vector,
	    BoundingBox: BoundingBox,
        CollisionMesh: CollisionMesh
	};
});

define('eventSystem',[
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

define('monitorManager',[
    './geometry',
    './eventSystem'
], function (
    geometry,
    eventSystem
) {
    "use strict";

    var Vector = geometry.Vector,
        Position = geometry.Vector,
        BoundingBox = geometry.BoundingBox,
        CollisionMesh = geometry.CollisionMesh,
        readyListeners = [],
        _isReady = false,
        currentMonitorInfo,
        deviceScaleFactor = 1,
        deviceScaleInvFactor = 1,
        currentMonitors = [],
        currentMousePosition = new Position(0, 0),
        currentMouseMonitor;

    function Monitor(monitorObj) {
        this.deviceId = monitorObj.deviceId;
        this.name = monitorObj.name;
        this.deviceScaleFactor = monitorObj.deviceScaleFactor;
        this.deviceScaleInvFactor = 1 / this.deviceScaleFactor;
        this.displayDeviceActive = monitorObj.displayDeviceActive;
        this.monitorRect = new BoundingBox(monitorObj.monitorRect);
	    this.availableRect = new BoundingBox(monitorObj.availableRect);
	}
	Monitor.prototype.getPosition = function () {
	    return new Vector(this.monitorRect); // Uses monitorRect.left and monitorRect.top
	};
	Monitor.prototype.getBounds = function () {
	    return new BoundingBox(this.monitorRect);
	};
	Monitor.prototype.getBoundingBox = Monitor.prototype.getBounds;
	Monitor.prototype.getCollisionMesh = function () {
	    return this.getBounds().getCollisionMesh();
	};
	Monitor.prototype.isContains = function (other) {
	    return this.getBoundingBox().isContains(other);
	};
	Monitor.prototype.isTouching = function (other) {
	    return this.getBoundingBox().isTouching(other);
	};
	Monitor.prototype.someTouching = function (others) {
	    return this.getBoundingBox().someTouching(others);
	};
	Monitor.prototype.isColliding = function (other) {
	    return this.getBoundingBox().isColliding(other);
	};
	Monitor.prototype.someColliding = function (others) {
	    return this.getBoundingBox().someColliding(others);
	};

	function getMonitors() {
        // Makes duplicates of each monitor instance:
	    var monitors = [];
	    for (var index = 0; index < currentMonitors.length; index += 1) {
	        monitors[index] = new Monitor(currentMonitors[index]);
	    }
	    return monitors;
	}

	function getPrimaryMonitor() {
	    return new Monitor(currentMonitors[0]);
	}

	function determineMonitor(left, top) {
	    // Accepts:
	    // determineMonitor(left, top);
	    // determineMonitor({left: ..., top: ...});
	    // determineMonitor(vector);
	    var pos = new Position(left, top);

	    for (var index = 0; index < currentMonitors.length; index += 1) {
	        if (currentMonitors[index].isContains(pos)) {
	            return new Monitor(currentMonitors[index]);
	        }
	    }
	}

	function getDeviceScaleFactor() {
	    return deviceScaleFactor;
	}
	function getDeviceScaleInvFactor() {
	    return deviceScaleInvFactor;
	}

	function getMouseMonitor() {
	    return new Monitor(currentMouseMonitor);
	}

	function isVisible(window) {
	    return window.getCollisionMesh().someColliding(currentMonitors);
	}
    
	fin.desktop.main(function () {
	    function updateMonitors(monitorInfo) {
	        console.debug("The monitor information has changed to: ", monitorInfo);
	        currentMonitorInfo = monitorInfo;
	        deviceScaleFactor = monitorInfo.deviceScaleFactor || 1;
	        deviceScaleInvFactor = 1 / deviceScaleFactor;

	        currentMonitors = [new Monitor(monitorInfo.primaryMonitor)];
	        for (var index = 0; index < monitorInfo.nonPrimaryMonitors.length; index += 1) {
	            currentMonitors.push(new Monitor(monitorInfo.nonPrimaryMonitors[index]));
	        }

	        //currentMouseMonitor = windowFactory.determineMonitor(currentMousePosition) || getPrimaryMonitor();

	        _isReady = true;
			for (var index = 0; index < readyListeners.length; index += 1) {
				readyListeners[index]();
			}
			readyListeners = [];
	        eventSystem.triggerEvent("monitors", [currentMonitors]);
	    }

	    //app = fin.desktop.Application.getCurrent();
	    fin.desktop.System.getMonitorInfo(updateMonitors);
	    fin.desktop.System.addEventListener('monitor-info-changed', updateMonitors, undefined, function (err) {
	        console.error("Failure to listen for monitor updates: " + err);
	    });

	    // Poll mouse position:
	    function pollMouseMon() {
	        fin.desktop.System.getMousePosition(function (mousePosition) {
	            //console.log("The mouse is located at left: " + mousePosition.left + ", top: " + mousePosition.top);
	            currentMousePosition.moveTo(mousePosition);
	            currentMouseMonitor = determineMonitor(currentMousePosition.left) || getPrimaryMonitor();
	        });
	    }
	    pollMouseMon();
	    setInterval(pollMouseMon, 250);
	});
	
	function isReady() {
		return _isReady;
	}
	
	function onReady(callback) {
        // Check if already is ready:
        if (_isReady) return callback();

        // Check if eventListener is a function:
        if (callback == null || callback.constructor !== Function) throw "onReady requires argument 'callback' of type Function";
        
        // Check if eventListener is already added:
        if (readyListeners.indexOf(callback) >= 0) return;

        // Add event listener:
        readyListeners.push(callback);
    }

	return {
	    Monitor: Monitor,
	    getMonitors: getMonitors,
	    getPrimaryMonitor: getPrimaryMonitor,
	    determineMonitor: determineMonitor,
	    getDeviceScaleFactor: getDeviceScaleFactor,
	    getDeviceScaleInvFactor: getDeviceScaleInvFactor,
	    getMouseMonitor: getMouseMonitor,
	    isVisible: isVisible,
        isReady: isReady,
		onReady: onReady
	};
});

define('windowManager',[
    './geometry',
    './eventSystem'
], function (
    geometry,
    eventSystem
) {
    "use strict";

    var Vector = geometry.Vector,
        BoundingBox = geometry.BoundingBox,
        mainWindow,
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

    function removeEventListener(eventName, eventListener) {
        // If event listeners don't exist, bail:
        if (eventListeners[eventName] == null) return;

        // Check if eventListener is a function:
        if (eventListener == null || eventListener.constructor !== Function) throw "removeEventListener requires argument 'eventListener' of type Function";

        // Remove event listener, if exists:
        var index = eventListeners[eventName].indexOf(eventListener);
        if (index >= 0) eventListeners[eventName].splice(index, 1);
    }

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
    function getNextWindowId() {
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

    return {
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        registerWindow: registerWindow,
        registerApplicationWindow: registerApplicationWindow,
        removeWindow: removeWindow,
        removeApplicationWindow: removeApplicationWindow,
	    getWindow: getWindow,
	    getWindows: getWindows,
	    getApplicationWindows: getApplicationWindows,
	    getWindowByElement: getWindowByElement,
	    getWindowByName: getWindowByName,
        getNextWindowId: getNextWindowId
	};
});

define('openFinManager',[
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

define('BaseWindow',[
    './openFinManager',
    './geometry',
    './eventSystem',
    './monitorManager',
    './windowManager'
], function (
    openFinManager,
    geometry,
    eventSystem,
    monitorManager,
    windowManager
) {
    "use strict";

    var Vector = geometry.Vector,
        Position = geometry.Vector,
        BoundingBox = geometry.BoundingBox,
        CollisionMesh = geometry.CollisionMesh,
        snapPixels = 5,
        // TODO: add allowable event types????
        forbiddenEventTypes = new Set([]);

    function setupDOM() {
        // Handle config property:
        var thisWindow = this;
        this._window.getOptions(function (options) {
            thisWindow._config = options;
            if (thisWindow._config.name) thisWindow.setTitle(thisWindow._config.name);
        });

        // Remove from parent on close:
        this._window.addEventListener("closed", function () {
            thisWindow._isReady = false;
            thisWindow._isClosed = true; // Mark as closed
            thisWindow._isVisible = false;

            // Remove window from parent:
            if (thisWindow._parent) {
                var index = thisWindow._parent._children.indexOf(thisWindow);
                if (index >= 0) thisWindow._parent._children.splice(index, 1);
                this._parent = undefined;
            }

            // Remove from window manager:
            windowManager.removeWindow(thisWindow);
            windowManager.removeApplicationWindow(thisWindow);

            thisWindow.triggerEvent("closed");
            delete thisWindow._eventListeners["closed"];

            // TODO: Clean up 'this' instance to maximize GC.
        });

        // Store hidden state:
        this._window.addEventListener("hidden", function (event) {
            for (var index = 0; index < thisWindow._children.length; index += 1) {
                thisWindow._children[index].hide();
            }
            thisWindow._isVisible = false;
            thisWindow.triggerEvent("hidden", event);
        });
        this._window.addEventListener("shown", function (event) {
            thisWindow._isVisible = true;
            thisWindow.fitToElement();
            thisWindow.triggerEvent("shown", event);
        });

        //On max/min states:
        this._window.addEventListener("minimized", function (event) {
            for (var index = 0; index < thisWindow._children.length; index += 1) {
                if (thisWindow._children[index].isVisible()) thisWindow._children[index].minimize();
            }
            thisWindow._isMinimized = true;
            thisWindow._isMaximized = false;
            thisWindow.fitToElement();
            thisWindow.triggerEvent("minimized", event);
        });
        this._window.addEventListener("restored", function (event) {
            for (var index = 0; index < thisWindow._children.length; index += 1) {
                if (thisWindow._children[index]._showOnParentShow || thisWindow._children[index].isVisible()) thisWindow._children[index].restore();
            }
            thisWindow._isMinimized = false;
            thisWindow._isMaximized = false;
            thisWindow.fitToElement();
            thisWindow.triggerEvent("restored", event);
        });
        this._window.addEventListener("maximized", function (event) {
            thisWindow._isMinimized = false;
            thisWindow._isMaximized = true;
            thisWindow.triggerEvent("maximized", event);
        });

        // Other events:
        this._window.addEventListener("closed", thisWindow.triggerEvent.bind(this, "closed"));
        this._window.addEventListener("focused", function (event) {
            if (thisWindow._parent) thisWindow._parent.bringToFront();
            thisWindow.bringToFront();
            if (!monitorManager.isVisible(thisWindow)) thisWindow.moveTo(thisWindow.getCollisionMesh().getBoundingBox().getCenteredOnPosition(monitorManager.getMouseMonitor()));
            for (var index = 0; index < thisWindow._children.length; index += 1) {
                thisWindow._children[index].bringToFront();
            }
            thisWindow.triggerEvent("focused", event);
        });


        var window = this.getContentWindow(true),
            document = window.document,
            mouseDown = false,
            blurred = true,
            dragStartX,
            dragStartY,
            startPos = [],
            movedSinceDragStart,
            thisWindow = this;
        
        window.windowWrapper = this;

        //// Get window position and size:
        this._bounds = new BoundingBox(window.screenLeft, window.screenTop,
                                       window.screenLeft + window.outerWidth, window.screenTop + window.outerHeight);

        //// Store window position and size on window move:
        function updatePositionAndSize(event) {
            thisWindow._bounds = new BoundingBox(event.left, event.top, event.left + event.width, event.top + event.height);
            if (event.changeType !== 0) {
                thisWindow.undock();
                thisWindow.triggerEvent("resized", thisWindow.getBounds(true));
            }
            if (event.changeType !== 1) thisWindow.triggerEvent("moved", thisWindow._bounds.getPosition());
        }
        this._window.addEventListener("bounds-changed", updatePositionAndSize);
        this._window.addEventListener("bounds-changing", updatePositionAndSize);
        this._window.addEventListener("disabled-frame-bounds-changed", updatePositionAndSize);
        this._window.addEventListener("disabled-frame-bounds-changing", updatePositionAndSize);

        this.addEventListener("childremove", function (window) {
            if (window._addToParentMesh) {
                this.undock();
                //this.triggerEvent("resized", this.getBounds(true));
            }
        })

        //// Setup start drag:
        // Used in addDraggableElements:
        this._dragStartEvent = function (event) {
            // Ignore mouse down on elements that are ignoring drag:
            if (event.target.classList.contains("ui-ignore-drag")) return;

            mouseDown = true;
            dragStartX = event.x;
            dragStartY = event.y;
            movedSinceDragStart = false;
            startPos = [];
            // Setup drag windows:
            var windows = thisWindow.getCollisionMeshWindows();
            for (var index = 0; index < windows.length; index += 1) {
                if (windows[index].isReady()) {
                    startPos[index] = windows[index].getBoundingBox();
                    windows[index]._startDragPos = windows[index].getPosition();
                }
            }
        };


        //// Setup drag:
        function moveGroup(newPos) {
            // TODO: Make sure at least one part of any window in the group exists on at least one monitor.
            // Get all windows in this group:
            var windows = thisWindow.getCollisionMeshWindows();
            var deltaPos = (new Position(newPos)).subtract(thisWindow._startDragPos); // Calc change in position since start of drag
            for (var index = 0; index < windows.length; index += 1) {
                if (windows[index].isReady() && windows[index]._startDragPos) {
                    // Move window by delta compared to start position:
                    var winPos = windows[index]._startDragPos.clone().add(deltaPos);
                    windows[index]._window.moveTo(winPos.left, winPos.top);
                }
            }
            //var deltaPos = (new Position(newPos)).subtract(thisWindow._startDragPos);
            //thisWindow.moveTo(newPos);
        }
        function onDrag(left, top, isMouseReleased) {
            var newPos = {
                    xDistance: snapPixels,
                    yDistance: snapPixels,
                    xWindow: undefined,
                    yWindow: undefined,
                    left: left,
                    top: top
                },
                thisCurrentBounds = new BoundingBox(thisWindow._bounds),
                thisBounds = new BoundingBox(thisWindow._bounds),
                meshWindows = thisWindow.getCollisionMeshWindows(),
                thisWindowMesh = thisWindow.getCollisionMesh(),
                otherWindows = (thisWindow._parent != null ? thisWindow._parent._children : windowManager.getApplicationWindows()),
                snapWindows = [];

            // Move thisWindowMesh to new position:
            thisBounds.moveTo(left, top);
            thisWindowMesh.moveBy((new Position(left, top)).subtract(thisWindow.getPosition()));

            // Filter otherWindows to only windows which we can snap to:
            for (var index = 0; index < otherWindows.length; index += 1) {
                if (meshWindows.indexOf(otherWindows[index]) < 0 && otherWindows[index].isVisible()) snapWindows.push(otherWindows[index]);
            }

            for (var snapIndex = 0; snapIndex < snapWindows.length; snapIndex += 1) {
                var snapWindow = snapWindows[snapIndex],
                    snapWindowMeshWindows = snapWindow.getCollisionMeshWindows();
                // Loop through this window's mesh boxes:
                for (var i = 0; i < thisWindowMesh.boxes.length; i += 1) {
                    var meshBox = thisWindowMesh.boxes[i];
                    // Loop through snapWindow's mesh boxes:
                    for (var j = 0; j < snapWindowMeshWindows.length; j += 1) {
                        var snapWindow = snapWindowMeshWindows[j],
                            snapBox = new BoundingBox(snapWindow._bounds);
                        // Handle snap:
                        if (meshBox.top <= snapBox.bottom && meshBox.bottom >= snapBox.top) {
                            // Handle x-snap:
                            var snapped = false;
                            if (Math.abs(meshBox.left - snapBox.right) <= newPos.xDistance) {
                                // Left x-snap:
                                newPos.left = thisBounds.left + snapBox.right - meshBox.left; // The new left position of the window being dragged
                                newPos.xWindow = snapWindow; // Set the xWindow for snap event later
                                snapped = true;
                            } else if (Math.abs(meshBox.right - snapBox.left) <= newPos.xDistance) {
                                // Left x-snap:
                                newPos.left = thisBounds.left + snapBox.left - meshBox.right; // The new left position of the window being dragged
                                newPos.xWindow = snapWindow; // Set the xWindow for snap event later
                                snapped = true;
                            }

                            // If performed a x-snap:
                            if (snapped) {
                                newPos.xDistance = Math.abs(thisBounds.left - newPos.left); // x distance between thisBounds and newPos
                                // Handle y-subsnap:
                                if (Math.abs(meshBox.top - snapBox.top) <= newPos.yDistance) {
                                    // Top y-subsnap:
                                    newPos.top = thisBounds.top + snapBox.top - meshBox.top; // The new top position of the window being dragged
                                    newPos.yDistance = Math.abs(thisBounds.top - newPos.top); // y distance between thisBounds and newPos
                                    newPos.yWindow = snapWindow; // Set the yWindow for snap event later
                                } else if (Math.abs(meshBox.bottom - snapBox.bottom) <= newPos.yDistance) {
                                    // Bottom y-subsnap:
                                    newPos.top = thisBounds.top + snapBox.bottom - meshBox.bottom; // The new top position of the window being dragged
                                    newPos.yDistance = Math.abs(thisBounds.top - newPos.top); // y distance between thisBounds and newPos
                                    newPos.yWindow = snapWindow; // Set the yWindow for snap event later
                                }
                            }
                        }
                        if (meshBox.left <= snapBox.right && meshBox.right >= snapBox.left) {
                            // Handle y-snap:
                            var snapped = false;
                            if (Math.abs(meshBox.top - snapBox.bottom) <= newPos.yDistance) {
                                // Top y-snap:
                                newPos.top = thisBounds.top + snapBox.bottom - meshBox.top; // The new top position of the window being dragged
                                newPos.yWindow = snapWindow; // Set the yWindow for snap event later
                                snapped = true;
                            } else if (Math.abs(meshBox.bottom - snapBox.top) <= newPos.yDistance) {
                                // Bottom y-snap:
                                newPos.top = thisBounds.top + snapBox.top - meshBox.bottom; // The new top position of the window being dragged
                                newPos.yWindow = snapWindow; // Set the yWindow for snap event later
                                snapped = true;
                            }

                            // If performed a y-snap:
                            if (snapped) {
                                newPos.yDistance = Math.abs(thisBounds.top - newPos.top); // y distance between thisBounds and newPos
                                // Handle x-subsnap:
                                if (Math.abs(meshBox.left - snapBox.left) <= newPos.xDistance) {
                                    // Left x-subsnap:
                                    newPos.left = thisBounds.left + snapBox.left - meshBox.left; // The new left position of the window being dragged
                                    newPos.xDistance = Math.abs(thisBounds.left - newPos.left); // x distance between thisBounds and newPos
                                    newPos.xWindow = snapWindow; // Set the xWindow for snap event later
                                } else if (Math.abs(meshBox.right - snapBox.right) <= newPos.xDistance) {
                                    // Right x-subsnap:
                                    newPos.left = thisBounds.left + snapBox.right - meshBox.right; // The new left position of the window being dragged
                                    newPos.xDistance = Math.abs(thisBounds.left - newPos.left); // x distance between thisBounds and newPos
                                    newPos.xWindow = snapWindow; // Set the xWindow for snap event later
                                }
                            }
                        }
                    }
                }
            }
            
            var newMesh = thisWindow.getCollisionMesh().moveBy((new Position(newPos)).subtract(thisCurrentBounds.getPosition()));

            // Move window:
            if (newPos.left !== thisCurrentBounds.left || newPos.top !== thisCurrentBounds.top) {
                movedSinceDragStart = true;
                moveGroup(newPos);
                //moveDrag(newPos.left, newPos.top);
                //thisWindow.moveTo(newPos.left, newPos.top);
            }

            // Add any new dockedGrouped windows:
            if (isMouseReleased && movedSinceDragStart) {
                for (var snapIndex = 0; snapIndex < snapWindows.length; snapIndex += 1) {
                    var snapWindow = snapWindows[snapIndex];
                    if (newMesh.isTouching(snapWindow.toBase().getCollisionMesh())) {
                        thisWindow.triggerEvent("_endSnap", snapWindow);
                    }
                }
                //if (newPos.xWindow != null) thisWindow.triggerEvent("_endSnap", newPos.xWindow);
                //if (newPos.yWindow != null) thisWindow.triggerEvent("_endSnap", newPos.yWindow);
            }
        }

        window.addEventListener("mousemove", function (event) {
            if (mouseDown) {
                var monitorScaleFactor = monitorManager.getDeviceScaleInvFactor();

                onDrag(event.screenX * monitorScaleFactor - dragStartX, event.screenY * monitorScaleFactor - dragStartY, false);
            }
        });

        //// Setup drag end:
        window.addEventListener("mouseup", function (event) {
            if (mouseDown) {
                mouseDown = false;
                var monitorScaleFactor = monitorManager.getDeviceScaleInvFactor();

                onDrag(event.screenX * monitorScaleFactor - dragStartX, event.screenY * monitorScaleFactor - dragStartY, true);

                // Remove _startDragPos as it is only suppose to be there when being dragged:
                var windows = thisWindow.getCollisionMeshWindows();
                for (var index = 0; index < windows.length; index += 1) {
                    delete windows[index]._startDragPos;
                }
            }
        });

        //// Setup Select fix (click events on windows cause select to appear behind):
        // This function is defined once for use in attachDropdownHandler.
        // The reason it is defined once, is so removeEventListener removes the same function.
        function disableDropdown(eventDropdown) {
            // If window is blurred, don't drop the dropdown:
            if (blurred) eventDropdown.preventDefault();
        }

        function attachDropdownHandler() {
            var selectElements = document.querySelectorAll("select");
            for (var index = 0; index < selectElements.length; index += 1) {
                // Add event listener to select if hasn't been added yet. addEventListener prevents duplicate listeners.
                selectElements[index].addEventListener("mousedown", disableDropdown);
            }
        }
        attachDropdownHandler();

        //Need to deal with chromium not bring its select windows to the front after the bringToFront event is called on a parent window
        window.addEventListener("blur", function (event) {
            blurred = true;
            attachDropdownHandler();
            thisWindow.triggerEvent("blurred", event);
        });


        //// Setup click (bring to front):
        //Wire the click event of the content window body but use the capture phase, ie. tunneling
        window.addEventListener('click', function (event) {
            // If this is a true focused event
            if (blurred) {
                //Call the openfin window to resize its content
                thisWindow.fitToElement();

                //Look for any windows set to be closed when they loose focus that are NOT child windows of the current parent window
                // We do this check, as opposed to in blur event, because we manipulate the focus of windows, which could cause blur to accidently close a valid window:
                var windows = windowManager.getWindows();
                for (var index = 0; index < windows.length; index += 1) {
                    if (windows[index] !== thisWindow && windows[index].isChildOf(thisWindow) && windows[index]._closeOnLostFocus) {
                        windows[index][windows[index]._config.hideOnClose ? "hide" : "close"]();
                    }
                }

                if (thisWindow._parent) thisWindow._parent.bringToFront();

                thisWindow.triggerEvent("_bringToFront");

                // Make sure this window is brought above others, but before children and select boxes:
                thisWindow.bringToFront();
                thisWindow.focus();

                //A direct click on a select essentially calls a bring to front for the curWnd already - avoid doing it twice so the select popup is not behind the window
                if (!$(event.target).is('select')) {
                    thisWindow._window.bringToFront();
                }

                // Use set timeout to process the bringToFront functions, and to wait for rest of function to execute:
                setTimeout(function () {
                    attachDropdownHandler(); // Attach new dropdown handers

                    // Open targeted select:
                    if ($(event.target).is('select')) {
                        var clickEvent = document.createEvent('MouseEvents');
                        clickEvent.initEvent("mousedown", true, true);
                        event.target.dispatchEvent(clickEvent);
                    }
                }, 0);

                //Go through all child windows associated with the window and bring them to the front
                // The following event is commented out as it breaks the above select box bring to front.
                //thisWindow.triggerEvent("_bringChildrenToFront");
                for (var index = 0; index < thisWindow._children; index += 1) {
                    if (thisWindow._children[index]._alwaysAboveParent && !thisWindow._children[index].isVisible()) {
                        thisWindow._children[index].bringToFront();
                        thisWindow._children[index].focus();
                    }
                }
            }

            //Document the blur
            blurred = false;
        }, true);

        //// Setup zoom:
        if (this._enableWindowZoom) {
            document.body.style.zoom = 1;
            window.addEventListener('wheel', function (event) {
                if (event.ctrlKey) {
                    if (event.wheelDeltaY > 0) {
                        // scroll up + ctrl
                        thisWindow.zoomIn();
                    } else if (event.wheelDeltaY < 0) {
                        // scroll down + ctrl
                        thisWindow.zoomOut();
                    }
                }
            });
        }

        this._isReady = true; // TODO: Is this correct to be here?
        this.triggerEvent("ready");
        delete this._eventListeners["ready"];
    }

    function BaseWindow(config) {
        if (config == null) config = {}; // If no arguments are passed, assume we are creating a default blank window
        var isArgConfig = (config.app_uuid == null);

        // Handle base hidden properties:
        this._config = {};
        this._eventListeners = {};
        this._isReady = false;
        this._isClosed = false;
        this._isVisible = (isArgConfig ? config.autoShow : undefined);
        this._parent = (isArgConfig ? config._parent : undefined); // TODO: Validate object type
        delete config._parent;
        this._closeOnLostFocus = (isArgConfig ? config._closeOnLostFocus : undefined); // TODO: Validate object type
        delete config._closeOnLostFocus;
        this._showOnParentShow = (isArgConfig ? config._showOnParentShow : undefined); // TODO: Validate object type
        delete config._showOnParentShow;
        this._alwaysAboveParent = (isArgConfig ? config._alwaysAboveParent : undefined); // TODO: Validate object type
        delete config._alwaysAboveParent;
        this._enableWindowZoom = (isArgConfig ? config._enableWindowZoom : undefined); // TODO: Validate object type
        delete config._enableWindowZoom;
        this._gridName = (isArgConfig ? config._gridName : undefined); // TODO: Validate object type
        delete config._gridName;
        this._renderable = (isArgConfig ? config._renderable : undefined); // TODO: Validate object type
        delete config._renderable;
        this._addToParentMesh = (isArgConfig ? config._addToParentMesh : undefined); // TODO: Validate object type
        delete config._addToParentMesh;
        this._fitToElement = (isArgConfig ? config._fitToElement : undefined); // TODO: Validate object type
        delete config._fitToElement;
        this._closeOnParentClose = (isArgConfig ? config._closeOnParentClose : undefined); // TODO: Validate object type
        delete config._closeOnParentClose;
        this._children = [];

        if (config.app_uuid != null) {
            this._window = config;
            var thisWindow = this;
            this._window.isShowing(function (showing) {
                thisWindow._isVisible = showing;
            });
            this._window.getOptions(function (options) {
                thisWindow._config = options;
                thisWindow.onDOMReady(setupDOM);
            });
        } else {
            this._config = config;
            this._window = new fin.desktop.Window(config, setupDOM.bind(this), function (err) {
                console.error(err, config);
            });
        }

        // Handle hierarchy:
        if (this._parent) {
            this._parent._children.push(this);
            var thisWindow = this;
            this._parent.addEventListener("close", function () {
                if (thisWindow._closeOnParentClose) {
                    thisWindow.close();
                } else {
                    this.setParent(thisWindow._parent._parent || undefined);
                }
            });
        } else {
            windowManager.registerApplicationWindow(this);
        }

        // Add to window manager:
        windowManager.registerWindow(this);
    }

    BaseWindow.prototype.toBase = function () {
        return this;
    };

    BaseWindow.prototype.getContentWindow = function (ignoreNotReady) {
        // Return contentWindow of window:
        // Returns undefined if window is not setup:
        if (!ignoreNotReady && !this.isReady()) throw "getContentWindow can't be called on an unready window";
        return this._window.contentWindow;
    };

    BaseWindow.prototype.getDocument = function (ignoreNotReady) {
        // Return document of window's contentWindow:
        // Returns undefined if document or contentWindow is not setup:
        if (!ignoreNotReady && !this.isReady()) throw "getDocument can't be called on an unready window";
        return this.getContentWindow(ignoreNotReady).document;
    };

    BaseWindow.prototype.getBody = function (ignoreNotReady) {
        // Return body of window's document:
        // Returns undefined if body or document or contentWindow is not setup:
        if (!ignoreNotReady && !this.isReady()) throw "getBody can't be called on an unready window";
        return this.getDocument(ignoreNotReady).body;
    };

    BaseWindow.prototype.getParent = function () {
        return this._parent;
    };

    BaseWindow.prototype.getChildren = function () {
        return this._children.slice();
    };

    BaseWindow.prototype.isChildOf = function (window) {
        var curParent = this._parent;
        while (curParent != null) {
            if (curParent === window) return true;
            curParent = curParent._parent;
        }
        return false;
    };

    BaseWindow.prototype.getPosition = function () {
        if (!this.isReady()) throw "getPosition can't be called on an unready window";
        var contentWindow = this.getContentWindow();
        //if (contentWindow == null) throw "getPosition was unable to access window's contentWindow";

        return new Vector(contentWindow.screenLeft, contentWindow.screenTop);
    };
    BaseWindow.prototype.getVector = BaseWindow.prototype.getPosition;

    BaseWindow.prototype.getWidth = function () {
        if (!this.isReady()) throw "getWidth can't be called on an unready window";
        return this.getContentWindow().outerWidth;
    };

    BaseWindow.prototype.getHeight = function () {
        if (!this.isReady()) throw "getHeight can't be called on an unready window";
        return this.getContentWindow().outerHeight;
    };

    BaseWindow.prototype.getSize = function () {
        return new Vector(this.getWidth(), this.getHeight());
    };

    BaseWindow.prototype.getCollisionMeshWindows = function () {
        if (!this.isReady()) throw "getCollisionMesh can't be called on an unready window";
        // TODO: Include children in mesh, if child extends parent.
        var windows = [this];
        for (var index = 0; index < this._children.length; index += 1) {
            if (this._children[index]._addToParentMesh) windows = windows.concat(this._children[index].getCollisionMeshWindows());//windows.push(this._children[index]);
        }
        return windows;
    };
    
    BaseWindow.prototype.getCollisionMesh = function () {
        //if (!this.isReady()) throw "getCollisionMesh can't be called on an unready window";
        // TODO: Include children in mesh, if child extends parent.
        var boundingBoxes = [this.getBoundingBox()];
        for (var index = 0; index < this._children.length; index += 1) {
            if (this._children[index]._addToParentMesh) boundingBoxes.push(this._children[index].getBoundingBox());
        }
        return new CollisionMesh(boundingBoxes);
    };

    BaseWindow.prototype.getBounds = function (ignoreNotReady) {
        if (!ignoreNotReady && !this.isReady()) throw "getBoundingBox can't be called on an unready window";
        return new BoundingBox(this._bounds);
    };

    BaseWindow.prototype.getBoundingBox = function () {
        //if (!this.isReady()) throw "getBoundingBox can't be called on an unready window";
        //var contentWindow = this.getContentWindow();
        //if (contentWindow == null) throw "getBoundingBox was unable to access window's contentWindow";

        // TODO: Include children in bounding box, if child extends parent. Maybe utilize getCollisionMesh?
        return new BoundingBox(this._bounds);/*contentWindow.screenLeft, contentWindow.screenTop,
                               contentWindow.screenLeft + contentWindow.outerWidth, contentWindow.screenTop + contentWindow.outerHeight);*/
    };

    BaseWindow.prototype.getMonitor = function () {
        return this.getCollisionMesh().getColliding(monitorManager.getMonitors());
    };

    BaseWindow.prototype.addEventListener = function (eventName, eventListener) {
        if (this._isClosed) throw "onDOMReady can't be called on a closed window"; // If window is closed, ignore any new callbacks
        eventName = eventName.toLowerCase();

        // Check if this event can be subscribed to via this function:
        if (forbiddenEventTypes.has(eventName)) return;

        // Add event if not in table:
        if (this._eventListeners[eventName] == null) this._eventListeners[eventName] = [];

        // Check if eventListener is a function:
        if (eventListener == null || eventListener.constructor !== Function) throw "addEventListener requires argument 'eventListener' of type Function";

        // Check if eventListener is already added:
        if (this._eventListeners[eventName].indexOf(eventListener) >= 0) return;

        // Add event listener:
        this._eventListeners[eventName].push(eventListener);
    };

    BaseWindow.prototype.removeEventListener = function (eventName, eventListener) {
        eventName = eventName.toLowerCase();
        // If event listeners don't exist, bail:
        if (this._eventListeners[eventName] == null) return;

        // Check if eventListener is a function:
        if (eventListener == null || eventListener.constructor !== Function) throw "removeEventListener requires argument 'eventListener' of type Function";

        // Remove event listener, if exists:
        var index = this._eventListeners[eventName].indexOf(eventListener);
        if (index >= 0) this._eventListeners[eventName].splice(index, 1);
    };

    BaseWindow.prototype.clearEvent = function (eventName) {
        eventName = eventName.toLowerCase();
        this._eventListeners[eventName] = [];
    };

    BaseWindow.prototype.triggerEvent = function (eventName) {
        eventName = eventName.toLowerCase();
        // If event listeners don't exist, bail:
        if (this._eventListeners[eventName] == null) return;

        var args = [];
        for (var index = 1; index < arguments.length; index += 1) {
            args.push(arguments[index]);
        }

        for (var index = 0; index < this._eventListeners[eventName].length; index += 1) {
            // Call listener with the 'this' context as the current window:
            this._eventListeners[eventName][index].apply(this, args);
        }
    };

    BaseWindow.prototype.isReady = function () {
        return this._isReady;
    };
    
    BaseWindow.prototype.isVisible = function () {
        return this._isVisible;
    };
    BaseWindow.prototype.isHidden = function () {
        return !this._isVisible;
    };

    BaseWindow.prototype.isMinimized = function () {
        return this._isMinimized;
    };

    BaseWindow.prototype.isRestored = function () {
        return !this._isMinimized && !this._isMaximized;
    };

    BaseWindow.prototype.isMaximized = function () {
        return this._isMaximized;
    };

    BaseWindow.prototype.isClosed = function () {
        return this._isClosed;
    };

    BaseWindow.prototype.onReady = function (callback) {
        if (this.isClosed()) throw "onReady can't be called on a closed window"; // If window is closed, ignore any new callbacks

        // The window will always be ready AFTER onDOMReady, due to how the window is setup.
        if (this.isReady()) {
            // Window is ready, call callback immediately:
            callback.call(this);
        } else {
            // Window is not ready, add callback to 'ready' event:
            this.addEventListener("ready", callback);
        }
    };

    BaseWindow.prototype.onDOMReady = function (callback) {
        if (this.isClosed()) throw "onDOMReady can't be called on a closed window"; // If window is closed, ignore any new callbacks

        var contentWindow = this.getContentWindow(true);

        if (contentWindow == null) {
            // Alternative if window isn't setup yet:
            setTimeout(this.onDOMReady.bind(this, callback), 5);
        } else if (contentWindow.document.readyState !== "complete") {
            // Window's content window is setup, but DOM is not ready, so add callback to 'load' event:
            contentWindow.addEventListener("load", callback.bind(this), false);
        } else {
            // DOM is ready, call callback immediately:
            callback.call(this);
        }
    };

    BaseWindow.prototype.getTitle = function () {
        var title = this._config.name || "";

        // If window not setup, or window is closed:
        if (!this.isReady()) return title;

        var titleElement = this.getDocument().getElementById("ui-title");
        if (titleElement != null) return titleElement.innerHTML || title;

        return title;
    };

    BaseWindow.prototype.setTitle = function (newName) {
        if (newName == null) return;
        var document = this.getDocument();
        var title = document.getElementById("ui-title");
        if (title == null) {
            title = document.createElement("title");
            title.id = "ui-title";
            document.head.appendChild(title); // Needed for window renaming
        }
        title.innerHTML = newName || this._config.name || "";
    };

    BaseWindow.prototype.getZoom = function () {
        return this.getDocument().body.style.zoom || 1;
    };
    BaseWindow.prototype.setZoom = function (percent) {
        this.getDocument().body.style.zoom = percent;
        this.triggerEvent("zoom", arguments);
    };
    BaseWindow.prototype.zoomIn = function () {
        var document = this.getDocument();
        document.body.style.zoom = (document.body.style.zoom || 1) * 1.1;
        this.triggerEvent("zoom", arguments);
    };
    BaseWindow.prototype.zoomOut = function () {
        var document = this.getDocument();
        document.body.style.zoom = (document.body.style.zoom || 1) / 1.1;
        this.triggerEvent("zoom", arguments);
    };

    BaseWindow.prototype.fitToElement = function (element) {
        if (this.isMaximized()) return; // Can't fit to element if maximized
        if (element == null) element = this._fitToElement;
        if (element == null) return;

        var $element = $(element, this.getDocument());

        this._window.resizeTo($element.outerWidth(true), $element.outerHeight(true), "top-left");
        this._bounds.resizeTo($element.outerWidth(true), $element.outerHeight(true));
    };

    BaseWindow.prototype.addDraggableElements = function (elements) {
        if (elements == null) return;

        this.onReady(function () {
            if (elements.constructor === String) elements = this.getDocument().querySelectorAll(elements);

            for (var index = 0; index < elements.length; index += 1) {
                elements[index].addEventListener("mousedown", this._dragStartEvent);
            }
        });
    };
    BaseWindow.prototype.addDefaultDraggableElements = function () {
        this.addDraggableElements(this.getDocument().querySelectorAll('.ui-draggable'));
    };

    BaseWindow.prototype.moveTo = function (left, top, callback, errorCallback) {
        var newPosition = new Vector(left, top);

        // Check if new position keeps at least one part of all windows in group on atleast one monitor:
        if (this.getCollisionMesh().moveTo(newPosition).someColliding(monitorManager.getMonitors())) {
            // New position is still visible on monitors, so move:
            this._window.moveTo(newPosition.left, newPosition.top, callback, errorCallback);

            // Move children:
            var deltaPos = (new Position(left, top)).subtract(this.getPosition());
            for (var index = 0; index < this._children.length; index += 1) {
                if (this._children[index]._addToParentMesh) this._children[index].moveTo(deltaPos.add(this._children[index].getPosition()));
            }
        }
    };

    BaseWindow.prototype.close = function () {
        this._window.close.apply(this._window, arguments);
    };

    BaseWindow.prototype.minimize = function () {
        this._window.minimize.apply(this._window, arguments);
    };

    BaseWindow.prototype.maximize = function () {
        this._window.maximize.apply(this._window, arguments);
    };

    BaseWindow.prototype.show = function () {
        this._window.show.apply(this._window, arguments);
    };

    BaseWindow.prototype.showAt = function () {
        this._window.showAt.apply(this._window, arguments);
    };

    BaseWindow.prototype.restore = function () {
        this._window.restore.apply(this._window, arguments);
    };

    BaseWindow.prototype.resizeTo = function () {
        this._window.resizeTo.apply(this._window, arguments);
    };

    BaseWindow.prototype.setBounds = function () {
        if (this.isClosed()) return console.warn("Window is closed!");
        this._window.setBounds.apply(this._window, arguments);
    };

    BaseWindow.prototype.hide = function () {
        this._window.hide.apply(this._window, arguments);
    };

    BaseWindow.prototype.bringToFront = function (callback, errorCallback) {
        function callbackWrapper() {
            // Bring children to the front:
            for (var index = 0; index < this._children.length; index += 1) {
                if (this._children[index]._alwaysAboveParent && this._children[index].isVisible()) this._children[index].bringToFront();
            }
            if (callback != null) callback();
        }
        // TODO: Bring to front full heirarchy.
        // WARNING: The this._parent code is commented out as currently it causes an infinite bringToFront loop!
        /*if (this._parent) {
            this._parent_window.bringToFront(this._window.bringToFront.bind(this._window, callbackWrapper.bind(this), errorCallback));
        } else {*/
            this._window.bringToFront(callbackWrapper.bind(this), errorCallback);
        //}
    };

    BaseWindow.prototype.focus = function () {
        this._window.focus.apply(this._window, arguments);
    };

    BaseWindow.prototype.updateOptions = function () {
        // Handle config property:
        // TODO: Update this._config
        this._window.updateOptions.apply(this._window, arguments);
    };

    BaseWindow.prototype.setParent = function (parent) {
        if (parent == this._parent) return;

        if (this._parent) {
            // Remove window from parent:
            var index = this._parent._children.indexOf(this);
            if (index >= 0) {
                this._parent._children.splice(index, 1);
                this._parent.triggerEvent("childremove", this);
            }
            this._parent = undefined;
        } else {
            // Remove from window manager:
            windowManager.removeApplicationWindow(this);
        }

        if (parent == null) {
            windowManager.registerApplicationWindow(this);
        } else {
            this._parent = parent;
            this._parent._children.push(this);
            this._parent.triggerEvent("childadd", this);
        }
        this.triggerEvent("parentset", this._parent);
    };

    BaseWindow.prototype.addChild = function (window) {
        window.setParent(this);
    };

    return BaseWindow;
});

define('DockWindow',[
    './geometry',
    './eventSystem',
    './monitorManager',
    './BaseWindow'
], function (
    geometry,
    eventSystem,
    monitorManager,
    BaseWindow
) {
    "use strict";

    var Vector = geometry.Vector,
        Position = geometry.Vector,
        BoundingBox = geometry.BoundingBox,
        CollisionMesh = geometry.CollisionMesh;

    function DockWindow(config) {
        BaseWindow.apply(this, arguments);
        this._dockedGroup = [this];
		this._isDocked = false;
        //this.isDocked = observable(false);

        this.addEventListener("_bringToFront", function () {
            //If the windows are dockedGrouped bring them to the front in unison - dockedGroup includes curWnd already
            for (var index = 0; index < this._dockedGroup.length; index += 1) {
                if (this !== this._dockedGroup[index]) this._dockedGroup[index].bringToFront();
            }
        });

        this.addEventListener("_bringChildrenToFront", function () {
            //If the child windows are dockedGrouped bring them to the front in unison - dockedGroup includes curWnd already
            for (var i = 0; i < this._dockedGroup.length; i += 1) {
                var window = this._dockedGroup[i];
                if (this !== window) {
                    for (var j = 0; j < window._children.length; j += 1) {
                        if (window._children[j]._alwaysAboveParent && !window._children[j].isVisible()) {
                            window._children[j].bringToFront();
                            window._children[j].focus();
                        }
                    }
                }
            }
        });
        
        this.addEventListener("hidden", this.undock);
        this.addEventListener("minimized", this.undock);
        this.addEventListener("maximized", this.undock);
        this.addEventListener("closed", this.undock);

        // Dock when snapped:
        this.addEventListener("_endSnap", this.dock);
    }
    DockWindow.prototype = Object.create(BaseWindow.prototype);
    DockWindow.prototype.constructor = DockWindow;

    DockWindow.prototype.toBase = function () {
        //var obj = JSON.parse(JSON.stringify(this));
        var obj = {};
        for (var prop in this) {
            if (this.hasOwnProperty(prop)) obj[prop] = this[prop];
        }
        obj.__proto__ = BaseWindow.prototype;
        return obj;
    };

    DockWindow.prototype.dock = function (other) {
        if (!(other instanceof DockWindow)) throw "dock requires argument 'other' to be of type DockWindow";
        if (this._dockedGroup.indexOf(other) >= 0) return; // Don't have to do anything if already docked!

        var otherGroup = other._dockedGroup;

        for (var index = 0; index < otherGroup.length; index += 1) {
            if (this._dockedGroup.indexOf(otherGroup[index]) < 0) {
                this._dockedGroup.push(otherGroup[index]);
                otherGroup[index]._dockedGroup = this._dockedGroup;
            }
        }
        
        for (var index = 0; index < this._dockedGroup.length; index += 1) {
            //this._dockedGroup[index].isDocked(true);
			this._dockedGroup[index]._isDocked = true;
        }
    };

    DockWindow.prototype.undock = function () {
        if (this._dockedGroup.length === 1) return; // Bail early if not docked to anything

        // Store old group:
        var oldGroup = this._dockedGroup;

        // Undock all:
        for (var i = 0; i < oldGroup.length; i += 1) {
            oldGroup[i]._dockedGroup = [oldGroup[i]];
            //oldGroup[i].isDocked(false);
			oldGroup[i]._isDocked = false;
        }

        // Remove this window from oldGroup:
        var index = oldGroup.indexOf(this);
        if (index >= 0) oldGroup.splice(index, 1);

        // Check if other docked windows can be grouped together:
        for (var i = 0; i < oldGroup.length; i += 1) {
            var window = oldGroup[i];
            for (var j = 0; j < oldGroup.length; j += 1) {
                // Check if window touches edge of another window:
                if (oldGroup[j] !== window && window.getCollisionMesh().isTouching(oldGroup[j])) window.dock(oldGroup[j]);
            }
        }
    };

    DockWindow.prototype.getCollisionMeshWindows = function (ignoreDockedGroup) {
        if (!this.isReady()) throw "getCollisionMesh can't be called on an unready window";
        // Does not use super, to avoid changing the proto of this in windows array.
        var windows = [this];
        for (var index = 0; index < this._children.length; index += 1) {
            if (this._children[index]._addToParentMesh) windows = windows.concat(this._children[index].getCollisionMeshWindows());//windows.push(this._children[index]);
        }
        if (!ignoreDockedGroup) {
            for (var index = 0; index < this._dockedGroup.length; index += 1) {
                // Ignore this window, as it was already added by the super:
                if (this._dockedGroup[index] !== this) windows = windows.concat(this._dockedGroup[index].getCollisionMeshWindows(true));//windows.push(this._dockedGroup[index]);
            }
        }
        return windows;
    };

    DockWindow.prototype.getCollisionMesh = function () {
        if (!this.isReady()) throw "getCollisionMesh can't be called on an unready window";
        // Call super on each docked window:
        var boxes = [];
        for (var index = 0; index < this._dockedGroup.length; index += 1) {
            boxes = boxes.concat(this._dockedGroup[index].toBase().getCollisionMesh().boxes);//BaseWindow.prototype.getCollisionMesh.call(this).boxes);
        }
        return new CollisionMesh(boxes);
    };

    DockWindow.prototype.getBoundingBox = function () {
        if (!this.isReady()) throw "getBoundingBox can't be called on an unready window";
        return this.getCollisionMesh().getBoundingBox();
    };

    DockWindow.prototype.moveTo = function (left, top, callback, errorCallback) {
        var newPosition = new Vector(left, top);

        // Check if new position keeps at least one part of all windows in group on atleast one monitor:
        if (this.getCollisionMesh().moveTo(newPosition).someColliding(monitorManager.getMonitors())) {
            // Move children and docked group:
            var deltaPos = (new Position(left, top)).subtract(this.getPosition());
            for (var index = 0; index < this._children.length; index += 1) {
                if (this._children[index]._addToParentMesh) this._children[index].moveTo(deltaPos.clone().add(this._children[index].getPosition()));
            }
            for (var index = 0; index < this._dockedGroup.length; index += 1) {
                // Docked group contains this window as well.
                if (this._dockedGroup[index] != this) this._dockedGroup[index].toBase().moveTo(deltaPos.clone().add(this._dockedGroup[index].getPosition()));
            }
            var newPos = deltaPos.clone().add(this.getPosition());
            this.toBase().moveTo(newPos.left, newPos.top, callback, errorCallback);
        }
    };
	
	DockWindow.prototype.isDocked = function () {
		return this._isDocked;
	};

    return DockWindow;
});

define('scalejs.windowfactory-openfin',[
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


