/*global define: false */

/**
 *    JSON processor module
 *
 *    Module processing feature collection
 *
 */
define(["../Layer/HipsLayer"], function (HipsLayer) {
    var gid = 0;

    /**
     *    Handle services of feature
     */
    function handleServices(gwLayer, feature) {
      console.log("hop",gwLayer);
        for (var x in feature.services) {
            var service = feature.services[x];
            if (!gwLayer.subLayers) {
                gwLayer.subLayers = [];
            }
            switch (service.type) {
                case "healpix":
                    service.layer = new HipsLayer({
                        format: service.format,
                        baseUrl: service.url,
                        name: service.name,
                        visible: false,
                        coordinates: feature.geometry.coordinates[0]
                    });
                    gwLayer.subLayers.push(service.layer);
                    if (gwLayer.planet && gwLayer.visible()) {
                        // Add sublayer to engine
                        gwLayer.planet.addLayer(service.layer);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    return {
        /**
         *    Handles feature collection
         *    Recompute geometry from equatorial coordinates to geo for each feature
         *    Handle feature services
         *    Add gid
         *
         *    @param gwLayer Layer of feature
         *    @param featureCollection GeoJSON FeatureCollection
         *
         */
        handleFeatureCollection: function (gwLayer, featureCollection) {
            if ((featureCollection === null) || (featureCollection === undefined)){
              console.log("Error, featureCollection is null");
              return;
            }
            var features = featureCollection.features;
            if ((features === null) || (features === undefined)) {
              console.log("Erro, not feature in featureCollection : ",featureCollection);
              return;
            }
            var i,j,r;

            for (i = 0; i < features.length; i++) {
                var currentFeature = features[i];

                var coordSystem = "EQ"; // default coordinate system of json data
                // Apply crs if defined
                if (currentFeature.properties.crs) {
                    var crsName = currentFeature.properties.crs.properties.name;
                    coordSystem = crsName.substr(0, crsName.indexOf('.'));
                    if (coordSystem.length > 3) {
                        switch (coordSystem.toLowerCase()) {
                            case "equatorial":
                                coordSystem = "EQ";
                                break;
                            case "galactic":
                                coordSystem = "GAL";
                                break;
                            default:
                                console.log("Not implemented");
                                break;
                        }
                    }
                }
                switch (currentFeature.geometry.type) {
                    case "Point":
                        if (!gwLayer.dataType) {
                            gwLayer.dataType = "point";
                        } else {
                          if (gwLayer.dataType !== 'point') {
                            gwLayer.dataType = "none";
                          }
                        }

                        // Convert to EQUATORIAL coordinate system if needed
                        if ('EQ' !== coordSystem) {
                            currentFeature.geometry.coordinates = gwLayer.planet.coordinateSystem.convert(currentFeature.geometry.coordinates, coordSystem, 'EQ');
                        }

                        // Convert to geographic representation
                        if (currentFeature.geometry.coordinates[0] > 180) {
                            currentFeature.geometry.coordinates[0] -= 360;
                        }
                        break;
                    case "Polygon":
                    case "MultiPolygon":

                        if (!gwLayer.dataType) {
                            gwLayer.dataType = "line";
                        } else {
                          if (gwLayer.dataType !== 'line') {
                            gwLayer.dataType = "none";
                          }
                        }

                        var rings = [];
                        var geometry = currentFeature.geometry;
                        if (geometry.type === 'MultiPolygon') {
                            for (j = 0; j < geometry.coordinates.length; j++) {
                                rings.push(geometry.coordinates[j][0]);
                            }
                        }
                        else {
                            rings.push(geometry.coordinates[0]);
                        }

                        for (r = 0; r < rings.length; r++) {
                            var coords = rings[r];
                            var numPoints = coords.length;
                            for (j = 0; j < numPoints; j++) {
                                // Convert to default coordinate system if needed
                                if ('EQ' !== coordSystem) {
                                    coords[j] = gwLayer.planet.coordinateSystem.convert(coords[j], coordSystem, 'EQ');
                                }

                                // Convert to geographic representation
                                if (coords[j][0] > 180) {
                                    coords[j][0] -= 360;
                                }
                            }
                        }

                        if (currentFeature.properties._imageCoordinates) {
                            // Set _imageCoordinates as geometry's property (may be modified later)
                            for (r = 0; r < currentFeature.properties._imageCoordinates[0].length; r++) {
                                // Convert to geographic representation
                                if (currentFeature.properties._imageCoordinates[0][r][0] > 180) {
                                    currentFeature.properties._imageCoordinates[0][r][0] -= 360;
                                }

                            }
                            currentFeature.geometry._imageCoordinates = currentFeature.properties._imageCoordinates;
                        }

                        break;
                    default:
                        break;
                }
                currentFeature.geometry.gid = "jsonProc_" + gid;
                gid++;

                if (currentFeature.services) {
                    handleServices(gwLayer, currentFeature);
                }

            }
        }
    };

});
