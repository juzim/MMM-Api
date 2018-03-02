/* Magic Mirror
 * Module: Api
 *
 * By Julian Zimmermann
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

		self.loadModules(
			path.resolve(__dirname + "/../default"),
			function(f) {
				return f !== "node_modules"
					&& f !== "README.md"
					&& f !== "defaultmodules.js"
			}
		);

		self.loadModules(
			path.resolve(__dirname + "/.."),
			function(f) {
				return f !== "node_modules"
					&& f !== "default"
					&& f !== "README.md"
			}
		);

		console.log("Starting node helper for: " + self.name);

		this.expressApp.get("/api", (req, res) => {
			res.send({'success': 'true', 'modules': this.moduleData});
		});

		this.expressApp.get("/api/:modulename", (req, res) => {
			var moduleName = self.formatName(req.params.modulename)
			console.log(moduleName)
			if (this.moduleData[moduleName] == undefined) {
				res.status(404).send({'success': "false", "error": "Module not found"})
				return
			}

			res.send({'success': 'true', 'actions': this.moduleData[moduleName]});
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

	loadModules: function(modulePath, filter) {
		var self = this;

		var files = fs.readdirSync(modulePath).filter(
			filter
		)

		for (index in files) {
			var file = files[index];
			var installedModules = []
			for (var i = 0; i < files.length; i++) {
				var module = files[i];
				installedModules.push(module);
			}

			for (index in installedModules) {
				var moduleName = installedModules[index]
				var file = fs.readFileSync(
					path.resolve(modulePath + '/' + moduleName + '/' + moduleName + '.js'),
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
			var re = /notification \=\=\=? "([A-Z_]+)"|case '([A-Z_]+)'/g;
			var m;
			var availabeActions = [];
			do {
					if (m = re.exec(content)) {
						m = m.filter(function(rm) {
							return rm != undefined
						})

						if (m.indexOf('DOM_OBJECTS_CREATED') >= 0) {
							continue;
						}

						availabeActions.push(m[1]);
					}
			} while (m);

			return availabeActions;
		},
		formatName: function(string) {
			var parts = string.split('-');

			if (parts.length == 1) {
				return string
			}

			if (parts[0].toLowerCase() == 'mmm') {
				parts[0] = parts[0].toUpperCase();
			}

			return parts.map(function(p) {
				return p.charAt(0).toUpperCase() + p.substr(1);
			}).join('-')
		},
});
