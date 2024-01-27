/* Shelly 2 PM. A room with multiple toggle switches and 2 lights.
  When flipping the switch multiple times, you can cycle through all 4 possible light combinations.
  After longer switch inactivity (>15 sec), lights will be turned off on the next toggle.
  Config: Both inputs as toggle switch. Detached.
*/
debug = true;

// mode change time window
timerExpired = true;
function timerCode() {
  timerExpired = true;
  if (debug) print("-> Timer expired. Next press will be OFF command.");
};

// track state of outputs
switch0status = false;
switch1status = false;
Shelly.addStatusHandler(function(e) {
  if (e.component === "switch:0") {
    if (e.delta.output === true) {
      if (debug) print("Switch 0 is on, triggered source:", e.delta.source);
      switch0status = true;
    }
    else if (e.delta.output === false) {
      if (debug) print("Switch 0 is off, triggered source:", e.delta.source);
      switch0status = false;
    }
  } // switch 0
  if (e.component === "switch:1") {
    if (e.delta.output === true) {
      if (debug) print("Switch 1 is on, triggered source:", e.delta.source);
      switch1status = true;
    }
    else if (e.delta.output === false) {
      if (debug) print("Switch 1 is off, triggered source:", e.delta.source);
      switch1status = false;
    }
  } // switch 1
});

// set output switches
function output (cmdZero, cmdOne) {
  Shelly.call("Switch.Set", {"id": 1, "on": cmdOne});
  Shelly.call("Switch.Set", {"id": 0, "on": cmdZero});
}

// main
console.log("Starting.");
output (false, false);

Shelly.addEventHandler(function(e) {
  if (debug) print("Event: ",e.component, " / ", e.info.event);
  if ((e.component === "input:0") && (e.info.event === "toggle"))
  {
    if (debug) print("-> Button pressed. Timer expired: ", timerExpired);
    // if button was not pressed for a long time and at least one output is on -> turn off
    if (timerExpired && (switch0status || switch1status)) {
      if (debug) print("-> Turn both OFF.");
      output (false, false);
    } // expired
    else // timer not expired or outputs off
    {
      if (debug) print("-> Mode change.");
      if (!switch0status && !switch1status) {
        if (debug) print("--> sw 1 ON");
        output (false, true);
        }
      if (!switch0status && switch1status) {
        if (debug) print("--> sw 0 ON");
        output (true, false);
        }
      if (switch0status && !switch1status) {
        if (debug) print("--> sw 0+1 ON");
        output (true, true);
        }
      if (switch0status && switch1status) {
        if (debug) print("--> sw 0+1 OFF");
        output (false, false);
        }
      // first press after a long time
      if (timerExpired) Timer.set(/* miliseconds */ 15000, /* repeat? */ false, /* callback */ timerCode);      
      timerExpired = false;
    } // not expired - mode change
  }
});
