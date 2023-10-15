/*
https://shelly-api-docs.shelly.cloud/gen2/Devices/ShellyPlus2PM
http://10.38.22.14/rpc/Cover.GetStatus?id=0
{"id":0, "source":"SHC", "state":"opening","move_timeout":60.00, "move_started_at":1694250624.74,"apower":130.6,"voltage":233.2,"current":0.584,"pf":0.96,"freq":50.0,"aenergy":{"total":4.313,"by_minute":[17.369,0.000,0.000],"minute_ts":1694250624},"temperature":{"tC":48.3, "tF":118.9},"pos_control":true,"last_direction":"open","current_pos":2}
{"id":0, "source":"SHC", "state":"closing","move_timeout":60.00, "move_started_at":1694250690.20,"apower":128.2,"voltage":233.1,"current":0.576,"pf":0.96,"freq":50.0,"aenergy":{"total":5.362,"by_minute":[63.500,1002.977,0.000],"minute_ts":1694250690},"temperature":{"tC":48.5, "tF":119.3},"pos_control":true,"last_direction":"close","current_pos":16}
{"id":0, "source":"SHC", "state":"stopped","apower":0.0,"voltage":233.4,"current":0.000,"pf":0.00,"freq":50.0,"aenergy":{"total":5.340,"by_minute":[41.172,1002.977,0.000],"minute_ts":1694250665},"temperature":{"tC":48.6, "tF":119.4},"pos_control":true,"last_direction":"close","current_pos":19}
{"id":0, "source":"limit_switch", "state":"open","apower":0.0,"voltage":233.9,"current":0.000,"pf":0.00,"freq":50.0,"aenergy":{"total":6.048,"by_minute":[229.169,382.422,137.859],"minute_ts":1694250787},"temperature":{"tC":48.6, "tF":119.5},"pos_control":true,"last_direction":"open","current_pos":100}
{"id":0, "source":"limit_switch", "state":"closed","apower":0.0,"voltage":232.2,"current":0.000,"pf":0.00,"freq":50.0,"aenergy":{"total":6.603,"by_minute":[153.054,402.034,0.000],"minute_ts":1694252587},"temperature":{"tC":48.6, "tF":119.4},"pos_control":true,"last_direction":"close","current_pos":0}
*/
// https://shelly.academy/trainings/2/shelly-scripting-basics-may-2023#lesson-8
function getCoverStatusAndExecAction() {
  Shelly.call("Cover.GetStatus", {"id":0}, function(result) {
    if (result == "undefined") {
      logger("Undefined property, probably this is not a Cover device?", "ERROR");
      return;
      }
    let currState = result.state;
    let lastDir   = result.last_direction;
    logger(["Current State: ", currState, ", Last Direction: ", lastDir], "COVER");
    
    if ((currState === "opening") || (currState === "closing")) {
      logger("Action = Stop", "COVER");
      Shelly.call("Cover.Stop", { id: 0 });
      return;
      } 
    if (lastDir === "open") {
      logger("Action = Close", "COVER");
      Shelly.call("Cover.Close", { id: 0 });
      return;
      } 
    else { // last dir = close
      logger("Action = Open", "COVER");
      Shelly.call("Cover.Open", { id: 0 });
      return;
      }
  }); // cover status callback procedure
}


/******************* START CHANGE HERE *******************/
let CONFIG = {
  // When set to true, **all** BT received packets will be logged to the console (may cause spamming)
  debugBleRx: false,
  // When set to true, debug messages will be logged to the console
  debug: false,
  
  // List of scenes
  scenes: [
    /** SCENE START 0 - Print all Shelly BLU messages (all buttons, all button presses, also Door BLU devices) **/
    {
      conditions: {
      // no conditions, use any data
      },
      action: function (data) {
        // prints the data parsed from Shelly blu device
        logger(["Shelly BLU device seen", JSON.stringify(data)], "EXEC");
      },
    },
    /** SCENE END 0 **/
    
    /** SCENE START 1 - button 1 short press (open / stop / close) **/
    {
      conditions: {
        address: "5c:c7:c1:f3:d0:a4", // Spalnica
        address: "b4:35:22:28:ae:72", // Tinkara
        address: "60:ef:ab:40:50:16", // Marcel
        button: 1 // Single short button press
      },
      action: function (data) {
        // Logs a message to the console
        logger("Scene 1", "EXEC");
        // trigger an action
        getCoverStatusAndExecAction(); // and continue to make an action as a callback
      },
    },
    /** SCENE END 1 **/

    /** SCENE START 2  - button 2 short presses (stop) **/
    {
      // when event name is `shelly-blu` and window is equal to 1 (open)
      conditions: {
        address: "5c:c7:c1:f3:d0:a4", // Spalnica  
        button: 2, // Double short button press
      },
      action: function (data) {
        // Logs a message to the console
        logger("Scene 2", "EXEC");
        // trigger an action
        Shelly.call("Cover.Stop", { id: 0 }); // redundant action
        // <add code here if needed>
      },
    },
    /** SCENE END 2 **/

    /** SCENE START 3 - button long press (nothing) **/
    {
      // when event name is `shelly-blu` and window is equal to 1 (open)
      conditions: {
        address: "5c:c7:c1:f3:d0:a4", // Spalnica  
        button: 4, // Long button press
      },
      action: function (data) {
        // Logs a message to the console
        logger("Scene 3", "EXEC");
        // trigger an action
        // <add code here if needed>
      },
    },
    /** SCENE END 3 **/
  ],
};
/******************* STOP CHANGE HERE *******************/

let ALLTERCO_MFD_ID_STR = "0ba9";
let BTHOME_SVC_ID_STR = "fcd2";

let uint8 = 0;
let int8 = 1;
let uint16 = 2;
let int16 = 3;
let uint24 = 4;
let int24 = 5;

//Logs the provided message with an optional prefix to the console.
function logger(message, prefix) {
  //exit if the debug isn't enabled
  if (!CONFIG.debug) {
    return;
  }

  let finalText = "";

  //if the message is list loop over it
  if (Array.isArray(message)) {
    for (let i = 0; i < message.length; i++) {
      finalText = finalText + " " + JSON.stringify(message[i]);
    }
  } else {
    finalText = JSON.stringify(message);
  }

  //the prefix must be string
  if (typeof prefix !== "string") {
    prefix = "";
  } else {
    prefix = prefix + ":";
  }

  //log the result
  console.log(prefix, finalText);
}

// The BTH object defines the structure of the BTHome data
let BTH = {};
BTH[0x00] = { n: "pid", t: uint8 };
BTH[0x01] = { n: "battery", t: uint8, u: "%" };
BTH[0x02] = { n: "temperature", t: int16, f: 0.01, u: "tC" };
BTH[0x03] = { n: "humidity", t: uint16, f: 0.01, u: "%" };
BTH[0x05] = { n: "illuminance", t: uint24, f: 0.01 };
BTH[0x21] = { n: "motion", t: uint8 };
BTH[0x2d] = { n: "window", t: uint8 };
BTH[0x3a] = { n: "button", t: uint8 };
BTH[0x3f] = { n: "rotation", t: int16, f: 0.1 };

function getByteSize(type) {
  if (type === uint8 || type === int8) return 1;
  if (type === uint16 || type === int16) return 2;
  if (type === uint24 || type === int24) return 3;
  //impossible as advertisements are much smaller;
  return 255;
}

// functions for decoding and unpacking the service data from Shelly BLU devices
let BTHomeDecoder = {
  utoi: function (num, bitsz) {
    let mask = 1 << (bitsz - 1);
    return num & mask ? num - (1 << bitsz) : num;
  },
  getUInt8: function (buffer) {
    return buffer.at(0);
  },
  getInt8: function (buffer) {
    return this.utoi(this.getUInt8(buffer), 8);
  },
  getUInt16LE: function (buffer) {
    return 0xffff & ((buffer.at(1) << 8) | buffer.at(0));
  },
  getInt16LE: function (buffer) {
    return this.utoi(this.getUInt16LE(buffer), 16);
  },
  getUInt24LE: function (buffer) {
    return (
      0x00ffffff & ((buffer.at(2) << 16) | (buffer.at(1) << 8) | buffer.at(0))
    );
  },
  getInt24LE: function (buffer) {
    return this.utoi(this.getUInt24LE(buffer), 24);
  },
  getBufValue: function (type, buffer) {
    if (buffer.length < getByteSize(type)) return null;
    let res = null;
    if (type === uint8) res = this.getUInt8(buffer);
    if (type === int8) res = this.getInt8(buffer);
    if (type === uint16) res = this.getUInt16LE(buffer);
    if (type === int16) res = this.getInt16LE(buffer);
    if (type === uint24) res = this.getUInt24LE(buffer);
    if (type === int24) res = this.getInt24LE(buffer);
    return res;
  },

  // Unpacks the service data buffer from a Shelly BLU device
  unpack: function (buffer) {
    //beacons might not provide BTH service data
    if (typeof buffer !== "string" || buffer.length === 0) return null;
    let result = {};
    let _dib = buffer.at(0);
    result["encryption"] = _dib & 0x1 ? true : false;
    result["BTHome_version"] = _dib >> 5;
    if (result["BTHome_version"] !== 2) return null;
    //can not handle encrypted data
    if (result["encryption"]) return result;
    buffer = buffer.slice(1);

    let _bth;
    let _value;
    while (buffer.length > 0) {
      _bth = BTH[buffer.at(0)];
      if (typeof _bth === "undefined") {
        logger("unknown type", "BTH");
        break;
      }
      buffer = buffer.slice(1);
      _value = this.getBufValue(_bth.t, buffer);
      if (_value === null) break;
      if (typeof _bth.f !== "undefined") _value = _value * _bth.f;
      result[_bth.n] = _value;
      buffer = buffer.slice(getByteSize(_bth.t));
    }
    return result;
  },
};


//saving the id of the last packet, this is used to filter the duplicated packets
let lastPacketId = 0x100;

// Callback for the BLE scanner object
function BLEScanCallback(event, result) {
  //exit if not a result of a scan
  if (event !== BLE.Scanner.SCAN_RESULT) {
    return;
  }
  if (CONFIG.debugBleRx) {
    console.log('BT info received. Address: ', result.addr, ' Name: ', result.local_name);
  }
  
  //exit if service_data member is missing
  if (
    typeof result.service_data === "undefined" ||
    typeof result.service_data[BTHOME_SVC_ID_STR] === "undefined"
  ) {
//    logger("Missing service_data member", "Error");
    return;
  }
  logger("Service_data exists. Processing...", "Info");
  let unpackedData = BTHomeDecoder.unpack(
    result.service_data[BTHOME_SVC_ID_STR]
  );

  //exit if unpacked data is null or the device is encrypted
  if (
    unpackedData === null ||
    typeof unpackedData === "undefined" ||
    unpackedData["encryption"]
  ) {
    logger("Encrypted devices are not supported", "ERROR");
    return;
  }

  //exit if the event is duplicated
  if (lastPacketId === unpackedData.pid) {
    return;
  }

  lastPacketId = unpackedData.pid;

  unpackedData.rssi = result.rssi;
  unpackedData.address = result.addr;

  //emitData(unpackedData);  // !!!!!!!!!!!!!!!!!111
  SceneManager.onNewData(unpackedData);
}







// Scene Manager object
let SceneManager = {
  scenes: [],

  setScenes: function (scenes) {
    this.scenes = scenes;
  },

  // Process new data and check if any scenes should be executed
  onNewData: function (data) {
    logger(["New data received", JSON.stringify(data)], "Info");
    for (let sceneIndex = 0; sceneIndex < this.scenes.length; sceneIndex++) {
      logger(
        ["Validating conditions for scene with index=", sceneIndex],
        "Info"
      );
      if (this.validateConditionsForScene(sceneIndex, data)) {
        logger(
          ["Conditions are valid for scene with index=", sceneIndex],
          "Info"
        );
        this.executeScene(sceneIndex, data);
      } else {
        logger(
          ["Conditions are not valid for scene with index=", sceneIndex],
          "Info"
        );
      }
    }
  },


  // Validate conditions for a specific scene based on the received data
  validateConditionsForScene: function (sceneIndex, receivedData) {
    if (
      typeof sceneIndex !== "number" ||
      sceneIndex < 0 ||
      sceneIndex >= this.scenes.length
    ) {
      return false;
    }

    let conditions = this.scenes[sceneIndex].conditions;
    if (typeof conditions === "undefined") {
      return false;
    }

    for (let condKey in conditions) {
      let currValue = receivedData[condKey];
      let compValue = conditions[condKey];

      if (currValue !== compValue) {
        logger(
          ["Checking failed for", condKey, " (",currValue," / ",compValue,") in scene with index=", sceneIndex],
          "Info"
        );
        return false;
      }
    }

    return true;
  },

  // Execute the action for a specific scene
  executeScene: function (sceneIndex, data) {
    if (
      typeof sceneIndex !== "number" ||
      sceneIndex < 0 ||
      sceneIndex >= this.scenes.length
    ) {
      return;
    }

    let func = this.scenes[sceneIndex].action;
    if (typeof func === "function") {
      logger(["Executing action for scene with index=", sceneIndex], "Info");
      func(data);
    }
  },
};

// Initialize function for the scene manager and register the event handler
// Initializes the script and performs the necessary checks and configurations
function init() {
  console.log("Start.");
  //exit if can't find the config
  if (typeof CONFIG === "undefined") {
    console.log("Error: Undefined config");
    return;
  }

  //get the config of ble component
  let BLEConfig = Shelly.getComponentConfig("ble");

  //exit if the BLE isn't enabled
  if (!BLEConfig.enable) {
    console.log(
      "Error: The Bluetooth is not enabled, please enable it from settings"
    );
    return;
  }

  //check if the scanner is already running
  if (BLE.Scanner.isRunning()) {
    console.log("Info: The BLE gateway is running, the BLE scan configuration is managed by the device");
  }
  else {
    //start the scanner
    let bleScanner = BLE.Scanner.Start({
        duration_ms: BLE.Scanner.INFINITE_SCAN,
        active: false
    });

    if(!bleScanner) {
      console.log("Error: Can not start new scanner");
    }
  }

  //subscribe a callback to BLE scanner
  BLE.Scanner.Subscribe(BLEScanCallback);


  SceneManager.setScenes(CONFIG.scenes);
  logger("Init finished.", "Info");
}

init();