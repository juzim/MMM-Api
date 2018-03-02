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

		this.expressApp.get("/api/:modulename", (req, res) => {
			res.send({'success': 'true', 'actions': this.moduleData[req.params.modulename]});
		});

		this.expressApp.post("/api/notify/:action", (req, res) => {
			var query = url.parse(req.url, true).query
			this.sendSocketNotification(req.params.action.toUpperCase(), query);
			res.send({'success': 'true'});
		});

		this.expressApp.post("/api/:modulename/:action", (req, res) => {
			var moduleName = self.formatName(req.params.modulename)
			if (this.moduleData[moduleName] == undefined) {
				res.status(404).send({'success': "false", "error": "Module not found"})
				return
			}

			var actionName =req.params.action.toUpperCase();
			if (this.moduleData[moduleName].indexOf(actionName) < 0) {
				res.status(404).send({'success': "false", "error": "Action not found"})
				return
			}


			var query = url.parse(req.url, true).query
			this.sendSocketNotification(actionName, query);
			res.send({'success': 'true'});
		});
	},


	getDefaultModules: function() {
		var self = this;

		var files = fs.readdirSync(path.resolve(__dirname + "/../default"))

		for (index in files) {
			var file = files[index];
			var installedModules = []
			for (var i = 0; i < files.length; i++) {
				var module = files[i];

				if (
					module !== "node_modules"
					&& module !== "README.md"
					&& module !== "defaultmodules.js")
				{
					installedModules.push(module);

				}
			}

			for (index in installedModules) {
				var moduleName = installedModules[index]
				var file = fs.readFileSync(
					path.resolve(__dirname + "/../default/" + moduleName + '/' + moduleName + '.js'),
					'utf8')

					var moduleActions = self.getActions(file)

					if (moduleActions.length > 0) {
						self.moduleData[moduleName] = moduleActions
					}
			}
		}
	},

	getActions: (content) => {
		var self = this;

			//var re = /case '([A-Z_]+)'/g;
			var re = /notification \=\=\=? "([A-Z_]+)"|case '([A-Z_]+)'/g;
			var m;
			var availabeActions = [];
			do {
					m = re.exec(content);
					if (m && m[1] != 'DOM_OBJECTS_CREATED') {
							availabeActions.push(m[1]);
					}
			} while (m);

			return availabeActions;
	},

	getCustomModules: function() {
				var self = this;

				var files = fs.readdirSync(path.resolve(__dirname + "/.."))

				for (index in files) {
					var file = files[index];
					var installedModules = []
					for (var i = 0; i < files.length; i++) {
						var module = files[i];

						if (
							files[i] !== "node_modules"
							&& files[i] !== "default"
							&& files[i] !== "README.md"
						) {
							installedModules.push(module);

						}
					}

					for (index in installedModules) {
						var moduleName = installedModules[index]
						var file = fs.readFileSync(
							path.resolve(__dirname + "/../" + moduleName + '/' + moduleName + '.js'),
							'utf8')

							var moduleActions = self.getActions(file)

							if (moduleActions.length > 0) {
								self.moduleData[moduleName] = moduleActions
							}
					}
				}
			},

			formatName: function(string) {
				var parts = string.split('-');

				if (parts.length == 1) {
					return string
				}

				if (parts[0].toLowerCase() == 'mmm') {
					parts[0] = parts[0].toUpperCase();
				}

				var result = [];

				for (var i = 0; i < parts.length; i++) {
					result.push(parts[i].charAt(0).toUpperCase() + parts[i].substr(1))
				}

				return result.join('-');
			},
});
