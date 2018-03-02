/* Magic Mirror
 * Module: Api
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

				this.sendSocketNotification("foo", {});
				res.send({'success': 'true', 'modules': modules});
		});

		this.expressApp.get("/api/:modulename/:action", (req, res) => {
			var query = url.parse(req.url, true).query
			this.sendSocketNotification(req.params.action.toUpperCase(), query);
			res.send({'success': 'true'});
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
		console.log(222)
	},
});
