// Copyright (c) 2012 Titanium I.T. LLC. All rights reserved. See LICENSE.txt for details.
/*global Raphael, $ */

(function() {
	"use strict";

	var SvgCanvas = require("./svg_canvas.js");
	var HtmlElement = require("./html_element.js");
	var HtmlCoordinate = require("./html_coordinate.js");
	var browser = require("./browser.js");
	var failFast = require("../../shared/fail_fast.js");

	var svgCanvas = null;
	var start = null;
	var lineDrawn = false;
	var drawingArea;
	var clearScreenButton;
	var pointerHtml;
	var documentBody;
	var windowElement;
	var network;
	var eventIds;

	exports.initializeDrawingArea = function(elements, realTimeConnection) {
		if (svgCanvas !== null) throw new Error("Client.js is not re-entrant");

		drawingArea = elements.drawingAreaDiv;
		clearScreenButton = elements.clearScreenButton;
		pointerHtml = elements.pointerHtml;

		failFast.unlessDefined(drawingArea, "elements.drawingArea");
		failFast.unlessDefined(clearScreenButton, "elements.clearScreenButton");
		failFast.unlessDefined(pointerHtml, "elements.pointerHtml");

		documentBody = new HtmlElement(document.body);
		windowElement = new HtmlElement(window);
		svgCanvas = new SvgCanvas(drawingArea);
		network = realTimeConnection;
		eventIds = {};

		drawingArea.preventBrowserDragDefaults();
		handleRealTimeNetworking();
		handleClearScreenClick();
		handleMouseDragEvents();
		handleTouchDragEvents();

		return svgCanvas;
	};

	exports.drawingAreaHasBeenRemovedFromDom = function() {
		svgCanvas = null;
	};

	function handleRealTimeNetworking() {
		network.connect(window.location.port);
		documentBody.onMouseMove(sendPointerEvent);
		network.onPointerLocation(displayNetworkPointer);
	}

	function handleClearScreenClick() {
		clearScreenButton.onMouseClick(clearDrawingArea);
	}

	function handleMouseDragEvents() {
		drawingArea.onMouseDown(startDrag);
		documentBody.onMouseMove(continueDrag);
		windowElement.onMouseUp(endDrag);
	}

	function handleTouchDragEvents() {
		drawingArea.onSingleTouchStart(startDrag);
		drawingArea.onSingleTouchMove(continueDrag);
		drawingArea.onTouchEnd(endDrag);
		drawingArea.onTouchCancel(endDrag);

		drawingArea.onMultiTouchStart(endDrag);
	}

	function sendPointerEvent(coordinate) {
		var relativeOffset = coordinate.toRelativeOffset(drawingArea);
		network.sendPointerLocation(relativeOffset.x, relativeOffset.y);
	}

	function displayNetworkPointer(serverEvent) {
		var pointerElement = eventIds[serverEvent.id];
		if (pointerElement === undefined) {
			pointerElement = HtmlElement.appendHtmlToBody(pointerHtml);
			eventIds[serverEvent.id] = pointerElement;
		}
		pointerElement.setAbsolutePosition(HtmlCoordinate.fromRelativeOffset(drawingArea, serverEvent.x, serverEvent.y));
	}

	function clearDrawingArea() {
		svgCanvas.clear();
	}

	function startDrag(coordinate) {
		start = coordinate;
	}

	function continueDrag(coordinate) {
		if (!isCurrentlyDrawing()) return;

		var end = coordinate;
		if (!start.equals(end)) {
			svgCanvas.drawLine(start, end);
			start = end;
			lineDrawn = true;
		}
	}

	function endDrag() {
		if (!isCurrentlyDrawing()) return;

		if (!lineDrawn) svgCanvas.drawDot(start);

		start = null;
		lineDrawn = false;
	}

	function isCurrentlyDrawing() {
		return start !== null;
	}

}());