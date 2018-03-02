/* global Module, Log, MM, config */

/* Magic Mirror
 * Module: Api
 *
 * By Julian Zimmermann
 * MIT Licensed.
 */

Module.register("MMM-Api", {

	requiresVersion: "2.1.0",

	// Default module config.
	defaults: {
		// no config options at the moment
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);
	},

	notificationReceived: function(notification, payload, sender) {
		if (notification === "DOM_OBJECTS_CREATED") {
			this.sendSocketNotification("INITALIZE");
		}
	},

	socketNotificationReceived: function(notification, payload, sender) {
		this.sendNotification(notification, payload);
	},

});
