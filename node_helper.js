/* Magic Mirror
 * Module: Remote Control
 *
 * By Joseph Bethge
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const path = require("path");
const url = require("url");
const fs = require("fs");
const exec = require("child_process").exec;
const os = require("os");
const bodyParser = require("body-parser");

var defaultModules = require(path.resolve(__dirname + "/../default/defaultmodules.js"));

Module = {
	configDefaults: {},
	register: function (name, moduleDefinition) {
		// console.log("Module config loaded: " + name);
		Module.configDefaults[name] = moduleDefinition.defaults;
	}
};

module.exports = NodeHelper.create({
	// Subclass start method.
	start: function() {
		var self = this;

		console.log("Starting node helper for: " + self.name);

		this.expressApp.get("/api", (req, res) => {
				var modules = self.readModuleData();
				console.log(modules);

				res.send({'modules': modules});

		});

		this.expressApp.get("/api/notifytt", (req, res) => {
				res.send(200);

		});
	},


	readModuleData: function() {
		var self = this;

		var installedModules = require(path.resolve(__dirname + "/../default/defaultmodules.js"));

		fs.readdirSync(path.resolve(__dirname + "/.."), function(err, files) {
			for (var i = 0; i < files.length; i++) {
				if (files[i] !== "node_modules" && files[i] !== "default"  && files[i] !== "README.md") {
					installedModules.push(files[i]);
				}
			}
		});

		return installedModules;

	},


	loadModuleDefaultConfig: function(module, modulePath) {
		// function copied from MichMich (MIT)
		var filename = path.resolve(modulePath + "/" + module.longname + ".js");
		try {
			fs.accessSync(filename, fs.F_OK);
			var jsfile = require(filename);
			// module.configDefault = Module.configDefaults[module.longname];
		} catch (e) {
			if (e.code == "ENOENT") {
				console.error("ERROR! Could not find main module js file for " + module.longname);
			} else if (e instanceof ReferenceError || e instanceof SyntaxError) {
				console.error("ERROR! Could not validate main module js file.");
				console.error(e);
			} else {
				console.error("ERROR! Could not load main module js file. Error found: " + e);
			}
		}
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;

		if (notification === "CURRENT_STATUS")
		{
			this.configData = payload;
			for (var i = 0; i < this.waiting.length; i++) {
				var waitObject = this.waiting[i];

				waitObject.run();
			}
			this.waiting = [];
		}
		if (notification === "REQUEST_DEFAULT_SETTINGS")
		{
			// module started, answer with current ip addresses
			self.sendSocketNotification("IP_ADDRESSES", self.getIpAddresses());

			// check if we have got saved default settings
			self.loadDefaultSettings();
		}

		if (notification === "REMOTE_ACTION")
		{
			this.executeQuery(payload);
		}

	}
});
