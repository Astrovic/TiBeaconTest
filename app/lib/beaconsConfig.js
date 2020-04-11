/*
// Inserire in questo array tutti i beacons da monitorare
var beacons = [
	{
		uuid : "ACFD065E-C3C0-11E3-9BBE-1A514932AC01",
		major: 1,
		minor: 1,
		identifier : "Region room 1",
		url : "http://www.anmco.it",
		msg : "Scopri ANMCO! Messaggio inviato dal beacon 1!",
		msgSended : false // Verifico se il messaggio è già stato aperto/inviato, in tal caso non invio più la notifica
	},
	{
		uuid : "00000000-0000-0000-0000-000000000000",
		major: 1,
		minor: 2,
		identifier : "Region room 2",
		url : "http://www.etnatraining.it",
		msg : "Nuovi corsi per sviluppo di app mobile con EtnaTraining! Beacon 2",
		msgSended : false
	},
	{
		uuid : "00000000-0000-0000-0000-000000000001",
		major: 1,
        minor: 3,
		identifier : "Region room 3",
		url : "http://www.google.it",
		msg : "Il beacon 3 ti invita a visitare Google :)",
		msgSended : false
	},
	{
		uuid : "00000000-0000-0000-0000-000000000002",
		major: 1,
		minor: 4,
        identifier : "Region room 4",
		url : "http://www.amazon.it",
		msg : "Il beacon 4 ti porta alla scoperta di Amazon :D",
		msgSended : false
	},
	{
		uuid : "B9407F30-F5F8-466E-AFF9-25556B57FE6D",
		major: 1,
        minor: 5,
		identifier : "Region room 5",
		notifyEntryStateOnDisplay: "YES" ,
		url : "http://www.ebay.it",
		msg : "Wow, hai visitato il beacon 5, scopri le nostre offerte",
		msgSended : false
	}
];
//beacons = Ti.App.Properties.getObject("beaconsList", beacons);
*/

module.exports = function(logLbl,beaconDetected,cb_stopMonitor){


  var Beacon = {}, TiBeacons;
  if (OS_IOS) {
    TiBeacons = require("org.beuckman.tibeacons");
  }else if(OS_ANDROID){
    TiBeacons = require("com.liferay.beacons");
  }

  Beacon.startMonitoring = function(_beacons) {
    if (OS_IOS) {
      //TiBeacons = require("org.beuckman.tibeacons");

      // Avvio il monitoraggio
      /*for(var i in beacons){
    		TiBeacons.startMonitoringForRegion(beacons[i]);
    	};*/

      /*if (TiBeacons.isBLESupported()) {
    		if(Alloy.Globals.debug_mode){
    			Ti.API.info("BLE is supported on this device");
    		};
    		TiBeacons.requestBluetoothStatus();
    	} else {
    		if(Alloy.Globals.debug_mode){
    			Ti.API.info("BLE isn't supported on this device");
    		};
    	};*/
      TiBeacons.addEventListener("bluetoothStatus", bluetoothStatus);
    } else {
      //Bring in the module
      /*
      var alarmModule = require("bencoding.alarmmanager");
      //Create a new instance of the Alarm Manager
      var alarmManager = alarmModule.createAlarmManager();
      */

      //TiBeacons = require("com.liferay.beacons");
      TiBeacons.setScanPeriods({
        foregroundScanPeriod: 5000, // per quanti ms avviene la scansione con l'app inforeground
        foregroundBetweenScanPeriod: 15000, // ogni quanto ms ripetere la scansione con l'app in foreground
        backgroundScanPeriod: 5000, // per quanti ms avviene la scansione con l'app in background
        backgroundBetweenScanPeriod: 60000 // ogni quanto ms ripetere la scansione con l'app in foreground
      });

      var androidBluetoothAD = Ti.UI.createAlertDialog({
        title: L("app_name"),
        message: L("abilita_bluetooth"),
        buttonNames: [L("close"), "Settings"],
        cancel: 0
      });
      androidBluetoothAD.addEventListener("click", function(e) {
        if (Alloy.Globals.debug_mode) {
          Ti.API.info("\n\n\nandroidBluetoothAD\n");
          Ti.API.info(e.cancel);
          Ti.API.info(e.index);
        }
        if (e.index) {
          var settingsIntent = Titanium.Android.createIntent({
            action: "android.settings.BLUETOOTH_SETTINGS"
          });
          Ti.Android.currentActivity.startActivity(settingsIntent);
        }
        // Ad intervalli di 10s verifico se ho abilitato il bluetooth.
        //Dopo averlo abilitato, posso avviare il monitoraggio dei beacons
        var bluetoothChekInterval;
        bluetoothChekInterval = setInterval(function() {
          if (!TiBeacons.checkAvailability()) {
            return;
          } else {
            clearInterval(bluetoothChekInterval);
            bluetoothChekInterval = null;
            startMonitoring();
          }
        }, 10000);
      });

      // Su android il modulo abilita il ble in modo asincrono, dunque verifico che sia pronto prima di avviare il monitoring
      var handle;
      handle = setInterval(function() {
        if (!TiBeacons.isReady()) return;

        if (Alloy.Globals.debug_mode) {
          Ti.API.info("Okay! TiBeacons is ready!");
          Ti.API.info(
            "*** TiBeacons.checkAvailability() --->> " +
            TiBeacons.checkAvailability()
          );
        }
        clearInterval(handle);
        handle = null;

        /*// Avvio il monitoraggio
    		for(var i in beacons){
    			TiBeacons.startMonitoringForRegion(beacons[i]);
    		};*/

        // Per ridurre i consumi su android, verifico se l'app è in foreground o in background
        // Per farlo utilizzo un modulo, ed eseguo la verifica ad intervalli di 30 secondi
        var androidPlatformTools = require("bencoding.android.tools").createPlatform();
        setInterval(function() {
          var isForeground = androidPlatformTools.isInForeground();
          if (Alloy.Globals.debug_mode) {
            Ti.API.info("Am I currently in the foreground? " + isForeground);
          }
          if (isForeground) {
            TiBeacons.setBackgroundMode(false);
          } else {
            TiBeacons.setBackgroundMode(true);
          }
        }, 30000);

        verificaBluetooth();
      }, 1000);
    }

    function verificaBluetooth() {
      if (OS_IOS) {
        // Verifico se il device supporta il BLE, in caso affermativo, verifico se è abilitato il bluetooth
        if (TiBeacons.isBLESupported()) {
          if (Alloy.Globals.debug_mode) {
            Ti.API.info("BLE is supported on this device");
          }
          TiBeacons.requestBluetoothStatus();
        } else {
          if (Alloy.Globals.debug_mode) {
            Ti.API.info("BLE isn't supported on this device");
          }
          //TiBeacons.requestBluetoothStatus();
        }
      } else {
        // Su android il modulo verifica il ble in modo asincrono, dunque aspetto che si apronto prima di eseguire la verifica dell'attivazione del bluetooth
        var handle;
        handle = setInterval(function() {
          if (!TiBeacons.isReady()) return;
          clearInterval(handle);
          handle = null;

          // Se il bluetooth non è abilitato, chiedo di abilitarlo, altrimenti avvio il monitor dei beacons
          if (!TiBeacons.checkAvailability()) {
            //alert('Either Bluetooth is turned off, or your device does not support Bluetooth LE');
            androidBluetoothAD.show();
          } else {
            startMonitoring();
          }
        }, 1000);
      }
    }

    beacons = _beacons;
    verificaBluetooth();
  };

  // Creo le funzioni per i listener dei beacon
  function bluetoothStatus(e) {
    // Salvo la prossima data nella quale devo visualizzare la richiesta per abilitare il bluetooth.
    // La prima volta la visualizzo subito, dunque imposto un'orario precedente a quello attuale
    var nextRequestBluetoothStatusAlertDialog = new Date(
      new Date().getTime() - 20000
    );
    var iosBluetoothAD = Ti.UI.createAlertDialog({
      title: L("app_name"),
      message: L("abilita_bluetooth"),
      buttonNames: ["OK"]
    });
    iosBluetoothAD.addEventListener("click", function() {
      // Mostro di nuovo il messaggio solo fra altri 10 minuti, se nel frattempo non ho ancora abilitato il bluetooth
      nextRequestBluetoothStatusAlertDialog = new Date(
        new Date().getTime() + 1000 //1000 * 60 * 10
      ); //10m
      if (Alloy.Globals.debug_mode) {
        Ti.API.info(
          nextRequestBluetoothStatusAlertDialog +
          " ---> iosBluetoothAD click -- nextRequestBluetoothStatusAlertDialog"
        );
      }
    });

    if (e.status != "on") {
      if (Alloy.Globals.debug_mode) {
        Ti.API.info("bluetooth is not on");
        Ti.API.info(
          nextRequestBluetoothStatusAlertDialog +
          " --> nextRequestBluetoothStatusAlertDialog"
        );
        Ti.API.info(new Date() + " --> new Date()");
        Ti.API.info(
          "( new Date() > nextRequestBluetoothStatusAlertDialog ) ---> " +
          (new Date() > nextRequestBluetoothStatusAlertDialog)
        );
      }
      if (new Date() > nextRequestBluetoothStatusAlertDialog) {
        iosBluetoothAD.show();
        // Finchè non farò click sull'Alert Dialig, visualizzo il prossimo avviso solo se è trascorso almeno un giorno
        // Altrimenti, se ho ad esempio l'app in background, verrebbe creata una nuova alert dialog ogni 10 secondi,
        // ed al resume dell'app mi ritroverei tante alertdialog da chiudere
        // Se invece clicco su OK sull'alert dialog, aspetto altri 10 minuti per visualizzare il prossimo avviso,
        // (tramite iosBluetoothAD.addEventListener("click") ) a meno che nel frattempo non sia stato abilitato.
        nextRequestBluetoothStatusAlertDialog = new Date(
          new Date().getTime() + 1000 * 60 * 60 * 24
        ); // 24h
      }
      /*setTimeout(function() {
        // Se il bluetooth è disabilitato, ogni 10s verifico che sia stato abilitato.
        TiBeacons.requestBluetoothStatus();
      }, 10000); //10s*/
      if(logLbl){
        logLbl.text = "Il bluetooth non è abilitato.. :(";
      }
      setTimeout(function(){
        cb_stopMonitor();
      },2000);
    } else {
      if (Alloy.Globals.debug_mode) {
        Ti.API.info("bluetooth is on");
      }
      // Se il bluetooth è abilitato, inizio il monitoring dei beacons
      startMonitoring();
    }
  }

  function beaconProximity(e) {
    if (Alloy.Globals.debug_mode) {
      Ti.API.info(
        "beaconProximity: beacon " +
        e.identifier +
        " " +
        e.major +
        "/" +
        e.minor +
        " is now " +
        e.proximity
      );
      Ti.API.info(e);
    }
    //if(OS_IOS){notify("beaconProximity: beacon "+ e.identifier + " " +e.major+"/"+e.minor+" is now "+e.proximity);}
    if (e.proximity === "immediate" || e.proximity === "near") {
      if (Alloy.Globals.debug_mode) {
        Ti.API.info("beaconProximity: traccio l'utente!");
      }
      // invio i dati utenti al server per il tracking
      beaconDetected(e);
    }
  }

  function beaconRanges(event) {
    if (Alloy.Globals.debug_mode) {
      Ti.API.info("beaconRanges");
    }
    for (var i in event.beacons) {
      var b = event.beacons[i];
      if (Alloy.Globals.debug_mode) {
        Ti.API.info(
          "beaconRanges: beacon " +
          b.uuid +
          " " +
          b.major +
          "/" +
          b.minor +
          " has accuracy: " +
          b.accuracy
        );
        Ti.API.info(b);
      }
      switch (b.proximity) {
        case "immediate":
          if (Alloy.Globals.debug_mode) {
            Ti.API.info(
              "beaconRanges: Found " +
              b.uuid +
              " " +
              b.major +
              "/" +
              b.minor +
              " in immediate proximity!"
            );
            //if(OS_IOS){notify("beaconRanges: Found " + b.uuid + " " + b.major + "/" + b.minor + " in immediate proximity!")};
          }
          // invio i dati utenti al server per il tracking
          beaconDetected(b);
          break;
        case "near":
          if (Alloy.Globals.debug_mode) {
            Ti.API.info(
              "beaconRanges: Found " +
              b.uuid +
              " " +
              b.major +
              "/" +
              b.minor +
              " in near proximity!"
            );
            //if(OS_IOS){notify("beaconRanges: Found " + b.uuid + " " + b.major + "/" + b.minor + " in near proximity!")};
          }
          // invio i dati utenti al server per il tracking
          beaconDetected(b);
          break;
      }
    }
  }

  function enteredRegion(e) {
    if (Alloy.Globals.debug_mode) {
      /*notify(
        "enteredRegion: beacon " +
        e.identifier +
        " " +
        e.major +
        "/" +
        e.minor +
        " is entering "
      );*/
      Ti.API.info(
        "enteredRegion: beacon " +
        e.identifier +
        " " +
        e.major +
        "/" +
        e.minor +
        " is entering"
      );
      Ti.API.info(e);
    }
    if (OS_IOS) {
      TiBeacons.startRangingForBeacons(e);
    }
    TiBeacons.fireEvent("beaconRanges"); // provo a forzare l'evento
  }

  function determinedRegionState(e) {
    if (e.regionState == "inside") {
      if (Alloy.Globals.debug_mode) {
        //if(OS_IOS){notify("determinedRegionState: beacon " + e.identifier + " " +  e.major + "/" + e.minor + " is inside ")};
        Ti.API.info(
          "determinedRegionState: beacon " +
          e.identifier +
          " " +
          e.major +
          "/" +
          e.minor +
          " is inside"
        );
        Ti.API.info(e);
      }
      if (OS_IOS) {
        TiBeacons.startRangingForBeacons(e);
      }
      TiBeacons.fireEvent("beaconRanges"); // provo a forzare l'evento
    }
  }

  function exitedRegion(e) {
    if (Alloy.Globals.debug_mode) {
      /*notify(
        "exitedRegion: beacon " +
        e.identifier +
        " " +
        e.major +
        "/" +
        e.minor +
        " is exiting"
      );*/
      Ti.API.info(
        "exitedRegion: beacon " +
        e.identifier +
        " " +
        e.major +
        "/" +
        e.minor +
        " is exiting"
      );
      Ti.API.info(e);
    }
    if (OS_IOS) {
      TiBeacons.stopRangingForBeacons(e);
    }

    // Mi salvo l'ora dell'ultimo accesso nella regione del beacon
    var beaconUdid = "" + e.uuid + e.major + e.minor;
    beaconUdid = beaconUdid.replace(/ /g, ""); // creao una properties per ogni singolo beacon, contenente l'ora dell'ultimo tracciamento rilevato
    Ti.App.Properties.setDouble(beaconUdid, new Date().getTime());
  }

  function startMonitoring() {
    //verificaBluetooth(function(){

    if (Alloy.Globals.debug_mode) {
      Ti.API.info("** startMonitoring() in app**");
    }

    //beacons = Ti.App.Properties.getObject("beaconsList", beacons);

    // Carico i dati dei beacons dal db
    /*
    var db = Ti.Database.open("anmcoDB");
    var result = db.execute("SELECT * FROM tbl_BEACONS");
    while (result.isValidRow()) {
      var beacon = {
        uuid: result.fieldByName("uuid"),
        major: result.fieldByName("major"),
        minor: result.fieldByName("minor"),
        identifier: result.fieldByName("identifier")
      };
      // Avvio il monitoraggio per beacon
      TiBeacons.startMonitoringForRegion(beacon);
      //beacon = false;
      result.next();
    }
    result.close();
    db.close();
    */

    // Avvio il monitoraggio
  		for(var i in beacons){
        Ti.API.info(beacons[i]);
  			TiBeacons.startMonitoringForRegion(beacons[i]);
  		};

    //	if(OS_IOS){

    /*var TiBeacons = require('org.beuckman.tibeacons');

  			// Per assicurarmi di non creare duplicati dei listeners di TiBeacons, fermo tutti i monitoraggi e li riavvio
  			// To stop monitoring all regions
  			TiBeacons.stopMonitoringAllRegions();
  			// Make sure you stopped ranging all beacons after stop monitoring
  			TiBeacons.stopRangingForAllBeacons();

  			for(var i in beacons){
  				TiBeacons.startMonitoringForRegion(beacons[i]);
  			};*/

    TiBeacons.addEventListener("beaconProximity", beaconProximity);
    TiBeacons.addEventListener("beaconRanges", beaconRanges);
    TiBeacons.addEventListener("enteredRegion", enteredRegion);
    TiBeacons.addEventListener("determinedRegionState", determinedRegionState);
    TiBeacons.addEventListener("exitedRegion", exitedRegion);

    //	};
    //});
  }


  Beacon.stopMonitoring = function() {
    Ti.API.info("Beacon.stopMonitoring");
    TiBeacons.stopMonitoringAllRegions();
    TiBeacons.removeEventListener("beaconProximity", beaconProximity);
    TiBeacons.removeEventListener("beaconRanges", beaconRanges);
    TiBeacons.removeEventListener("enteredRegion", enteredRegion);
    TiBeacons.removeEventListener("determinedRegionState", determinedRegionState);
    TiBeacons.removeEventListener("exitedRegion", exitedRegion);
    if(OS_IOS){
      TiBeacons.removeEventListener("bluetoothStatus", bluetoothStatus);
    }
    if(logLbl){
      logLbl.text += "\n\nRicerca terminata! :)";
    }
  };

  return Beacon;
};
