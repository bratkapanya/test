// Copyright (c) 2015 Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
(function() {
	"use strict";

	var quixote = require("./vendor/quixote-0.9.0.js");
	var assert = require("../../shared/_assert.js");

	exports.TRANSPARENT = "rgba(0, 0, 0, 0)";
	exports.WHITE = "rgb(255, 255, 255)";
	exports.DARK_GRAY = "rgb(89, 89, 89)";
	exports.GRAY = "rgb(229, 229, 229)";
	exports.DARKENED_GRAY = "rgb(217, 217, 217)";
	exports.MEDIUM_GRAY = "rgb(167, 169, 171)";

	exports.BACKGROUND_BLUE = "rgb(65, 169, 204)";
	exports.DARK_BLUE = "rgb(13, 87, 109)";
	exports.MEDIUM_BLUE = "rgb(0, 121, 156)";
	exports.DARKENED_MEDIUM_BLUE = "rgb(0, 111, 143)";

	exports.BODY_TEXT_WEIGHT = "300";
	exports.LINK_BUTTON_WEIGHT = "400";
	exports.DRAWING_BUTTON_WEIGHT = "600";
	exports.HEADLINE_WEIGHT = "600";

	exports.IOS_BROWSER_WIDTH = 980;
	exports.IPAD_LANDSCAPE_HEIGHT_WITH_BROWSER_TABS = 641;

	exports.STANDARD_FONT = "alwyn-new-rounded-web, Helvetica, sans-serif";
	exports.CORNER_ROUNDING = "2px";
	exports.BUTTON_DROP_SHADOW = " 0px 1px 0px 0px";


	exports.setupUnitTests = function setupUnitTests() {

		before(function(done) {
			exports.frame = quixote.createFrame({
				width: 500,
				stylesheet: [
					"/base/src/client/content/vendor/normalize-3.0.2.css",
					"/base/src/client/content/screen.css"
				]
			}, done);
		});

		after(function() {
			exports.frame.remove();
		});

		beforeEach(function() {
			exports.frame.reset();
		});
	};

	exports.backgroundColor = function backgroundColor(element) {
		return normalizeColorString(element.getRawStyle("background-color"));
	};

	exports.fontFamily = function fontFamily(element) {
		var family = element.getRawStyle("font-family");
		family = family.replace(/\"/g, '');

		var fonts = family.split(",");
		for (var i = 0; i < fonts.length; i++) {
			fonts[i] = trim(fonts[i]);
		}

		return fonts.join(", ");
	};

	exports.textAlign = function textAlign(element) {
		return element.getRawStyle("text-align");
	};

	exports.fontWeight = function fontWeight(element) {
		var weight = element.getRawStyle("font-weight");
		if (weight === "normal") weight = "400";
		return weight.toString();
	};

	exports.fontSize = function fontSize(element) {
		return element.getRawStyle("font-size");
	};

	exports.textColor = function textColor(element) {
		return normalizeColorString(element.getRawStyle("color"));
	};

	exports.roundedCorners = function roundedCorners(element) {
		return getCompoundStyle(element,
			"border-top-left-radius",
			"border-top-right-radius",
			"border-bottom-left-radius",
			"border-bottom-right-radius"
		);
	};

	exports.margin = function margin(element) {
		return getCompoundStyle(element, "margin-top", "margin-right", "margin-bottom", "margin-left");
	};

	exports.padding = function padding(element) {
		return getCompoundStyle(element, "padding-top", "padding-right", "padding-bottom", "padding-left");
	};

	exports.under = function under(element, relativeToElement) {
		var elementZ = getZIndex(element);
		var relativeZ = getZIndex(relativeToElement);

		if (elementZ === relativeZ) {
			return !isElementAfterElementInDomTree();
		}
		else {
			return (elementZ < relativeZ);
		}

		function getZIndex(element) {
			var z = element.getRawStyle("z-index");
			if (z === "auto") z = 0;
			return z;
		}

		function isElementAfterElementInDomTree() {
			var elementNode = element.toDomElement();
			var relativeNode = relativeToElement.toDomElement();

			var foundRelative = false;
			var elementAfterRelative = false;
			for (var child = elementNode.parentNode.firstChild; child !== null; child = child.nextSibling) {
				if (child === elementNode) {
					if (foundRelative) elementAfterRelative = true;
				}
				if (child === relativeNode) foundRelative = true;
			}
			if (!foundRelative) throw new Error("can't yet compare elements that have same z-index and are not siblings");
			return elementAfterRelative;
		}
	};

	exports.backgroundImage = function backgroundImage(element) {
		var url = element.getRawStyle("background-image");

		var parsedUrl = url.match(/^url\("?http:\/\/(.+?)(\/.*?)"?\)$/);    // strip off domain
		if (parsedUrl === null) throw new Error("could not parse URL: " + url);

		return parsedUrl[2];
	};

	exports.backgroundPosition = function backgroundImage(element) {
		var position = element.getRawStyle("background-position");

		if (position === "" || position === "50%" || position === "50% 50%") {
			return "center";
		}
		else {
			return position;
		}
	};

	exports.hasBorder = function hasBorder(element) {
		var top = element.getRawStyle("border-top-style");
		var right = element.getRawStyle("border-right-style");
		var bottom = element.getRawStyle("border-bottom-style");
		var left = element.getRawStyle("border-left-style");
		return !(top === "none" && right === "none" && bottom === "none" && left === "none");
	};

	exports.isTextVerticallyCentered = function isTextVerticallyCentered(element) {
		var elementHeight = Math.round(element.getRawPosition().height);
		return elementHeight + "px" === exports.lineHeight(element);
	};

	exports.lineHeight = function lineHeight(element) {
		return element.getRawStyle("line-height");
	};

	exports.dropShadow = function dropShadow(element) {
		var shadow = element.getRawStyle("box-shadow");

		// When there is no drop shadow, most browsers say 'none', but IE 9 gives a color and nothing else.
		// We handle that case here.
		if (shadow === "white") return "none";
		if (shadow.match(/^#[0-9a-f]{6}$/)) return "none";      // look for '#' followed by six hex digits

		// The standard value seems to be "rgb(r, g, b) Wpx Xpx Ypx Zpx",
		// but IE 9 gives us "Wpx Xpx Ypx Zpx #rrggbb". We need to normalize it.
		// BTW, we don't support multiple shadows yet
		var groups = shadow.match(/^([^#]+) (#......)/);   // get everything before the '#' and the r, g, b
		if (groups === null) return shadow;   // There was no '#', so we assume we're not on IE 9 and everything's fine

		return normalizeColorString(groups[2]) + " " + groups[1];
	};

	exports.textIsUnderlined = function textIsUnderlined(element) {
		var style = element.getRawStyle("text-decoration");
		return style.indexOf("none") !== 0;
	};

	exports.textIsUppercase = function textIsUppercase(element) {
		return element.getRawStyle("text-transform") === "uppercase";
	};

	exports.opacity = function opacity(element) {
		return element.getRawStyle("opacity");
	};

	exports.assertHoverStyle = function assertHoverStyle(button, expectedColor, description) {
		applyClass(button, "_hover_", function() {
			assert.equal(exports.backgroundColor(button), expectedColor, description + " hover state background color");
		});
	};

	exports.assertActivateDepresses = function assertActivateDepresses(button, expectedDescriptor, description) {
		applyClass(button, "_active_", function() {
			button.assert({
				top: expectedDescriptor
			}, description);
			assert.equal(exports.dropShadow(button), "none", description);
		});
	};

	function applyClass(element, className, fn) {
		var domElement = element.toDomElement();
		var oldClassName = domElement.className;
		try {
			domElement.className += " " + className;
			forceReflow(domElement);

			fn();
		}
		finally {
			domElement.className = oldClassName;
			forceReflow(domElement);
		}
	}

	function forceReflow(domElement) {
		var makeLintHappy = domElement.offsetHeight;
	}

	function getCompoundStyle(element, subStyle1, subStyle2, subStyle3, subStyle4) {
		// We can't look at compound properties directly because they return "" on Firefox and IE 9
		var one = element.getRawStyle(subStyle1);
		var two = element.getRawStyle(subStyle2);
		var three = element.getRawStyle(subStyle3);
		var four = element.getRawStyle(subStyle4);

		var result;
		if (one === two && one === three && one === four) {
			result = one;
		}
		else {
			result = one + " " + two + " " + four + " " + three;
		}
		return result;
	}






	// Based on MDN code at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
	function trim(str) {
		var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
		return str.replace(rtrim, '');
	}

	function normalizeColorString(color) {
		if (color === "white") return "rgb(255, 255, 255)";
		if (color === "transparent") return "rgba(0, 0, 0, 0)";

		var colorGroups = color.match(/^#(..)(..)(..)/);    // look for presence of #rrggbb string
		if (colorGroups === null) return color;   // if doesn't match, assume we have rgb() string

		var r = parseInt(colorGroups[1], 16);
		var g = parseInt(colorGroups[2], 16);
		var b = parseInt(colorGroups[3], 16);
		return "rgb(" + r + ", " + g + ", " + b + ")";
	}

}());