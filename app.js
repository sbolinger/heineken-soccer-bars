// Google "Place API" API Key
var key = 'xxxxx-xxxxx';

// Create final file
var fs = require('fs');
var finalCsv = fs.createWriteStream("final_csv.csv");
finalCsv.write('Location,Address,City,State,Zip,Country,Phone,Email,Hours,Website,Latitude,Longitude,default\n');

var placeIds;
var lookupCounter = 0;
var maxPlaceIds = 1000;

// Read Place IDs CSV
var filename = 'place-ids.csv';
fs.readFile(filename, 'utf8', function(err, data) {
	if (err) throw err;
	placeIds = data.split(/\r?\n/);
	
	processPlaceIds(placeIds);
});

// Loop through loaded Place IDs
function processPlaceIds(placeIds) {
	if (placeIds.length > 0) {
		for ( var i = 0, l = Math.min(maxPlaceIds, placeIds.length); i < l; ++i) {
			getData(placeIds[i]);
		}
	}
}

// Lookup Place ID
function getData (placeId) {
	var url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=[PLACE-ID]&key=[KEY]';
	url = url.replace('[PLACE-ID]', placeId);
	url = url.replace('[KEY]', key);
	
	var https = require('https');
	
	https.get(url, function(res){
	    var body = '';

	    res.on('data', function(chunk){		
	        body += chunk;
	    });

	    res.on('end', function(){
	        var googleResponse = JSON.parse(body);
			
			var placeDetails = {};// {name: googleResponse.result.name, address: googleResponse.result.formatted_address, phone: googleResponse.result.formatted_phone_number, website: googleResponse.result.website};
			
			for (var i = 0, l = googleResponse.result.address_components.length; i < l; ++i) {
				// Street number
				if (googleResponse.result.address_components[i].types.indexOf('street_number') != -1) {
					placeDetails.street_number = googleResponse.result.address_components[i].long_name;
				}
				
				// Street name
				if (googleResponse.result.address_components[i].types.indexOf('route') != -1) {
					placeDetails.street_name = googleResponse.result.address_components[i].long_name;
				}
				
				// City
			    if (googleResponse.result.address_components[i].types.indexOf('locality') != -1) {
					placeDetails.city = googleResponse.result.address_components[i].long_name;
				} else if (googleResponse.result.address_components[i].types.indexOf('sublocality_level_1') != -1) {
					placeDetails.city = googleResponse.result.address_components[i].long_name;
				}
				
				// State
				if (googleResponse.result.address_components[i].types.indexOf('administrative_area_level_1') != -1) {
					placeDetails.state = googleResponse.result.address_components[i].short_name;
				}
				
				// ZIP
				if (googleResponse.result.address_components[i].types.indexOf('postal_code') != -1) {
					placeDetails.zip_code = googleResponse.result.address_components[i].long_name;
				}
			}
			
			var dataRow = '\"' + googleResponse.result.name + '\",' + placeDetails.street_number + ' ' + placeDetails.street_name + ',' + placeDetails.city + ',' + placeDetails.state + ',' + placeDetails.zip_code + ',US,' + googleResponse.result.formatted_phone_number + ',,,' + googleResponse.result.website + ',' + googleResponse.result.geometry.location.lat + ',' + googleResponse.result.geometry.location.lng + ',\n';
			
			finalCsv.write(dataRow);
		
			lookupCounter ++;
		
			if(lookupCounter == Math.min(maxPlaceIds, placeIds.length)) {
				console.log('rows written:', lookupCounter);
			
				finalCsv.end();			
			}
	    });
	
	}).on('error', function(e){
	      console.log("error: ", e);
	});
}