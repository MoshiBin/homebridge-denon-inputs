var Service, Characteristic;
var Telnet = require("telnet-client");


module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-denon-inputs", "Denon", DenonAccessory);
}


class DenonAccessory {
    constructor(log, config, api) {
        this.log = log;
        this.enabledServices = [];
        this.inputAppIds = new Array();
        this.name = config["name"];
        this.tvVolume = 0;
        this.inputs = config["inputs"];
        this.address = config["address"];
        this.inputObjects = {};
        this.connection = new Telnet();

        // Prepare TV Service
        this.tvService = new Service.Television(this.name, "tvService");
        this.tvService.setCharacteristic(Characteristic.ConfiguredName, this.name);
        this.tvService.setCharacteristic(Characteristic.SleepDiscoveryMode, Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.tvService.getCharacteristic(Characteristic.Active)
            .on("get", this.getPowerState.bind(this))
            .on("set", this.setPowerState.bind(this));
        this.tvService.getCharacteristic(Characteristic.ActiveIdentifier)
            .on("set", (inputIdentifier, callback) => {
                var inputId = this.inputObjects[inputIdentifier]["baseName"];
                this.log.error("Input source changed to %s", inputId);
                callback();
            });

        this.enabledServices.push(this.tvService);


        // Add inputs
        this.inputs.forEach((value, i) => {
            var inputName = value["name"];
            this.inputObjects[i] = value;
            this.log("Adding input %s", inputName);
            var tmpInput = new Service.InputSource(inputName, "inputSource" + i);
            tmpInput
                .setCharacteristic(Characteristic.Identifier, i)
                .setCharacteristic(Characteristic.ConfiguredName, inputName)
                .setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(Characteristic.InputSourceType, Characteristic.InputSourceType.HDMI)
                .setCharacteristic(Characteristic.CurrentVisibilityState, Characteristic.CurrentVisibilityState.SHOWN);
            tmpInput
                .getCharacteristic(Characteristic.ConfiguredName)
                .on("set", (name, callback) => {
                    this.log.error("Setting %s", name);
                    callback();
                });
            this.tvService.addLinkedService(tmpInput);
            this.enabledServices.push(tmpInput);
        });

    }

    getPowerState(callback) {
        this.log.debug("Getting state");
        var connection = new Telnet();
        var plugin = this;
        connection.connect({
            host: this.address,
            irs: "\r",
            debug: true,
            negotiationMandatory: false
        }).then(function(shell) {
            connection.send("PW?").then(function(res) {
                res = res.trim();
                if (res == "PWSTANDBY") {
                    return false;
                } else if (res == "PWON") {
                    return true;
                } else {
                    plugin.log.error("Unknown power state: %s", res);
                    return false;
                }
            }).then(function(s) {
                connection.end();
            });
        });
        callback(null, true);

    }

    setPowerState(state, callback) {
        this.log.error("Setting state: %s", state);
        callback();
    }

    getServices() {
        return this.enabledServices;
    }
}
