define([
], function (
) {
	"use strict";

	function Vector(left, top) {
		if (!(this instanceof Vector)) return new Vector(left, top);
		
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
	Vector.prototype.getCollisionMesh = function () {
	    return new CollisionMesh(this.getBoundingBox());
	};
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
		if (!(this instanceof BoundingBox)) return new BoundingBox(left, top, right, bottom);
		
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
		if (!(this instanceof CollisionMesh)) return new CollisionMesh(boxes);
		
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
	CollisionMesh.prototype.getColliding = function (other) {
	    if (other == null) throw "getColliding requires argument 'other'";
	    other = (other.constructor === Array ? new CollisionMesh(other) : other.getCollisionMesh());
	    if (other.constructor !== CollisionMesh) throw "getColliding requires argument 'other' to resolve to type CollisionMesh";

	    for (var index = 0; index < this.boxes.length; index += 1) {
	        var collided = this.boxes[index].getColliding(other.boxes);
	        if (collided) return collided;
	    }
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
