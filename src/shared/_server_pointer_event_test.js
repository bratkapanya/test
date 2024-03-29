// Copyright (c) 2016 Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
(function() {
	"use strict";

	var assert = require("./_assert.js");
	var ServerPointerEvent = require("./server_pointer_event.js");

	describe("SHARED: ServerPointerEvent", function() {

		it("converts bare objects to ServerPointerEvents and back", function() {
			var bareObject = { id: "a", x: 1, y: 2 };
			var eventObject = new ServerPointerEvent("a", 1, 2);

			assert.deepEqual(ServerPointerEvent.fromSerializableObject(bareObject), eventObject, "fromSerializableObject()");
			assert.deepEqual(eventObject.toSerializableObject(), bareObject, "toSerializableObject()");
		});

	});

}());