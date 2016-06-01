define([
    './geometry',
    './monitorManager',
    './windowManager'
], function (
    geometry,
    monitorManager,
    windowManager
) {
    "use strict";

    var Vector = geometry.Vector,
        Position = geometry.Vector,
        Size = geometry.Vector,
        BoundingBox = geometry.BoundingBox,
        CollisionMesh = geometry.CollisionMesh,
        snapPixels = 5,
        // TODO: add allowable event types????
        forbiddenEventTypes = new Set([]);

    function setupDOM() {
        // Handle config property:
        var thisWindow = this;
		thisWindow.setTitle(); // set using default this._title
		this._window.getState(function (state) {
			thisWindow._isMinimized = (state === "minimized");
			thisWindow._isMaximized = (state === "maximized");
		});
        this._window.getOptions(function (options) {
            thisWindow._config = options;
			thisWindow.setTitle(); // set using default this._uuid
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
                var child = thisWindow._children[index];
                if (child.isVisible()) {
                    if (!child._config.showTaskbarIcon && child._showOnParentShow) {
                        child.hide();
                    } else {
                        child.minimize();
                    }
                }
            }
            thisWindow._isMinimized = true;
            thisWindow._isMaximized = false;
            thisWindow.fitToElement();
            thisWindow.triggerEvent("minimized", event);
        });
        this._window.addEventListener("restored", function (event) {
            for (var index = 0; index < thisWindow._children.length; index += 1) {
                if (thisWindow._children[index]._showOnParentShow) thisWindow._children[index].show();
                if (!thisWindow._children[index].isVisible()) thisWindow._children[index].restore();
            }
            thisWindow._isMinimized = false;
            thisWindow._isMaximized = false;
            thisWindow.fitToElement();
            thisWindow._syncBounds();
            thisWindow.triggerEvent("restored", event);
        });
        this._window.addEventListener("maximized", function (event) {
            thisWindow._isMinimized = false;
            thisWindow._isMaximized = true;
            thisWindow._syncBounds();
            thisWindow.triggerEvent("maximized", event);
        });

        // Other events:
        this._window.addEventListener("closed", thisWindow.triggerEvent.bind(this, "closed"));
        this._window.addEventListener("focused", function (event) {
            if (thisWindow._parent) thisWindow._parent.bringToFront();
            thisWindow.bringToFront();
            if (!monitorManager.isVisible(thisWindow)) thisWindow.moveTo(thisWindow.getCollisionMesh().getBoundingBox().getCenteredOnPosition(monitorManager.getMouseMonitor()));
            for (var index = 0; index < thisWindow._children.length; index += 1) {
                if (thisWindow._children[index].isReady()) thisWindow._children[index].bringToFront();
            }
            windowManager.setFocusedWindow(thisWindow);
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
        thisWindow._syncBounds();
        thisWindow._isResizing = false;

        //// Store window position and size on window move:
        function updatePositionAndSize(event) {
            var oldBounds = thisWindow._bounds.clone();
            thisWindow._bounds = new BoundingBox(event.left, event.top, event.left + event.width, event.top + event.height);
            if (event.changeType !== 0) {
                //thisWindow.undock();
                if (event.type.indexOf("changing") >= 0) {
                    if (!thisWindow.isResizing()) {
                        thisWindow._isResizing = true;
                        // TODO: Cache all windows in resize group (what edge they are part of & starting position):
                        thisWindow._startResizingBounds = oldBounds.clone();
                        thisWindow._resizeEdgeBuckets = thisWindow._getEdgeBuckets(thisWindow._startResizingBounds);
                    }
                } else {
                        thisWindow._isResizing = false;
                }
                // TODO: Pass in window cached window edges & diff from starting resize event!
                var diffBounds = thisWindow._bounds.difference(thisWindow._startResizingBounds);
                thisWindow._resizedEvent(thisWindow._resizeEdgeBuckets, diffBounds);
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
                //this.undock();
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
                if (meshWindows.indexOf(otherWindows[index]) < 0 && otherWindows[index].isVisible() && otherWindows[index].isReady()) snapWindows.push(otherWindows[index]);
            }

			// TODO: Add monitor snapping here, before window snapping.

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
            if (mouseDown) onDrag(event.screenX - dragStartX, event.screenY - dragStartY, false);
        });

        //// Setup drag end:
        window.addEventListener("mouseup", function (event) {
            if (mouseDown) {
                mouseDown = false;

                onDrag(event.screenX - dragStartX, event.screenY - dragStartY, true);

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

		thisWindow.addEventListener("_childLostFocus", function () {
            if (thisWindow._closeOnLostFocus && !(thisWindow.isFocused() || thisWindow.isNextFocused()) && !(thisWindow.isChildFocused() || thisWindow.isChildNextFocused())) thisWindow.close();
            var parent = thisWindow.getParent();
            if (parent != null) parent.triggerEvent("_childLostFocus", thisWindow);
        });

        thisWindow._window.addEventListener("blurred", function (event) {
            if (thisWindow._closeOnLostFocus && !(thisWindow.isChildFocused() || thisWindow.isChildNextFocused())) thisWindow.close();
            var parent = thisWindow.getParent();
            if (parent != null) setTimeout(function () {
                parent.triggerEvent("_childLostFocus", thisWindow);
            }, 25); // Temp fix for focus being delayed between blur of one window, and focus of another

            //Need to deal with chromium not bring its select windows to the front after the bringToFront event is called on a parent window
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
                /*var windows = windowManager.getWindows();
                for (var index = 0; index < windows.length; index += 1) {
                    if (windows[index] !== thisWindow && !windows[index].isChildOf(thisWindow) && windows[index]._closeOnLostFocus) {
                        //windows[index][windows[index]._config.hideOnClose ? "hide" : "close"]();
						windows[index].close();
                    }
                }*/

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
			window.addEventListener('keydown', function (event) {
                if (event.ctrlKey && (event.keyCode === 48 || event.keyCode === 96)) { // ctrl+digit0 or ctrl+numpad0
                    thisWindow.resetZoom();
                }
            });
        }

		function done() {
            thisWindow._syncBounds(function () {
                thisWindow._isReady = true; // TODO: Is this correct to be here?
                thisWindow.triggerEvent("ready");
                delete thisWindow._eventListeners["ready"];
            }, function () {
                throw "Failed to sync bounds for window! Error:" + JSON.stringify(arguments);
            });
		}

		function _show() {
			if (thisWindow._autoShow) {
				thisWindow.show(true, done, function () {
					throw "Failed to show window! Error:" + JSON.stringify(arguments);
				});
			} else {
				done();
			}
		}

		if (thisWindow._showPosition && thisWindow._showSize) {
			thisWindow.setBounds(thisWindow._showPosition.left, thisWindow._showPosition.top,
										 thisWindow._showSize.left, thisWindow._showSize.top, _show, function () {
				throw "Failed to set bounds for window! Error:" + JSON.stringify(arguments);
			});
		} else if (thisWindow._showPosition) {
			if (thisWindow._autoShow) {
				thisWindow.showAt(thisWindow._showPosition.left, thisWindow._showPosition.top, true, done, function () {
					throw "Failed to showAt for window! Error:" + JSON.stringify(arguments);
				});
			} else {
				thisWindow.moveTo(thisWindow._showPosition.left, thisWindow._showPosition.top, done, function () {
					throw "Failed to moveTo for window! Error:" + JSON.stringify(arguments);
				});
			}
		} else if (thisWindow._showSize) {
			thisWindow.resizeTo(thisWindow._showSize.left, thisWindow._showSize.top, "top-left", _show, function () {
				throw "Failed to resizeTo for window! Error:" + JSON.stringify(arguments);
			});
		} else {
			_show();
		}
    }

    function BaseWindow(config, _) {
		if (!(this instanceof BaseWindow)) return new BaseWindow(config);

        if (config == null) config = {}; // If no arguments are passed, assume we are creating a default blank window
        var isArgConfig = (config.app_uuid == null);

		// Handle OpenFin properties:
		if (isArgConfig) {
			config.showTaskbarIcon = (config.showTaskbarIcon != null ? config.showTaskbarIcon : true);
			if (config.name == null) {
				if (config.showTaskbarIcon === true) {
					throw "new BaseWindow(config) requires 'config.name' to be set when 'config.showTaskbarIcon' is 'true'!";
				} else {
					// No window name given, and showTaskbarIcon is not set!
					// Therefore default to not showing taskbar and give a random unique name:
					config.showTaskbarIcon = false;
					config.name = config.uuid || windowManager.getUniqueWindowName(); // If no name passed, create a unique one.
					this._title = config.name;
				}
			} else {
				this._title = config.name;
				config.name = config.uuid || windowManager.getUniqueWindowName();
			}
			config.saveWindowState = config.saveWindowState || false;
			this._autoShow = config.autoShow;
			config.autoShow = false;
			if (config.position) {
				// TODO: Validate right format
				this._showPosition = new Position(config.position.left, config.position.top);
				delete config.position;
			}
			if (config.size) {
				// TODO: Validate right format
				this._showSize = new Size(config.size.width, config.size.height);
				delete config.size;
			}
		}

        // Handle base hidden properties:
		this._uuid = config.name;
		delete config.uuid;
		this.description = (isArgConfig ? config.description : "");
		delete config.description;
		this.debug = (isArgConfig ? config.debug : "");
		delete config.debug;
        this._config = {};
        this._eventListeners = {};
        this._isReady = false;
        this._isClosed = false;
		this._isResizing = false;
        this._isVisible = (isArgConfig ? config.autoShow : false);
		this._isMinimized = (isArgConfig && config.state != null ? (config.state === "minimized") : false);
		this._isMaximized = (isArgConfig && config.state != null ? (config.state === "maximized") : false);
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
				if (thisWindow._isVisible) {
					thisWindow.triggerEvent("shown");
				} else {
					thisWindow.triggerEvent("hidden");
				}
            });
			this._window.getState(function (state) {
				thisWindow._isMinimized = (state === "minimized");
				thisWindow._isMaximized = (state === "maximized");
				if (thisWindow.isMinimized()) {
					thisWindow.triggerEvent("minimized");
				} else if (thisWindow.isMaximized()) {
					thisWindow.triggerEvent("maximized");
				} else {
					thisWindow.triggerEvent("restored");
				}
			});
            this._window.getOptions(function (options) {
                thisWindow._config = options;
				thisWindow._title = options.name;
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
            this._parent.addEventListener("closed", function () {
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
        //var contentWindow = this.getContentWindow();
        //if (contentWindow == null) throw "getPosition was unable to access window's contentWindow";

        return this._bounds.getPosition();//new Vector(contentWindow.screenLeft, contentWindow.screenTop);
    };
    BaseWindow.prototype.getVector = BaseWindow.prototype.getPosition;

    BaseWindow.prototype.getWidth = function () {
        if (!this.isReady()) throw "getWidth can't be called on an unready window";
        return this._bounds.getWidth();//this.getContentWindow().outerWidth;
    };

    BaseWindow.prototype.getHeight = function () {
        if (!this.isReady()) throw "getHeight can't be called on an unready window";
        return this._bounds.getHeight();//this.getContentWindow().outerHeight;
    };

    BaseWindow.prototype.getSize = function () {
        return new Vector(this.getWidth(), this.getHeight());
    };

    BaseWindow.prototype.getCollisionMeshWindows = function (opts) {
        if (!this.isReady()) throw "getCollisionMesh can't be called on an unready window";
        // TODO: Include children in mesh, if child extends parent.
        opts = opts || {};
        var windows = [this];
        if (!opts.ignoreChildren) {
            for (var index = 0; index < this._children.length; index += 1) {
                if (this._children[index]._addToParentMesh) windows = windows.concat(this._children[index].getCollisionMeshWindows(opts));//windows.push(this._children[index]);
            }
        }
        return windows;
    };

    BaseWindow.prototype.getCollisionMesh = function (opts) {
        //if (!this.isReady()) throw "getCollisionMesh can't be called on an unready window";
        // TODO: Include children in mesh, if child extends parent.
        var boxes = [this.getBounds()];
        opts = opts || {};
        if (!opts.ignoreChildren) {
            for (var index = 0; index < this._children.length; index += 1) {
                if (this._children[index]._addToParentMesh) {
                    boxes = boxes.concat(this._children[index].getCollisionMesh(opts).boxes)
                }
            }
        }
        return new CollisionMesh(boxes);
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

    BaseWindow.prototype._syncBounds = function (callback, errorCallback) {
        var thisWindow = this;
        if (this.isRestored()) {
            this._bounds = new BoundingBox(window.screenLeft, window.screenTop,
                window.screenLeft + window.outerWidth, window.screenTop + window.outerHeight);
            this._window.getBounds(function (event) {
                thisWindow._bounds = new BoundingBox(event.left, event.top, event.left + event.width, event.top + event.height);
                if (callback) callback();
            }, errorCallback);
        } else if (this.isMaximized()) {
            this._bounds = this.getMonitor().availableRect.clone();
        }
    };

    BaseWindow.prototype.getMonitor = function () {
		var collisionMesh = this.getCollisionMesh(),
			monitors = monitorManager.getMonitors();

		for (var index = 0; index < monitors.length; index += 1) {
			if (collisionMesh.isColliding(monitors[index])) return monitors[index];
		}
    };

    BaseWindow.prototype.addEventListener = function (eventName, eventListener) {
        if (this.isClosed()) throw "addEventListener/on can't be called on a closed window"; // If window is closed, ignore any new callbacks
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
	BaseWindow.prototype.on = BaseWindow.prototype.addEventListener;

	BaseWindow.prototype.once = function (eventName, eventListener) {
        if (this.isClosed()) throw "once can't be called on a closed window"; // If window is closed, ignore any new callbacks
		var thisWindow = this;

		function onceListener() {
			thisWindow.off(eventName, onceListener);
			eventListener.apply(this, arguments);
		}

		this.on(eventName, onceListener);
	};

    BaseWindow.prototype.removeEventListener = function (eventName, eventListener) {
        eventName = eventName.toLowerCase();
        // If event listeners don't exist, bail:
        if (this._eventListeners[eventName] == null) return;

        // Check if eventListener is a function:
        if (eventListener == null || eventListener.constructor !== Function) throw "removeEventListener/off requires argument 'eventListener' of type Function";

        // Remove event listener, if exists:
        var index = this._eventListeners[eventName].indexOf(eventListener);
        if (index >= 0) this._eventListeners[eventName].splice(index, 1);
    };
	BaseWindow.prototype.off = BaseWindow.prototype.removeEventListener;

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

    BaseWindow.prototype.isResizing = function () {
        return this._isResizing;
    };

    BaseWindow.prototype.isVisible = function () {
        return this._isVisible;
    };
    BaseWindow.prototype.isHidden = function () {
        return !this._isVisible;
    };

    BaseWindow.prototype.isFocused = function () {
        return this.isReady() && (this.getDocument().hasFocus() || windowManager.getFocusedWindow() === this); // TODO: Unsure if the || creates an issue, might want to eliminate one...
        // We added windowManager check because otherwise sub context menus don't have focus for some reason.
    };
    BaseWindow.prototype.isNextFocused = function () {
        return this.isReady() && windowManager.getNextFocusedWindow() === this;
    };
    BaseWindow.prototype.isChildFocused = function () {
		var children = this.getChildren();
		for (var index = 0; index < children.length; index += 1) {
			if (children[index].isFocused() || children[index].isChildFocused()) return true;
		}
		return false;
    };
    BaseWindow.prototype.isChildNextFocused = function () {
		var children = this.getChildren();
		for (var index = 0; index < children.length; index += 1) {
			if (children[index].isNextFocused() || children[index].isChildNextFocused()) return true;
		}
		return false;
    };
    BaseWindow.prototype.isBlurred = function () {
        return !this.getDocument().hasFocus();
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

	BaseWindow.prototype.getGUID = function () {
        if (!this.isReady()) throw "getGUID/getUUID can't be called on an unready window";
        if (this.isClosed()) throw "getGUID/getUUID can't be called on a closed window";
		return this._uuid;
	};
	BaseWindow.prototype.getUUID = BaseWindow.prototype.getGUID;

    BaseWindow.prototype.getTitle = function () {
        var title = this._title || this._uuid || "";

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
		var oldname = this._title || this._uuid || "";
		this._title = newName || this._title || this._uuid || "";
        title.innerHTML = this._title;
		this.triggerEvent("rename", this._title, oldname);
    };

    BaseWindow.prototype.getZoom = function () {
        return this.getDocument().body.style.zoom || 1;
    };
    BaseWindow.prototype.setZoom = function (percent) {
        this.getDocument().body.style.zoom = percent;
        this.triggerEvent("zoom", arguments);
    };
	BaseWindow.prototype.resetZoom = function () {
		this.setZoom(1);
	}
    BaseWindow.prototype.zoomIn = function () {
		this.setZoom(this.getZoom() * 1.1);
    };
    BaseWindow.prototype.zoomOut = function () {
		this.setZoom(this.getZoom() / 1.1);
    };

    BaseWindow.prototype.fitToElement = function (element, callback, errorCallback) {
        if (this.isMaximized()) return; // Can't fit to element if maximized
        if (element == null) element = this._fitToElement;
        if (element == null) return;

        var $element = $(element, this.getDocument());

		var width = Math.max(Math.min($element.outerWidth(true), this._config.maxWidth || 65535), this._config.minWidth || 0);
		var height = Math.max(Math.min($element.outerHeight(true), this._config.maxHeight || 65535), this._config.minHeight || 0);
        this.resizeTo(width, height, "top-left", callback, errorCallback);
		//this._bounds.resizeTo(width, height);
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
            //this._bounds.moveTo(newPosition.left, newPosition.top);

            // Move children:
            var deltaPos = (new Position(left, top)).subtract(this.getPosition());
            for (var index = 0; index < this._children.length; index += 1) {
                if (this._children[index]._addToParentMesh) this._children[index].moveTo(deltaPos.add(this._children[index].getPosition()));
            }
        }
    };

    BaseWindow.prototype.close = function () {
        if (this._config.hideOnClose) {
            this._window.hide.apply(this._window, arguments);
        } else {
            this._window.close.apply(this._window, arguments);
        }
    };
	BaseWindow.prototype._close = function () {
		this._window.close.apply(this._window, arguments);
	};

    BaseWindow.prototype.minimize = function () {
        if (!this.isReady()) throw "minimize can't be called on an unready window";

		if (this._config.showTaskbarIcon) {
			this._window.minimize.apply(this._window, arguments);
		} else if (this._config.hideOnClose) {
			this.hide.apply(this, arguments);
		} else {
			this.close.apply(this, arguments);
		}
    };

    BaseWindow.prototype.maximize = function () {
        if (!this.isReady()) throw "maximize can't be called on an unready window";
        this._window.maximize.apply(this._window, arguments);
    };

    BaseWindow.prototype.show = function () {
        if (!this.isReady()) throw "show can't be called on an unready window";
        this._window.show.apply(this._window, arguments);
    };

    BaseWindow.prototype.showAt = function (left, top) {
        if (!this.isReady()) throw "showAt can't be called on an unready window";
        this._window.showAt.apply(this._window, arguments);
        //this._bounds.moveTo(left, top);
    };

    BaseWindow.prototype.restore = function () {
        if (!this.isReady()) throw "restore can't be called on an unready window";
        this._window.restore.apply(this._window, arguments);
    };

    function arrayRemove(arr, value) {
        var nindex = 0;
        for (var index = 0; index < arr.length; index += 1) {
            if (arr[index] !== value) {
                arr[nindex] = arr[index];
                nindex += 1;
            }
        }
        arr.length = nindex;
    };
    function arrayFilter(arr, callback) {
        var nindex = 0;
        for (var index = 0; index < arr.length; index += 1) {
            if (callback(arr[index], index, arr)) {
                arr[nindex] = arr[index];
                nindex += 1;
            }
        }
        arr.length = nindex;
    };

    BaseWindow.prototype._getEdgeBuckets = function (oldBounds) {
        // These 4 buckets are used to determine what dock windows belong where:
        var buckets = { left: [], top: [], right: [], bottom: [] };

        var windows = this.getCollisionMeshWindows({ ignoreChildren: true }); // Ignore child windows as they are handled by parents on move.
        arrayRemove(windows, this);
        var lastWindows = windows.length;

        function genWindowObj(window) {
            return {
                window: window,
                pos: window.getPosition(),
                children: window.getChildren().filter(function (child) {
                    return child._addToParentMesh;
                }).map(genWindowObj)
            };
        }

        // First loop through windows to determine what windows touch this window, and add to bucket.
        arrayFilter(windows, function (window) {
            var edgeTouching = window.getBounds().getOtherEdgeTouching(oldBounds);
            if (edgeTouching != null) {
                buckets[edgeTouching].push(genWindowObj(window));
                return false;
            }
            return true;
        });

        // Loop through remaining dockedGroup to determine where each window should go based on collisionmesh check to each bucket.
        while (windows.length > 0 && windows.length < lastWindows) {
            lastWindows = windows.length;

            // Precompute to make edge detection better:
            var collisionMeshes = {
                left: new CollisionMesh(buckets.left.map(function (state) { return state.window; }), { ignoreDockedGroup: true }),
                top: new CollisionMesh(buckets.top.map(function (state) { return state.window; }), { ignoreDockedGroup: true }),
                right: new CollisionMesh(buckets.right.map(function (state) { return state.window; }), { ignoreDockedGroup: true }),
                bottom: new CollisionMesh(buckets.bottom.map(function (state) { return state.window; }), { ignoreDockedGroup: true }),
            };
            var newBuckets = { left: [], top: [], right: [], bottom: [] };

            // Filter remaining windows:
            arrayFilter(windows, function (window) {
                var windowBounds = window.getBounds();
                var edges = oldBounds.getEdgeClosestOrder(windowBounds); // Look at the edges in shortest distance order
                // The order helps with minimizing resize overlaps between windows.
                for (var index = 0; index < edges.length; index += 1) {
                    var edge = edges[index];
                    if (windowBounds.getOtherEdgeTouching(collisionMeshes[edge].boxes) != null) {
                        newBuckets[edge].push(genWindowObj(window));
                        return false;
                    }
                }
                return true;
            });

            // Push new bucketed windows to buckets:
            for (var edge in buckets) {
                buckets[edge].push.apply(buckets[edge], newBuckets[edge]);
            }
        }

        return buckets;
    };

    BaseWindow.prototype._resizedEvent = function (buckets, posDiff) {
        function moveWindow(state) {
            var window = state.window;
            var windowStartPos = state.pos;
            //var windowBounds = window.getBounds();
            window.toBase().moveTo(windowStartPos.left + leftDiff, windowStartPos.top + topDiff);
            window._bounds.moveTo(windowStartPos.left + leftDiff, windowStartPos.top + topDiff);
            state.children.forEach(moveWindow);
        }
        // Perform move of buckets:
        for (var edge in buckets) {
            var bucket = buckets[edge];
            var leftDiff = 0;
            var topDiff = 0;
            if (edge === "left" || edge === "right") {
                leftDiff = posDiff[edge];
            } else if (edge === "top" || edge === "bottom") {
                topDiff = posDiff[edge];
            }
            for (var index = 0; index < bucket.length; index += 1) {
                moveWindow(bucket[index]);
                /*var window = bucket[index].window;
                var windowStartPos = bucket[index].pos;
                //var windowBounds = window.getBounds();
                window.toBase().moveTo(windowStartPos.left + leftDiff, windowStartPos.top + topDiff);
                window._bounds.moveTo(windowStartPos.left + leftDiff, windowStartPos.top + topDiff);*/
            }
        }
        // TODO: Remove the on resize event that undocks windows.
    }
    BaseWindow.prototype.resizeTo = function (width, height, anchor, callback, errorCallback) {
        if (!this.isReady()) throw "resizeTo can't be called on an unready window";
		//if (arguments.length < 2) throw "resizeTo function requires at least two arguments!";

        // Perform resize:
        this._startResizingBounds = this.getBounds();
        this._resizeEdgeBuckets = this._getEdgeBuckets(this._startResizingBounds);
        this._isResizing = true;
        this._bounds.resizeTo(arguments[0], arguments[1]); // Maybe done in success callback?
        this._window.resizeTo.apply(this._window, arguments);
    };

    BaseWindow.prototype.setBounds = function (left, top, width, height) {
        if (this.isClosed()) return console.warn("Window is closed!");
        //this._startResizingBounds = this.getBounds();
        //this._resizeEdgeBuckets = this._getEdgeBuckets(this._startResizingBounds);
        //this._isResizing = true;
        //this._bounds.set(left, top, left + width, top + height); // Maybe done in success callback?
        this._window.setBounds.apply(this._window, arguments);
        //this._bounds.resizeTo(width, height).moveTo(left, top);
    };

    BaseWindow.prototype.hide = function () {
        if (!this.isReady()) throw "hide can't be called on an unready window";
        this._window.hide.apply(this._window, arguments);
    };

    BaseWindow.prototype.bringToFront = function (callback, errorCallback) {
        if (!this.isReady()) throw "bringToFront can't be called on an unready window";
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

    BaseWindow.prototype.focus = function (callback, errorCallback) {
        if (!this.isReady()) throw "focus can't be called on an unready window";

        var window = this;
        function callbackWrapper() {
            windowManager.setNextFocusedWindow(undefined);
            windowManager.setFocusedWindow(window);
            if (callback != null) callback();
        }
        function errorCallbackWrapper() {
            windowManager.setNextFocusedWindow(undefined);
        }

        windowManager.setNextFocusedWindow(this);
        this._window.focus(callbackWrapper, errorCallbackWrapper);
    };

    BaseWindow.prototype.animate = function () {
        this._window.animate.apply(this._window, arguments);
    };

    BaseWindow.prototype.updateOptions = function (options, callback, errorCallback) {
        // Handle config property:
		var thisWindow = this;

		function onSuccess() {
			// TODO: Validate config? Maybe pull from getOptions? Is it needed since openfin should error on bad fields?
			for (var field in options) {
				thisWindow._config[field] = options[field];
			}
			if (callback != null && callback.constructor !== Function) callback.apply(thisWindow._window, arguments);
		}

        this._window.updateOptions(options, onSuccess, errorCallback);
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
