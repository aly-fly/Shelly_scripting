// Useful for controlling fan in the bathroom. 
// Startup is delayed (2 sec), so you can cancel it if was activated accidentally.
// When turned off, it will continue running (for 5 seconds, adjust as needed).

// go to Shelly's IP address with web browser
// Select Channel settings -> IO settings -> DETACH mode (input and output are independent)
// Select Scripts -> Add script -> write name -> paste this code -> Save and Run
// go back to script list -> Enable this script (starts on Shelly startup)

let userdata = null;
let timer_on_handle = null;
let timer_off_handle = null;

function timerONcallback(userdata) {
  print("timer ON activated");
  // turn on output
  Shelly.call("Switch.Set","{ id:0, on:true }",null,null);
  // deactivate timer
  Timer.clear(timer_on_handle);
  // deactivate off-timer if running
  Timer.clear(timer_off_handle);
}

function timerOFFcallback(userdata) {
  print("timer OFF activated");
  // turn off output
  Shelly.call("Switch.Set","{ id:0, on:false }",null,null);
  // deactivate timer
  Timer.clear(timer_off_handle);
}

function eventcallback(userdata) {
  print("Event called: ", JSON.stringify(userdata));
  // Event called: {"info":{"state":true,"id":0},"now":1643272255.228291,"id":0,"name":"input","component":"input:0"}
  // Event called: {"info":{"state":false,"id":0},"now":1643272257.047522,"id":0,"name":"input","component":"input:0"}
  // check if this a button press event
  if (userdata.component==="input:0") {
    if (userdata.info.state===true) {
      print("button active event");
      // button must be pressed for 2 seconds to activate output
      timer_on_handle = Timer.set(2000,false,timerONcallback,null); 
      // deactivate off-timer if running
      Timer.clear(timer_off_handle);
    }
    else {
      print("button off event");
      // deactivate turn-on timer, if it was running
      Timer.clear(timer_on_handle);
      // activate timer to turn off output after 5 seconds
      timer_off_handle = Timer.set(5000,false,timerOFFcallback,null); 
    }
  }
}

Shelly.addEventHandler(eventcallback, userdata);
