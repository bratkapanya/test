// Copyright (c) 2012-2016 Titanium I.T. LLC. All rights reserved. See LICENSE.txt for details.
/*global Raphael, mocha, Touch */

(function() {
	"use strict";

	var client = require("./client.js");
	var browser = require("./browser.js");
	var HtmlElement = require("./html_element.js");
	var HtmlCoordinate = require("./html_coordinate.js");
	var assert = require("../../shared/_assert.js");
	var failFast = require("../../shared/fail_fast.js");
	var ServerPointerEvent = require("../../shared/server_pointer_event.js");

	mocha.setup({ignoreLeaks: true});

	describe("UI: Drawing area", function() {

		var padding;
		var drawingArea;
		var clearButton;
		var documentBody;
		var windowElement;
		var svgCanvas;
		var connectionFake;

		var POINTER_DIV_CLASS = "pointerClass";

		beforeEach(function() {
			documentBody = new HtmlElement(document.body);
			windowElement = new HtmlElement(window);

			padding = HtmlElement.fromHtml("<p>prevent drawing area and document body from having same origin</p>");
			padding.appendSelfToBody();

			drawingArea = HtmlElement.fromHtml("<div style='height: 300px; width: 600px'>hi</div>");
			drawingArea.appendSelfToBody();

			clearButton = HtmlElement.fromHtml("<input type='button'>");
			connectionFake = new RealTimeConnectionFake();

			svgCanvas = client.initializeDrawingArea({
				drawingAreaDiv: drawingArea,
				clearScreenButton: clearButton,
				pointerHtml: "<div class='" + POINTER_DIV_CLASS + "'></div>"
			}, connectionFake);
		});

		afterEach(function() {
			padding.remove();
			drawingArea.remove();
			documentBody.removeAllEventHandlers();
			windowElement.removeAllEventHandlers();
			client.drawingAreaHasBeenRemovedFromDom();
			removePointerDivs();
		});

		function removePointerDivs() {
			var pointerDivs = HtmlElement.fromSelector("." + POINTER_DIV_CLASS);
			pointerDivs.forEach(function(div) {
				div.remove();
			});
		}

		it("does not allow text to be selected or page to scroll when drag starts within drawing area", function() {
			assert.equal(drawingArea.isBrowserDragDefaultsPrevented(), true);
		});

		it("clears drawing area when 'clear screen' button is clicked", function() {
			dragMouse(10, 20, 40, 90);
			clearButton.triggerMouseClick();
			assert.deepEqual(lines(), []);
		});

		describe("mouse drag events", function() {
			it("draws a dot in response to mouse click", function() {
				drawingArea.triggerMouseDown(50, 60);
				drawingArea.triggerMouseUp(50, 60);
				drawingArea.triggerMouseClick(50, 60);

				assert.deepEqual(lines(), [
					[50, 60]
				]);
			});

			it("draws a line in response to mouse drag", function() {
				drawingArea.triggerMouseDown(20, 30);
				drawingArea.triggerMouseMove(50, 60);
				drawingArea.triggerMouseUp(50, 60);

				assert.deepEqual(lines(), [
					[20, 30, 50, 60]
				]);
			});

			it("draws a line if event is triggered on document, not drawing area", function() {
				drawingArea.triggerMouseDown(25, 35);
				documentBody.triggerMouseMove(HtmlCoordinate.fromRelativeOffset(drawingArea, 70, 90));
				drawingArea.triggerMouseUp(70, 90);

				assert.deepEqual(lines(), [
					[25, 35, 70, 90]
				]);
			});

			it("does not draw a dot at the end of a drag", function() {
				drawingArea.triggerMouseDown(20, 30);
				drawingArea.triggerMouseMove(50, 60);
				drawingArea.triggerMouseUp(50, 60);
				drawingArea.triggerMouseClick(50, 60);

				assert.deepEqual(lines(), [
					[20, 30, 50, 60]
				]);
			});

			it("does not draw a dot if drag not started in drawing area", function() {
				drawingArea.triggerMouseUp(20, 40);

				assert.deepEqual(lines(), []);
			});

			it("draws multiple line segments when mouse is dragged multiple places", function() {
				drawingArea.triggerMouseDown(20, 30);
				drawingArea.triggerMouseMove(50, 60);
				drawingArea.triggerMouseMove(40, 20);
				drawingArea.triggerMouseMove(10, 15);
				drawingArea.triggerMouseUp(10, 15);

				assert.deepEqual(lines(), [
					[20, 30, 50, 60],
					[50, 60, 40, 20],
					[40, 20, 10, 15]
				]);
			});

			it("does not draw a dot when mouse is dragged slowly in the middle of a line", function() {
				drawingArea.triggerMouseDown(20, 30);
				drawingArea.triggerMouseMove(50, 60);

				drawingArea.triggerMouseMove(40, 20);
				drawingArea.triggerMouseMove(40, 20);
				drawingArea.triggerMouseMove(40, 20);

				drawingArea.triggerMouseMove(10, 15);
				drawingArea.triggerMouseUp(10, 15);

				assert.deepEqual(lines(), [
					[20, 30, 50, 60],
					[50, 60, 40, 20],
					[40, 20, 10, 15]
				]);

			});

			it("draws multiple line segments when there are multiple drags", function() {
				drawingArea.triggerMouseDown(20, 30);
				drawingArea.triggerMouseMove(50, 60);
				drawingArea.triggerMouseUp(50, 60);

				drawingArea.triggerMouseMove(40, 20);

				drawingArea.triggerMouseDown(30, 25);
				drawingArea.triggerMouseMove(10, 15);
				drawingArea.triggerMouseUp(10, 15);

				assert.deepEqual(lines(), [
					[20, 30, 50, 60],
					[30, 25, 10, 15]
				]);
			});

			it("stops drawing line segments after mouse button is released", function() {
				drawingArea.triggerMouseDown(20, 30);
				drawingArea.triggerMouseMove(50, 60);
				drawingArea.triggerMouseUp(50, 60);

				drawingArea.triggerMouseMove(10, 15);

				assert.deepEqual(lines(), [
					[20, 30, 50, 60]
				]);
			});

			it("does not draw line segments when mouse button has never been pushed", function() {
				drawingArea.triggerMouseMove(20, 30);
				drawingArea.triggerMouseMove(50, 60);

				assert.deepEqual(lines(), []);
			});

			it("continues drawing if mouse leaves drawing area and comes back in", function() {
				drawingArea.triggerMouseDown(20, 30);
				drawingArea.triggerMouseMove(50, 60);
				drawingArea.triggerMouseLeave(700, 70);

				documentBody.triggerMouseMove(HtmlCoordinate.fromRelativeOffset(drawingArea, 700, 70));

				drawingArea.triggerMouseMove(90, 40);
				drawingArea.triggerMouseUp(90, 40);

				assert.deepEqual(lines(), [
					[20, 30, 50, 60],
					[50, 60, 700, 70],
					[700, 70, 90, 40]
				]);
			});

			it("stops drawing if mouse leaves drawing area and mouse button is released", function() {
				drawingArea.triggerMouseDown(20, 30);
				drawingArea.triggerMouseMove(50, 60);
				drawingArea.triggerMouseLeave(700, 70);

				documentBody.triggerMouseMove(HtmlCoordinate.fromRelativeOffset(drawingArea, 700, 70));
				documentBody.triggerMouseUp(HtmlCoordinate.fromRelativeOffset(drawingArea, 700, 70));

				drawingArea.triggerMouseMove(90, 40);

				assert.deepEqual(lines(), [
					[20, 30, 50, 60],
					[50, 60, 700, 70]
				]);
			});

			it("stops drawing if mouse leaves window and mouse button is released", function() {
				drawingArea.triggerMouseDown(20, 30);
				drawingArea.triggerMouseMove(50, 60);
				drawingArea.triggerMouseLeave(700, 70);

				documentBody.triggerMouseMove(HtmlCoordinate.fromRelativeOffset(drawingArea, 700, 70));

				windowElement.triggerMouseLeave();
				windowElement.triggerMouseUp();

				drawingArea.triggerMouseMove(90, 40);

				assert.deepEqual(lines(), [
					[20, 30, 50, 60],
					[50, 60, 700, 70]
				]);
			});

			it("does not start drawing if drag is started outside drawing area", function() {
				documentBody.triggerMouseDown(700, 70);
				drawingArea.triggerMouseMove(50, 60);
				drawingArea.triggerMouseUp(50, 60);

				assert.deepEqual(lines(), []);
			});

		});

		if (browser.supportsTouchEvents()) {
			describe("touch drag events", function() {

				it("draw a dot when screen is tapped", function() {
					drawingArea.triggerSingleTouchStart(3, 42);
					drawingArea.triggerTouchEnd();

					assert.deepEqual(lines(), [
						[3, 42]
					]);
				});

				it("draw lines in response to touch events", function() {
					drawingArea.triggerSingleTouchStart(10, 40);
					drawingArea.triggerSingleTouchMove(5, 20);
					drawingArea.triggerTouchEnd(5, 20);

					assert.deepEqual(lines(), [
						[10, 40, 5, 20]
					]);
				});

				it("draws multiple lines in response to multiple touch drags", function() {
					drawingArea.triggerSingleTouchStart(10, 40);
					drawingArea.triggerSingleTouchMove(5, 20);
					drawingArea.triggerTouchEnd(5, 20);

					drawingArea.triggerSingleTouchStart(30, 40);
					drawingArea.triggerSingleTouchMove(50, 60);
					drawingArea.triggerTouchEnd(50, 60);

					assert.deepEqual(lines(), [
						[10, 40, 5, 20],
						[30, 40, 50, 60]
					]);
				});

				it("stop drawing lines when touch is cancelled", function() {
					drawingArea.triggerSingleTouchStart(10, 40);
					drawingArea.triggerSingleTouchMove(5, 20);
					drawingArea.triggerTouchCancel(5, 20);

					assert.deepEqual(lines(), [
						[10, 40, 5, 20]
					]);
				});

				it("stops drawing when multiple touches occur", function() {
					drawingArea.triggerSingleTouchStart(10, 40);
					drawingArea.triggerSingleTouchMove(5, 20);

					drawingArea.triggerMultiTouchStart(5, 20, 6, 60);
					drawingArea.triggerSingleTouchMove(1, 10, 7, 70);
					drawingArea.triggerTouchEnd(1, 10, 7, 70);

					assert.deepEqual(lines(), [
						[10, 40, 5, 20]
					]);
				});
			});
		}


		describe("networking", function() {

			it("connects to server upon initialization", function() {
				assert.deepEqual(connectionFake.connectArgs, [ window.location.port ]);
			});

			it("sends pointer location whenever mouse moves", function() {
				drawingArea.triggerMouseMove(50, 60);
				assert.deepEqual(connectionFake.sendPointerLocationArgs, [ 50, 60 ]);
			});

			it("sends pointer location even when mouse moves outside drawing area", function() {
				documentBody.triggerMouseMove(HtmlCoordinate.fromRelativeOffset(drawingArea, 20, 40));
				assert.deepEqual(connectionFake.sendPointerLocationArgs, [ 20, 40 ]);
			});

			it("doesn't send pointer location when touch changes", function() {
				if (!browser.supportsTouchEvents()) return;

				drawingArea.triggerSingleTouchMove(30, 40);
				assert.deepEqual(connectionFake.sendPointerLocationArgs, undefined);
			});

			it("doesn't create pointer HTML on startup", function() {
				assert.equal(getPointerDivs().length, 0);
			});

			it("creates a pointer HTML when a pointer event is received", function() {
				connectionFake.triggerOnPointerLocationEvent(createEvent());
				assert.equal(getPointerDivs().length, 1);
			});

			it("doesn't create a pointer HTML when a pointer event containing a previous client ID is received", function () {
				connectionFake.triggerOnPointerLocationEvent(createEvent({ id: "1" }));
				connectionFake.triggerOnPointerLocationEvent(createEvent({ id: "1" }));
				assert.equal(getPointerDivs().length, 1);
			});

			it("creates a pointer HTML for each unique client ID", function() {
				connectionFake.triggerOnPointerLocationEvent(createEvent({ id: "1" }));
				connectionFake.triggerOnPointerLocationEvent(createEvent({ id: "2" }));
				assert.equal(getPointerDivs().length, 2);
			});

			it("positions new pointer HTML according to event's position", function() {
				connectionFake.triggerOnPointerLocationEvent(createEvent({ x: 10, y: 20 }));
				var pointerElement = getPointerDivs()[0];
				assert.objEqual(pointerElement.getPosition(), HtmlCoordinate.fromRelativeOffset(drawingArea, 10, 20));
			});

			it("moves existing pointer HTML when new pointer event is received", function() {
				connectionFake.triggerOnPointerLocationEvent(createEvent({ x: 10, y: 20 }));
				connectionFake.triggerOnPointerLocationEvent(createEvent({ x: 30, y: 40 }));

				var pointerElement = getPointerDivs()[0];
				assert.objEqual(pointerElement.getPosition(), HtmlCoordinate.fromRelativeOffset(drawingArea, 30, 40));
			});

			function getPointerDivs() {
				return HtmlElement.fromSelector("." + POINTER_DIV_CLASS);
			}

			function createEvent(event) {
				// Object.assign would be preferable here, but it's not supported on IE 11 or Chrome Mobile 44
				// Feel free to rewrite this to use Object.assign when those browsers are no longer supported
				if (event === undefined) event = {};
				return new ServerPointerEvent(
					event.id || "irrelevant_id",
					event.x || 0,
					event.y || 0
				);
			}

		});

		function dragMouse(startX, startY, endX, endY) {
			drawingArea.triggerMouseDown(startX, startY);
			drawingArea.triggerMouseMove(endX, endY);
			drawingArea.triggerMouseUp(endX, endY);
		}

		function lines() {
			return svgCanvas.lineSegments();
		}

	});

	function RealTimeConnectionFake() {}

	RealTimeConnectionFake.prototype.connect = function() {
		this.connectArgs = Array.prototype.slice.call(arguments);
	};

	RealTimeConnectionFake.prototype.sendPointerLocation = function() {
		this.sendPointerLocationArgs = Array.prototype.slice.call(arguments);
	};

	RealTimeConnectionFake.prototype.onPointerLocation = function(handler) {
		failFast.unlessTrue(this._handler === undefined, "RealTimeConnectionFake.onPointerLocation called twice");
		this._handler = handler;
	};

	RealTimeConnectionFake.prototype.triggerOnPointerLocationEvent = function(event) {
		failFast.unlessTrue(this._handler !== undefined, "onPointerLocation() not called before triggerOnPointerLocationEvent()");
		this._handler(event);
	};

}());
