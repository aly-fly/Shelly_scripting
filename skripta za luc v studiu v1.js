/* Shelly 2 PM. A room with 2 doors, 2 push button switches and 2 lights.
  When you pass through the room, lights will turn off on the press of a different button.
  When pressing same button multiple times, you can cycle through all 4 possible light combinations.
  After longer button inactivity (>15 sec), lights will be turned off on the next press.
  Config: Both inputs as push-buttons. Detached.
*/
debug = false;

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

// track state of inputs
currentButton = -1;
lastButton = -1;
Shelly.addEventHandler(function(e) {
  if (debug) print("Event: ",e.component, " / ", e.info.event);
  if (e.info.event === "btn_down")
  {
    if (debug) print("-> Button pressed. Timer expired: ", timerExpired);
    // save which button was last pressed
    lastButton = currentButton;
    if (e.component === "input:0") {currentButton = 0;}
    if (e.component === "input:1") {currentButton = 1;}
    // if button was not pressed for a long time and at least one output is on -> turn off
    if (timerExpired && (switch0status || switch1status)) {
      if (debug) print("-> Turn both OFF.");
      output (false, false);
    } // expired
    else // timer not expired or outputs off
    {
      // passing through the room
      if ((lastButton != currentButton) && (switch0status || switch1status)) {
        if (debug) print("-> Different switch in a short time. Passing through the room. Turning OFF.");
        output (false, false);
      }
      else // lastButton == currentButton) {
      {
        if (debug) print("-> Mode change.");
        if (!switch0status && !switch1status) {
          if (debug) print("--> sw 0 ON");
          output (true, false);
          }
        if (switch0status && !switch1status) {
          if (debug) print("--> sw 1 ON");
          output (false, true);
          }
        if (!switch0status && switch1status) {
          if (debug) print("--> sw 0+1 ON");
          output (true, true);
          }
        if (switch0status && switch1status) {
          if (debug) print("--> sw 0+1 OFF");
          output (false, false);
          }
      }
      // first press after a long time
      if (timerExpired) Timer.set(/* miliseconds */ 15000, /* repeat? */ false, /* callback */ timerCode);      
      timerExpired = false;
    } // not expired - mode change
  }
});
