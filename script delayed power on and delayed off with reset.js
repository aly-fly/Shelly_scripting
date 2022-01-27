// Useful for controlling fan in the bathroom. 
// Startup is delayed (2 sec), so you can cancel it if was activated accidentally.
// When turned off, it will continue running (for 5 minutes, adjust as needed).
// If input is active for less than 2 seconds, output is turned off.

// go to Shelly's IP address with web browser
// Select Channel settings -> IO settings -> DETACH mode (input and output are independent)
// Select Scripts -> Add script -> write name -> paste this code -> Save and Run
// go back to script list -> Enable this script (starts on Shelly startup)

let userdata = null;
let timer_handle = null;
let input_state = 0;
let short_timer_active = false;

function TimerCallback(userdata) {
  print("timer activated");
  if (short_timer_active) {
    print("checking input...");
    if (input_state === 0) { // switch was turned off under 2 seconds
      // turn off output
      print("... off -> turn off");
      Shelly.call("Switch.Set","{ id:0, on:false }",null,null);
    } else { // switch is still on
      // turn on output
      print("... on -> turn on");
      Shelly.call("Switch.Set","{ id:0, on:true }",null,null);
    }
  } else {  // long timer
    print("load active -> turn off");
    Shelly.call("Switch.Set","{ id:0, on:false }",null,null);
  }
  short_timer_active = false;
}

function eventcallback(userdata) {
  // print("Event called: ", JSON.stringify(userdata));
  // Event called: {"info":{"state":true,"id":0},"now":1643272255.228291,"id":0,"name":"input","component":"input:0"}
  // Event called: {"info":{"state":false,"id":0},"now":1643272257.047522,"id":0,"name":"input","component":"input:0"}
  // check if this a button press event
  if (userdata.component==="input:0") {
    if (userdata.info.state===true) {
      print("button active event");
      input_state = 1;
      // reset timer, if running
      Timer.clear(timer_handle);
      // re-check button status after 2 seconds
      timer_handle = Timer.set(2000,false,TimerCallback,null); 
      short_timer_active = true;
      print("timer set for 2 sec");
    }
    else {
      print("button off event");
      input_state = 0;
      if (short_timer_active === false) {
        // reset timer, if running
        Timer.clear(timer_handle);
        // activate timer to turn off output after 5 minutes
        timer_handle = Timer.set(5*60000,false,timerOFFcallback,null); 
        print("timer off set for 5 min");
      }
    }
  }
}

Shelly.addEventHandler(eventcallback, userdata);
