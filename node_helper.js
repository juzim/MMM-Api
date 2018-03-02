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

		this.moduleData = {}

		self.getDefaultModules();
		self.getCustomModules();

		console.log("Starting node helper for: " + self.name);

		this.expressApp.get("/api", (req, res) => {
					res.send({'success': 'true', 'modules': this.moduleData});
		});

		this.expressApp.post("/api/notify/:action", (req, res) => {
			var query = url.parse(req.url, true).query
			this.sendSocketNotification(req.params.action.toUpperCase(), query);
			res.send({'success': 'true'});
		});

		this.expressApp.post("/api/:modulename/:action", (req, res) => {
			if (this.moduleData[req.params.modulename] == undefined) {
				res.status(404).send({'success': "false", "error": "Module not found"})
				return
			}
			
			var query = url.parse(req.url, true).query
			this.sendSocketNotification(req.params.action.toUpperCase(), query);
			res.send({'success': 'true'});
		});
	},


	getDefaultModules: function() {
		var self = this;

		fs.readdir(path.resolve(__dirname + "/../default"), function(err, files) {
			for (var i = 0; i < files.length; i++) {
				if (
					files[i] !== "node_modules"
					&& files[i] !== "README.md"
					&& files[i] !== "defaultmodules.js")
				{
					self.moduleData[files[i]] = self.getModuleData(path, files[i])
				}
			}
		});
	},

	getCustomModules: function() {
		var self = this;

		fs.readdir(path.resolve(__dirname + "/.."), function(err, files) {
			for (var i = 0; i < files.length; i++) {
				if (
					files[i] !== "node_modules"
					&& files[i] !== "default"
					&& files[i] !== "README.md"
				) {

					self.moduleData[files[i]] = self.getModuleData(path, files[i])
				}
			}
		});
	},

	getModuleData: function(path, module) {
			return {}
	},


	socketNotificationReceived: function(notification, payload) {
	},
});
