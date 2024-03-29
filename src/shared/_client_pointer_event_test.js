// Copyright (c) 2016 Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
(function() {
	"use strict";

	var assert = require("./_assert.js");
	var ClientPointerEvent = require("./client_pointer_event.js");
	var ServerPointerEvent = require("./server_pointer_event.js");

	describe("SHARED: ClientPointerEvent", function() {

		it("converts bare objects to ClientPointerEvents and back", function() {
			var bareObject = { x: 1, y: 2 };
			var eventObject = new ClientPointerEvent(1, 2);

			assert.deepEqual(ClientPointerEvent.fromSerializableObject(bareObject), eventObject, "fromSerializableObject()");
			assert.deepEqual(eventObject.toSerializableObject(), bareObject, "toSerializableObject()");
		});

		it("translates to ServerPointerEvent", function() {
			var expected = new ServerPointerEvent("a", 1, 2);
			var actual = new ClientPointerEvent(1, 2).toServerEvent("a");

			assert.deepEqual(actual, expected);
		});

	});

}());