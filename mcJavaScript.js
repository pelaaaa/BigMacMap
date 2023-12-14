var map = L.map('map', {
    center: [44.15, -120.5542],
    zoom: 7
});

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


var mcCop = L.icon({
    iconUrl: 'big_mac_cop.png',
    iconSize: [38, 55],
    iconAnchor: [22, 34],
	popupAnchor: [0, -38]
});

var bigMac = L.icon({
    iconUrl: 'big_mac.png',
    iconSize: [35, 35],
    iconAnchor: [18,18],
    popupAnchor: [0,-38]
});

var bigBufLayerPts = L.layerGroup().addTo(map);
var prevMarker = null;
var prevBuffer = null;
var prevClose = null;
var prevGeolocMarker = null;

map.on('click', function (e) {
    bigBufLayerPts.clearLayers();
	
	if (prevMarker) {
		map.removeLayer(prevMarker);
    }

    var mcCop = L.icon({
        iconUrl: 'big_mac_cop.png',
		iconSize: [38, 55],
        iconAnchor: [22, 34],
        popupAnchor: [0, -38]
    });

    var clickLatLng = e.latlng;
    var pointy = turf.point([clickLatLng.lng, clickLatLng.lat]);
    var marker = L.marker(clickLatLng, { icon: mcCop }).addTo(map);
	
	
	
    fetch('https://raw.githubusercontent.com/pelaaaa/geog_371_lab_3/main/mcpoints.geojson')
        .then(response => response.json())
        .then(pointsData => {
            var turfPoints = turf.featureCollection(pointsData.features);

            var bigBufR = prompt('Big Mac Cop says: "How many miles do you want the radius to be?"', '20');
            console.log(bigBufR);

            while (bigBufR > 20) {
                bigBufR = prompt('Big Mac Cop says: "Woah there big fella, maybe choose somethin a lil smaller."');
            }
			if (bigBufR >= 15) {
				map.flyTo(clickLatLng, 10);
			} else if (bigBufR >= 10 && bigBufR < 15) {
				map.flyTo(clickLatLng, 12);
			} else {
				map.flyTo(clickLatLng, 14);
			}
			
            var bigBuf = turf.buffer(pointy, bigBufR, { units: 'miles' });
            var bigBufLayer = L.geoJSON(bigBuf).addTo(map);

			var mcNearest = turf.nearestPoint(pointy, turfPoints);
			var mcDistance = turf.distance(pointy, mcNearest, {units:'miles'});
			console.log("mcDistance: "+mcDistance.toFixed(2));
			
            var pointsWithinBuffer = turf.pointsWithinPolygon(turfPoints, bigBuf);
            var numBufPts = pointsWithinBuffer.features.length;
			console.log("points within buf: "+numBufPts)

			if (numBufPts === 0) {
				marker.bindPopup('Big Mac Cop says: "There are no McDonalds within this area. The closest McDonalds is '+mcDistance.toFixed(2)+' miles away. :( <br>Good luck finding a Big Mac."');
			}
			
			var mcClosestCrds = mcNearest.geometry.coordinates;
			var mcClosest = L.marker([mcClosestCrds[1],mcClosestCrds[0]],{icon:bigMac}).addTo(map);
			
			
            var biggestBufPts = L.geoJSON(pointsWithinBuffer, {
                pointToLayer: function (feature, latlng) {
					var biggestMac = feature.properties.big_mac;
					mcClosest.bindPopup("MaccyD Big Mac price: $"+biggestMac);
					var mcAverage = calculateAveragePrice(pointsWithinBuffer);
					console.log("mcAverage: "+mcAverage)
					
					var markster = L.marker(latlng,{icon:bigMac});
					markster.bindPopup("MaccyD Big Mac price: $"+biggestMac);
					
					if (numBufPts === 1) {
						marker.bindPopup('Big Mac Cop says: "There is 1 McDonalds within this area. '+
						'It is about '+mcDistance.toFixed(2)+' miles away.<br>'+
						'The average price for a Big Mac in this area is '+mcAverage+'."');
					} else {
						marker.bindPopup('Big Mac Cop says: "There are ' + numBufPts + ' McDonalds within this area. '+
						'The closest one is about '+mcDistance.toFixed(2)+' miles away.<br>'+
						'The average price for a Big Mac in this area is $'+mcAverage+'."');
					}
					
                    return markster;
                }
            });

            biggestBufPts.addTo(bigBufLayerPts);
			prevMarker = marker;
			prevBuffer = bigBufLayer;
			prevClose = mcClosest;
        });
});


function calculateAveragePrice(pointsWithinBuffer) {
	const allPrices = [];	
	
    pointsWithinBuffer.features.forEach(function (feature) {
        const price = feature.properties.big_mac; 
		allPrices.push(parseFloat(price));
		return allPrices;
    });
	console.log(allPrices)
	
	function countThatPaper(list){
		if (list.length === 0){
			return 0;
		} else{
			return list[0] + countThatPaper(list.slice(1));
		}
	}
	
	var totalPrices = countThatPaper(allPrices);
	console.log("tot price: "+totalPrices);
	var length = pointsWithinBuffer.features.length;

    const averagePrice = totalPrices / length;
    return averagePrice.toFixed(2); 
}


var locateButton = document.getElementById('locateButton');

function geolocateUser() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var latlng = [position.coords.latitude, position.coords.longitude];
      map.setView(latlng, 15);

      var marky = L.marker(latlng, { icon: mcCop }).addTo(map);
	  foundUser(latlng,marky);
	  
    }, function (error) {
      alert('Big Mac Cop says: "I\'m sorry I couldn\'t find you! My tracker got an error: ' + error.message + '."');
    });
  } else {
    alert('Big Mac Cop says: "Get a better browser. I can\'t find you with this one."');
  }
}

locateButton.addEventListener('click', geolocateUser);


function foundUser(latlng,marky){
	
var pointster = turf.point(latlng);
fetch('https://raw.githubusercontent.com/pelaaaa/geog_371_lab_3/main/mcpoints.geojson')
        .then(response => response.json())
        .then(pointsData => {
            var turfPoints = turf.featureCollection(pointsData.features);

            var bigBufR = prompt('Big Mac Cop says: "How many miles do you want the radius to be?"', '20');
            console.log(bigBufR);

            while (bigBufR > 20) {
                bigBufR = prompt('Big Mac Cop says: "Woah there big fella, maybe choose somethin a lil smaller."');
            }
			
            var bigBuf = turf.buffer(pointster, bigBufR, { units: 'miles' });
            var bigBufLayer = L.geoJSON(bigBuf).addTo(map);

			var mcNearest = turf.nearestPoint(pointster, turfPoints);
			var mcDistance = turf.distance(pointster, mcNearest, {units:'miles'});
			console.log("mcDistance: "+mcDistance.toFixed(2));
			
            var pointsWithinBuffer = turf.pointsWithinPolygon(turfPoints, bigBuf);
            var numBufPts = pointsWithinBuffer.features.length;
			console.log("points within buf: "+numBufPts)

			if (numBufPts === 0) {
				marky.bindPopup('Big Mac Cop says: "There are no McDonalds within this area. The closest McDonalds is '+mcDistance.toFixed(2)+' miles away. :( <br>Good luck finding a Big Mac."');
			}
			
			var mcClosestCrds = mcNearest.geometry.coordinates;
			var mcClosest = L.marker([mcClosestCrds[1],mcClosestCrds[0]],{icon:bigMac}).addTo(map);
			
			
            var biggestBufPts = L.geoJSON(pointsWithinBuffer, {
                pointToLayer: function (feature, latlng) {
					var biggestMac = feature.properties.big_mac;
					mcClosest.bindPopup("MaccyD Big Mac price: $"+biggestMac);
					var mcAverage = calculateAveragePrice(pointsWithinBuffer);
					console.log("mcAverage: "+mcAverage)
					
					var markster = L.marker(latlng,{icon:bigMac});
					markster.bindPopup("MaccyD Big Mac price: $"+biggestMac);
					
					if (numBufPts === 1) {
						marker.bindPopup('Big Mac Cop says: "There is 1 McDonalds within this area. '+
						'It is about '+mcDistance.toFixed(2)+' miles away.<br>'+
						'The average price for a Big Mac in this area is '+mcAverage+'."');
					} else {
						marker.bindPopup('Big Mac Cop says: "There are ' + numBufPts + ' McDonalds within this area. '+
						'The closest one is about '+mcDistance.toFixed(2)+' miles away.<br>'+
						'The average price for a Big Mac in this area is $'+mcAverage+'."');
					}
					
                    return markster;
                }
            });
		});
}