var beaconsConfig = new require("beaconsConfig")(
  $.log,
  beaconDetected,
  stopMonitor
);

var beaconAlreadyDetected = false;

var lastBeacon = Ti.App.Properties.getObject("lastBeacon",{});
$.uuid.value = lastBeacon.uuid || "";
$.identifier.value = lastBeacon.identifier || "";
$.major.value = lastBeacon.major || "";
$.minor.value = lastBeacon.minor || "";
if($.uuid.value){
	$.startBtn.enabled = true;
}


function startMonitor(e) {
  $.startBtn.enabled = false;
  $.stopBtn.enabled = true;
  $.uuid.enabled = false;
  $.identifier.enabled = false;
	$.major.enabled = false;
  $.minor.enabled = false;
  verificaPermessiGPS(function(permesso) {
		Ti.API.info("Il permesso è -------->", permesso);
    if (permesso) {
      $.log.text = "Sto cercando il beacon...";

			var beacon = {};
			beacon.identifier = $.identifier.value;// || "Beacon Test";
			beacon.uuid = $.uuid.value; //"A2FA7357-C8CD-4B95-98FD-9D091CE43337";
			if($.major.value){
				beacon.major = $.major.value;
			}
			if($.minor.value){
				beacon.minor = $.minor.value;
			}
			Ti.App.Properties.setObject("lastBeacon",beacon);

      var beacons = [beacon];
      beaconsConfig.startMonitoring(
        beacons,
        beaconDetected
      );
    } else {
      Ti.UI.createAlertDialog({
        title: L("app_name"),
        message: "Attiva ed autorizza l'uso del GPS per poter cercare il beacon",
        buttonNames: ["OK"]
      }).show();
      stopMonitor();
    }
  });
}

function stopMonitor(e) {
  beaconsConfig.stopMonitoring();
  $.startBtn.enabled = true;
  $.stopBtn.enabled = false;
  $.uuid.enabled = true;
  $.identifier.enabled = true;
	$.major.enabled = true;
  $.minor.enabled = true;
  beaconAlreadyDetected = false;
  //$.log.text = "Ricerca terminata"
}

function beaconDetected(e) {
  if (!beaconAlreadyDetected) {
    beaconAlreadyDetected = true;
    $.log.text += "\n\n - Ho trovato un beacon! \n" + JSON.stringify(e);
    stopMonitor();
  }
}

function uuidChange(e) {
  $.startBtn.enabled = e.value ? true : false;
}

function verificaPermessiGPS(callback) {

	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
	Ti.Geolocation.distanceFilter = 2;
	//Ti.Geolocation.preferredProvider = Ti.Geolocation.PROVIDER_GPS;
	//Ti.Geolocation.pauseLocationUpdateAutomatically = true;

  if (Ti.Geolocation.hasLocationPermissions()) {
    Ti.API.info('Ho i permessi per il GPS :)');
    getLocation();
    callback(true);
  } else {
    Ti.API.info('Non ho ancora i permessi per il GPS, li chiedo...');
		//Ti.Geolocation.requestLocationPermissions(Ti.Geolocation.AUTHORIZATION_WHEN_IN_USE);
    Ti.Geolocation.requestLocationPermissions(Ti.Geolocation.AUTHORIZATION_ALWAYS, function(e) {
      if (e.success) {
        Ti.API.info('Adesso ho ottenuto i permessi per il GPS :)');
        callback(true);
        getLocation();
      } else {
        Ti.API.error('Non ho potuto ottenere i permessi per il GPS :(');
        callback(false);
      }
    });
  }
}

/*
function getLocation(event) {
    Ti.API.info(JSON.stringify(event));
    Ti.API.info('Requested');
		$.log.text += ("\n\n- Posizione corrente:\n" + JSON.stringify(event, null, 2)) + "\n";
		Ti.Geolocation.removeEventListener('location', getLocation);
}
*/

var posizioneTrovata = false;
var currentLocation = function(e) {
	Ti.API.info("***** currentLocation *****");
	Ti.API.info(e);
	if(e.success && typeof e.coords !== 'undefined' && !posizioneTrovata){
		posizioneTrovata = true;
		Ti.API.info("Posizione trovata!");
		$.log.text += ("\n\n- Posizione corrente:\n" + JSON.stringify(e, null, 2)) + "\n";
		interrompiGPS();
	};
};

function interrompiGPS(){
	setTimeout(function(){
		Ti.API.info("interrompiGPS");
		Ti.Geolocation.removeEventListener('location', currentLocation);
		Ti.API.info("GPS interrotto correttamente!");
		posizioneTrovata = false;
	},1000)
}

function getLocation() {
	/*Ti.Geolocation.getCurrentPosition(function(e){
			$.log.text += ("\n\n- Posizione corrente:\n" + JSON.stringify(e, null, 2)) + "\n";
	});*/
  Ti.Geolocation.addEventListener('location', currentLocation);
}


$.index.open();
