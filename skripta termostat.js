debug = true;
verboseDebug = false;
tempSetPoint = 23;
tempHysteresis = 0.1; // +/- (both ways)
thermostatEnabled = true;

// track state of the output
switchStatus = false;
Shelly.addStatusHandler(function(e) {
  if (verboseDebug) print("Event: ", e);
  if (e.component === "switch:0") {
    if (e.delta.output === true) {
      if (debug) print("Switch 0 is on, triggered source:", e.delta.source);
      switchStatus = true;
      if (e.delta.source === "SHC") {thermostatEnabled = true;} // command from the cloud means global on/off
    }
    else if (e.delta.output === false) {
      if (debug) print("Switch 0 is off, triggered source:", e.delta.source);
      switchStatus = false;
      if (e.delta.source === "SHC") {thermostatEnabled = false;} // command from the cloud means global on/off
    }
    if (e.delta.output != null)  // switch was toggled
      if (debug) print("Main Thermostat Enable:", thermostatEnabled);
  } // switch 0
});

function processTemperatures(data) {
  if (verboseDebug) print("-> Temperature call finished: ", data);
  // { "id": 100, "tC": 0, "tF": 32 }
  // { "id": 100, "tC": null, "tF": null, "errors": ["read"] }
  if (data.tC == "null") { // error handling
    thermostatEnabled = false;
    Shelly.call("Switch.Set", {"id": 0, "on": false});
    if (debug) print ("ERROR reading temperature!");
  }
  else { // no error
    let currentTemp = data.tC;
    if (debug) print ("T = ", currentTemp );
    if ((currentTemp <= (tempSetPoint - tempHysteresis)) && (!switchStatus)) {
      if (debug) print ("Output set ON");
      Shelly.call("Switch.Set", {"id": 0, "on": true});
    }
    if ((currentTemp >= (tempSetPoint + tempHysteresis)) && (switchStatus)) {
      if (debug) print ("Output set OFF");
      Shelly.call("Switch.Set", {"id": 0, "on": false});
    }
  }
}

function timerCode() {
  if (verboseDebug) print("-> Timer executed.");
  if (thermostatEnabled) {
    // https://www.shelly-support.eu/forum/thread/19706-reading-input-and-temperature-in-a-script/
    Shelly.call(
      "temperature.getStatus",
      { id: 100 },
      processTemperatures,
      null);
  }
}

if (debug) print("Start.");
Timer.set(/* miliseconds */ 30000, /* repeat? */ true, /* callback */ timerCode);