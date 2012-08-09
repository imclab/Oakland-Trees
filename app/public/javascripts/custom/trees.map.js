var mm = com.modestmaps;
var map = map || {};
var markers = 0;
var map_features = {};

trees.setCenterZoom = function(lat,lon,zoom) {
  if(!map) return;
  if(map.setCenterZoom === undefined) {} else map.setCenterZoom(new MM.Location(lat,lon),zoom);
};

trees.setupMap = function() {
  var layer = new MM.StamenTileLayer("watercolor");
  
  // If we cannot load the map for some reason then just use a default image

  if (layer === undefined) {
    var layer = new MM.Layer(new MM.MapProvider(function(coord) {
      var img = parseInt(coord.zoom) +'-r'+ parseInt(coord.row) +'-c'+ parseInt(coord.column) + '.jpg';
      return 'http://osm-bayarea.s3.amazonaws.com/' + img;
    }));
  }

  trees.map = map = new MM.Map("map-container", layer);

  map.setCenterZoom(new MM.Location(37.82985,-122.364349), 12);

  // On map move events we want to requery the database to fetch features that the map is now over

/*

  map.addCallback('drawn', function(m) {
    console.log("map moved");
    var center = m.getCenter();
    Kernel.query({},center.latitude,center.longitude,trees.repaint);
  });
*/

  var zoomer = wax.mm.zoomer(map)
  zoomer.appendTo('map-container');

  markers = new MM.MarkerLayer();
  map.addLayer(markers);
  markers.parent.setAttribute("id", "markers");

  Core.query2("oakland_fruit",trees.paintTreeMarkers);
  Core.query2("farmers_markets_nocal",trees.paintMarketMarkers);
  Core.query2("berk_oak_sfo_population-csv",trees.paintZipcodeMarkers);
};


trees.makeTreeMarker = function(feature) {

  var id = feature.properties.id;
  var marker = document.createElement("div");
 
  var treeString = '';
  treeString += "<h2>" + feature.properties.title + "</h2>";
  if(feature.properties.address_street !== undefined) {
    treeString += "<h3><strong>" + feature.properties.address_street + "</strong></h3>";
  }
  
  treeString += "<hr>";

  if(feature.properties.tree_owner !== undefined) {

    treeString += "<p>Tree Owner <strong>" + feature.properties.tree_owner + "</strong></p>";
  }

  if(feature.stewardship !== undefined) {
    treeString += "<p>Stewardship <strong>" + feature.stewardship + "</strong></p>";
  }  

  if(feature.variety !== undefined) {
    treeString += "<p>Variety <strong>" + feature.variety + "</strong></p>";
  }   

  if(feature.quantity !== undefined) {
    treeString += "<p>Quantity <strong>" + feature.quantity + "</strong></p>";
  } 

  if(feature.description !== undefined) {
    treeString += "<p>Description <strong>" + feature.description + "</strong></p>";
  } 

  if(feature.properties.steward_name !== undefined || feature.contact_name !== undefined) {
    treeString += "<p>Steward Name <strong>" + feature.contact_name + "</strong></p>";
  }

  if(feature.properties.datasource !== undefined) {
    treeString += "<p>Data Source <strong>" + feature.properties.datasource + "</strong></p>";
  }

  if(feature.properties.last_updated !== undefined) {
    treeString += "<p>Last Updated <strong>" + feature.properties.last_updated + "</strong></p>";
  }
  
  marker.feature = feature;
  markers.addMarker(marker, feature);

  // Unique hash marker id for link
  marker.setAttribute("id", "marker-" + id);
  marker.setAttribute("dataName", feature.properties.name);
  marker.setAttribute("class", "marker");
      
  //@TODO this is probably wrong
  // marker.setAttribute("href", vars.callbackPath + id);

  // Specially set value for loading data.
  marker.setAttribute("marker_id", id);

  // create an image icon
  var img = marker.appendChild(document.createElement("img"));

  if(feature.art) {
    img.setAttribute("src", feature.art );
  } else {
    img.setAttribute("src", "/images/icons/lemon_tree_icon.png");
  }

  
  // Tooltips
  $("#marker-" + id + " img").qtip({
  	content: {
      text: treeString,
  	},
  	hide: {
  		delay: 100,
  		when: { event: 'inactive' }
  	},
  	position: {
  		my: 'middle left', 
  		at: 'bottom middle',
  		adjust: {
  			x: 20,
  			y: -10
  		}
  	},
  	style: { 
  		tip: true,
  		classes: 'ui-tooltip-dark'
  	},
  	tip: {}
  });

  $('a[title]').qtip();

  // Listen for mouseover & mouseout events.
  MM.addEvent(marker, "mouseover", trees.onMarkerOver);
  MM.addEvent(marker, "mouseout", trees.onMarkerOut);
  MM.addEvent(marker, "click", trees.onMarkerClick);
}

trees.makeMarketMarker = function(feature) {

  var id = feature.properties.id;
  var marker = document.createElement("div");
 
  var markupString = '';
  markupString += "<h2>" + feature.properties.name + "</h2>";

  if(feature.properties.url !== undefined && feature.properties.url !== null ) {
    markupString += '<p><a href="' +  feature.properties.url + '">Website</a></p>';
  }
  
  marker.feature = feature;
  markers.addMarker(marker, feature);

  // Unique hash marker id for link
  marker.setAttribute("id", "marker-" + id);
  marker.setAttribute("type", "market");
  marker.setAttribute("dataName", feature.properties.title);
  marker.setAttribute("class", "marker");

  // Specially set value for loading data.
  marker.setAttribute("marker_id", id);

  // create an image icon
  var img = marker.appendChild(document.createElement("img"));

  if(feature.art) {
    img.setAttribute("src", feature.art );
  } else {
    img.setAttribute("src", "/images/icons/farmers_market.png");
  }

  $('a.add-tree').click(function(){
    var mapCenter = map.center();
    $('input#lat').val(mapCenter.lat);
    $('input#lon').val(mapCenter.lon);
  });
  
  // Tooltips
  $("#marker-" + id + " img").qtip({
	content: {
    text: markupString,
	},
	hide: {
		delay: 1500
	},
	position: {
		my: 'middle left', 
		at: 'bottom middle',
		adjust: {
			x: 20,
			y: -10
		}
	},
	style: { 
		tip: true,
		classes: 'ui-tooltip-dark'
	},
	tip: {}
  });

  $('a[title]').qtip();

  // Listen for mouseover & mouseout events.
  MM.addEvent(marker, "mouseover", trees.onMarkerOver);
  MM.addEvent(marker, "mouseout", trees.onMarkerOut);
  MM.addEvent(marker, "click", trees.onMarkerClick);
}


trees.makeZipcodeMarker = function(feature) {

  var id = feature.properties.id;
  var marker = document.createElement("div");
 
  var markupString = '';
  markupString += "<h2>Zipcode: " + feature.properties.name + "</h2>";

  markupString += "<p>Population in zipcode: " + feature.properties.zipcode_population + "</p>";
  markupString += "<p>Land area, square miles: " + feature.properties.land_area_square_miles + "</p>";
  markupString += "<p>Water area, square miles: " + feature.properties.water_area_square_miles + "</p>";
  markupString += "<p>Population Density, people per square mile: " + feature.properties.population_density_sq_mi + "</p>";

  markupString += "<p>Media House Value, 2010: " + feature.properties.median_house_price + "</p>";
  markupString += "<p>" + feature.properties.city + "</p>";

  markupString += "<p>Datasource http://city-data.com</p>";


  marker.feature = feature;
  markers.addMarker(marker, feature);

  // Unique hash marker id for link
  marker.setAttribute("id", "marker-" + id);
  marker.setAttribute("type", "market");
  marker.setAttribute("dataName", feature.properties.title);
  marker.setAttribute("class", "marker");

  // Specially set value for loading data.
  marker.setAttribute("marker_id", id);

  // create an image icon
  var img = marker.appendChild(document.createElement("img"));

  if(feature.art) {
    img.setAttribute("src", feature.art );
  } else {
    img.setAttribute("src", "/images/icons/information-icon.png");
  }

  // Tooltips
  $("#marker-" + id + " img").qtip({
	content: {
    text: markupString,
	},
	hide: {
		delay: 1500
	},
	position: {
		my: 'middle left', 
		at: 'bottom middle',
		adjust: {
			x: 20,
			y: -10
		}
	},
	style: { 
		tip: true,
		classes: 'ui-tooltip-dark'
	},
	tip: {}
  });

  $('a[title]').qtip();

  // Listen for mouseover & mouseout events.
  MM.addEvent(marker, "mouseover", trees.onMarkerOver);
  MM.addEvent(marker, "mouseout", trees.onMarkerOut);
  MM.addEvent(marker, "click", trees.onMarkerClick);
}


trees.paintTreeMarkers = function(features) {
  features = features.features;
  var len = features.length; 
  console.log("trees::paintTreeMarkers showing markers " + len );
  for (var i = 0; i < len; i++) {
    var feature = features[i];
    trees.makeTreeMarker(feature);
  }
};

trees.paintMarketMarkers = function(features) {
  features = features.features;
  var len = features.length; 
  console.log("trees::paintMarketMarkers showing markers " + len );
  for (var i = 0; i < len; i++) {
    var feature = features[i];
    trees.makeMarketMarker(feature);
  }
};

trees.paintZipcodeMarkers = function(features) {
  features = features.features;
  var len = features.length; 
  console.log("trees::paintZipcodeMarkers showing markers " + len );
  for (var i = 0; i < len; i++) {
    var feature = features[i];
    trees.makeZipcodeMarker(feature);
  }
};

trees.repaint_agent = function(agent) {

  // ignore elements that do not have an id
  var id = agent._id;
  if(!id) continue;

  // ignore agents that are on map already
  // later we want to carefully prune them off if off screen @TODO
  if(map_features[id]) continue;

  // ignore features with no location
  // @TODO later carefully remove features without location if had location before 
  var lat = agent.lat;
  var lon = agent.lon;
  if(!lat || !lon) continue;
 
  var title = agent.title;
  if(!title) title = "Lemon Tree";

  var art = agent.art;
  if(!art) art = "/images/icons/lemon_tree_icon.png";

  // console.log("repainting agent " + id + " " + lat + " " + lon + " " + title );

  var feature = {
    "id":id,
    "type":"Feature",
    "art":art,
    "geometry": { "type":"Point", "coordinates": [lon,lat] },
    "properties": {
      "longitude" : lat,
      "latitude" : lon,
      "title" : title,
      "id" :  "102"
    }
  };

  map_features[id] = feature;
  trees.makeTreeMarker(feature);
}

trees.repaint = function(agents) {
  if(!map) return;
  console.log("trees:: repainting anything on map and pruning non visible items from map");
  for(var key in agents) {
    trees.repaint_agent(agents[key]);
  }
}

trees.getMarker = function(marker) {
  while (marker && marker.className != "marker") {
    marker = marker.parentNode;
  }
  return marker;
};

trees.onMarkerOver = function(e) {
  var marker = trees.getMarker(e.target);
  if (marker) {
    var marker_id = $(this).attr('marker_id');
    var layer = $(marker).attr("parent");
    // $('div.marker').css({ 'opacity' : 0.4 }); 
    // make something pretty now!
  }
};

trees.onMarkerOut = function(e) {
  var marker = trees.getMarker(e.target);
  var layer = $(marker).attr("parent");
  if (marker) {
    // var type = marker.type; 
    // $('div.marker').css({ 'opacity' : 1 }); 
  }
  return false;
};

trees.onMarkerClick = function(e) {
  var marker = e.target.offsetParent;
  // trees.popupMarker(marker);
  var marker = trees.getMarker(e.target);
  if (marker) {
    $('div#panel-container div#panel .content').show();
    console.log(marker);
    // make something pretty
  }
  return false;
};
