var Service, Characteristic;


module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-denon-inputs", "Denon", DenonAccessory);
}


class DenonAccessory {
    constructor(log, config, api) {
        this.log = log;

        // Prepare TV Service
        this.tvService = new Service.Television("Denon", "tvService");
        this.tvService.setCharacteristic(Characteristic.ConfiguredName, "Denon");
        this.tvService.setCharacteristic(Characteristic.SleepDiscoveryMode, Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.tvService.getCharacteristic(Characteristic.Active)
            .on("get", this.getPowerState.bind(this))
            .on("set", this.setPowerState.bind(this));
        // Add inputs

    }

    getPowerState(callback) {
        this.log.error("Getting state");
        callback(null, true);

    }

    setPowerState(state, callback) {
        this.log.error("Setting state: %s", state);
        callback();
    }
}
