/**
 * Utility module : contains various functions useful for differnt modules
 */
define(["wcs", "underscore-min", "../Layer/OpenSearchLayer", "../Layer/HipsFitsLayer", "../Layer/HipsLayer", "../Layer/PlanetLayer", "../Layer/VectorLayer", "../Layer/MocLayer"],
    function (wcs, _, OpenSearchLayer, HipsFitsLayer, HipsLayer, PlanetLayer, VectorLayer, MocLayer) {

      /**
       @name ToolBox
       @class
       ToolBox
      */
      var ToolBox = function (parentElement,options) {
        this.parentElement = parentElement;
        if (options.votable2geojson) {
          this.votable2geojsonUrl = options.votable2geojson.baseUrl;
        }
      };

        /**
         *    HSV values in [0..1[
         *    returns [r, g, b] values from 0 to 255
         */
      ToolBox.prototype.hsv_to_rgb = function (h, s, v) {
            var h_i = Math.floor(h * 6);
            var f = h * 6 - h_i;
            var p = v * (1 - s);
            var q = v * (1 - f * s);
            var t = v * (1 - (1 - f) * s);
            var r;
            var g;
            var b;
            switch (h_i) {
                case 0:
                    r = v;
                    g = t;
                    b = p;
                    break;
                case 1:
                    r = q;
                    g = v;
                    b = p;
                    break;
                case 2:
                    r = p;
                    g = v;
                    b = t;
                    break;
                case 3:
                    r = p;
                    g = q;
                    b = v;
                    break;
                case 4:
                    r = t;
                    g = p;
                    b = v;
                    break;
                case 5:
                    r = v;
                    g = p;
                    b = q;
                    break;
                default:
                    r = 1;
                    g = 1;
                    b = 1;
            }
            return [r, g, b];
        };

        /**
         *    Create geographic coordinate from x,y image pixel using WCS
         */
        ToolBox.prototype.createCoordinate = function(x, y) {
          var coordinate = wcs.pixelToCoordinate([x, y]);
          // Convert to geographic representation
          if (coordinate.ra > 180) {
              coordinate.ra -= 360;
          }
          return [coordinate.ra, coordinate.dec];
        }

        ToolBox.prototype.roundNumber = function (num, dec) {
          return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
        };

        /**
         *    Generate eye-friendly color based on hsv
         */
        ToolBox.prototype.generateColor = function () {
          //use golden ratio
          var golden_ratio_conjugate = 0.618033988749895;
          var h = Math.random();
          h += golden_ratio_conjugate;
          h %= 1;
          return hsv_to_rgb(h, 0.5, 0.95);
        };

        /**
        *    Format coordinates according to default coordinate system
        */
        ToolBox.prototype.formatCoordinates = function (geo) {
          var astro = [];
          switch (this.parentElement.context) {
              case "Planet":
                  astro[0] = this.roundNumber(geo[0], 3);
                  astro[0] += "&deg;";
                  astro[1] = this.roundNumber(geo[1], 3);
                  astro[1] += "&deg;";
                  break;
              case "Sky":
                if (this.parentElement.scene.coordinateSystem.type === "EQ") {
                  this.parentElement.scene.coordinateSystem.fromGeoToEquatorial([geo[0], geo[1]], astro);
                } else {
                  geo = this.parentElement.scene.coordinateSystem.convert(geo, 'EQ', this.parentElement.scene.coordinateSystem.type);
                  astro[0] = this.roundNumber(geo[0], 4);
                  astro[0] += "&deg;";
                  astro[1] = this.roundNumber(geo[1], 4);
                  astro[1] += "&deg;";
                }
                break;
              default:
                console.error("This mode " + this.parentElement.mode + " is not supported");
          }
          return astro;
        };

        /**
         *    Format the given feature identifier to remove special caracters(as ?, [, ], ., etc..) which cannot be used as HTML id's
         */
        ToolBox.prototype.formatId = function (id) {
          return id.replace(/\s{1,}|\.{1,}|\[{1,}|\]{1,}|\({1,}|\){1,}|\~{1,}|\+{1,}|\°{1,}|\-{1,}|\'{1,}|\"{1,}/g, "");
        };

        /**
         *    Get GeoJson polygon coordinates representing fits using wcs data from header
         */
        ToolBox.prototype.getPolygonCoordinatesFromFits = function (fits) {
          var hdu = fits.getHDU();
          var fitsData = hdu.data;

          // Create mapper
          wcs = new WCS.Mapper(hdu.header);
          var coords = [];

          // Find coordinates of coming fits
          coords.push(createCoordinate(0, fitsData.height));
          coords.push(createCoordinate(fitsData.width, fitsData.height));
          coords.push(createCoordinate(fitsData.width, 0));
          coords.push(createCoordinate(0, 0));
          // Close the polygon
          coords.push(coords[0]);
          return coords;
        };

        /**
         *    Compute barycenter of the given GeoJSON geometry
         */
        ToolBox.prototype.computeGeometryBarycenter = function (geometry) {
                var sLonBarycenter;
                var sLatBarycenter;
                var sLon = 0;
                var sLat = 0;
                var nbPoints = 0;
                var i,j;
                switch (geometry.type) {
                    case "MultiLineString":
                        sLonBarycenter = geometry.coordinates[0][0][0];
                        sLatBarycenter = geometry.coordinates[0][0][1];
                        break;
                    case "LineString":
                        sLonBarycenter = geometry.coordinates[0][0];
                        sLatBarycenter = geometry.coordinates[0][1];
                        break;
                    case "Point":
                        sLonBarycenter = geometry.coordinates[0];
                        sLatBarycenter = geometry.coordinates[1];
                        break;
                    case "Polygon":
                        for (i = 0; i < geometry.coordinates[0].length - 1; i++) {
                            sLon += geometry.coordinates[0][i][0];
                            sLat += geometry.coordinates[0][i][1];
                            nbPoints++;
                        }
                        sLonBarycenter = sLon / nbPoints;
                        sLatBarycenter = sLat / nbPoints;
                        break;
                    case "MultiPolygon":
                        for (i = 0; i < geometry.coordinates.length; i++) {
                            var polygon = geometry.coordinates[i][0];
                            for (j = 0; j < polygon.length - 1; j++) {
                                sLon += polygon[j][0];
                                sLat += polygon[j][1];
                                nbPoints++;
                            }
                        }
                        sLonBarycenter = sLon / nbPoints;
                        sLatBarycenter = sLat / nbPoints;
                        break;
                    case "LineString":
                        //TODO check avec JCM
                        _.each(geometry.coordinates, function (value, i) {
                            sLon += value[0];
                            sLat += value[1];
                            nbPoints++;
                        });
                        sLonBarycenter = sLon / nbPoints;
                        sLatBarycenter = sLat / nbPoints;
                        break;
                    default:
                        return;
                }

                return [sLonBarycenter, sLatBarycenter];
            };

            /**
             *    Determine if a point lies inside a polygon
             *
             *    @param {Float[]} point Point in geographic coordinates
             *    @param {Float[][]} ring Array of points representing the polygon
             */
            ToolBox.prototype.pointInRing = function (point, ring) {
                var nvert = ring.length;
                if (ring[0][0] === ring[nvert - 1][0] && ring[0][1] === ring[nvert - 1][1]) {
                    nvert--;
                }
                var inPoly = false;
                var j = nvert - 1;
                for (var i = 0; i < nvert; j = i++) {
                    if (((ring[i][1] > point[1]) !== (ring[j][1] > point[1])) &&
                        (point[0] < (ring[j][0] - ring[i][0]) * (point[1] - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0])) {
                        inPoly = !inPoly;
                    }
                }
                return inPoly;
            };

            /**
             *    Determine if a point lies inside a sphere of radius depending on viewport
             */
            ToolBox.prototype.pointInSphere = function (point, sphere, pointTextureHeight) {
                var point3D = [];
                var sphere3D = [];

                // Compute pixel size vector to offset the points from the earth
                var pixelSizeVector = this.parentElement.scene.renderContext.computePixelSizeVector();

                this.parentElement.scene.coordinateSystem.fromGeoTo3D(point, point3D);
                this.parentElement.scene.coordinateSystem.fromGeoTo3D(sphere, sphere3D);

                var radius = pointTextureHeight * (pixelSizeVector[0] * sphere3D[0] + pixelSizeVector[1] * sphere3D[1] + pixelSizeVector[2] * sphere3D[2] + pixelSizeVector[3]);

                //Calculate the squared distance from the point to the center of the sphere
                var vecDist = [];
                vec3.subtract(point3D, sphere3D, vecDist);
                vecDist = vec3.dot(vecDist, vecDist);

                //Calculate if the squared distance between the sphere's center and the point
                //is less than the squared radius of the sphere
                if (vecDist < radius * radius) {
                    return true;
                }

                //If not, return false
                return false;
            };

            /**
             * Check if a point lies on a line
             * @param point
             * @param segmentStart
             * @param segmentEnd
             * @returns {boolean}
             */
            ToolBox.prototype.pointInLine = function (point, segmentStart, segmentEnd) {
                var deltax = segmentEnd[0] - segmentStart[0];
                var deltay, t;
                var liesInXDir = false;

                if (deltax === 0) {
                    liesInXDir = (point[0] === segmentStart[0]);
                } else {
                    t = (point[0] - segmentStart[0]) / deltax;
                    liesInXDir = (t >= 0 && t <= 1);
                }

                if (liesInXDir) {
                    deltay = segmentEnd[1] - segmentStart[1];
                    if (deltax === 0) {
                        return (point[1] === segmentStart[1]);
                    } else {
                        t = (point[1] - segmentStart[1]) / deltay;
                        return (t >= 0 && t <= 1);
                    }
                } else {
                    return false;
                }
            };

            ToolBox.prototype.getAstroCoordinatesFromCursorLocation = function (globe, navigation, LHV) {
                // Find angle between eye and north
                var geoEye = [];
                globe.coordinateSystem.from3DToGeo(navigation.center3d, geoEye);

                if (_.isEmpty(LHV)) {
                    LHV = [];
                }

                globe.coordinateSystem.getLHVTransform(geoEye, LHV);

                return this.formatCoordinates([geoEye[0], geoEye[1]]);
            };

            /**
             * Get coordinates from cursor position.
             * @param event
             * @param globe
             * @returns parameter
             */
            ToolBox.prototype.getHEALPixCutCoordinates = function (event, globe, navigation) {
                // Find RA/Dec of each corner of viewport
                var coords = [[0, 0], [globe.renderContext.canvas.width, 0], [globe.renderContext.canvas.width, globe.renderContext.canvas.height], [0, globe.renderContext.canvas.height]];
                for (var i = 0; i < coords.length; i++) {
                    var geo = globe.getLonLatFromPixel(coords[i][0], coords[i][1]);
                    // Convert to RA/Dec
                    if (geo[0] < 0) {
                        geo[0] += 360;
                    }
                    coords[i] = geo;
                }

                // Find angle between eye and north
                //var geoEye = [];
                //globe.coordinateSystem.from3DToGeo(navigation.center3d, geoEye);
                //
                var LHV = [];
                //globe.coordinateSystem.getLHVTransform(geoEye, LHV);
                //
                //var astro = Utils.formatCoordinates([geoEye[0], geoEye[1]]);

                this.getAstroCoordinatesFromCursorLocation(globe, navigation, LHV);

                var north = [LHV[4], LHV[5], LHV[6]];
                var cosNorth = vec3.dot(navigation.up, north);
                var radNorth = Math.acos(cosNorth);
                if (isNaN(radNorth)) {
                    console.error("North is NaN'ed...");
                    return;
                }
                var degNorth = radNorth * 180 / Math.PI;

                // Depending on z component of east vector find if angle is positive or negative
                if (globe.renderContext.viewMatrix[8] < 0) {
                    degNorth *= -1;
                }

                var cdelt1 = parseFloat($('#cdelt1').val());
                var cdelt2 = parseFloat($('#cdelt2').val());

                // Get choosen layer
                var healpixLayer = globe.baseImagery;

                if (!context.fileName) {
                    ErrorDialog.open("FITS fileName isn't defined for HealpixCut service<br/>");
                }

                if (isNaN(cdelt1) || isNaN(cdelt2)) {
                    $('#HEALPixCut').find('input').each(function () {
                        if (!$(this).val()) {
                            $(this).addClass('inputError');
                        }
                    });
                    return;
                }

                return {
                    long1: coords[0][0],
                    lat1: coords[0][1],
                    long2: coords[1][0],
                    lat2: coords[1][1],
                    long3: coords[2][0],
                    lat3: coords[2][1],
                    long4: coords[3][0],
                    lat4: coords[3][1],
                    rotation: degNorth,
                    coordSystem: "EQUATORIAL",
                    cdelt1: cdelt1,
                    cdelt2: cdelt2,
                    filename: context.fileName,
                    PHASE: "RUN"
                };
            };

            /**
             * Get mouse position on canvas
             * @param {HTMLElement} canvas
             * @param {Event} evt
             * @returns {{x: number, y: number}}
             */
            ToolBox.prototype._getMousePos = function (canvas, evt) {
                var rect = canvas.getBoundingClientRect();
                return {
                    x: evt.clientX - rect.left,
                    y: evt.clientY - rect.top
                };
            };

            // Functions used by Mizar_Gui to avoid direct dependencies to GlobWeb

            ToolBox.prototype.isHipsFitsLayer = function (obj) {
                return (obj instanceof HipsFitsLayer);
            };
            ToolBox.prototype.isHipsLayer = function (obj) {
                return (obj instanceof HipsLayer);
            };
            ToolBox.prototype.isOpenSearchLayer = function (obj) {
                return (obj instanceof OpenSearchLayer);
            };
            ToolBox.prototype.isVectorLayer = function (obj) {
                return (obj instanceof VectorLayer);
            };
            ToolBox.prototype.isMocLayer = function (obj) {
                return (obj instanceof MocLayer);
            };
            ToolBox.prototype.isPlanetLayer = function (obj) {
                return (obj instanceof PlanetLayer);
            };

            /**
             * Convert votable to json from url
             * @param {String} url
             * @param {Function} callback
             */
            ToolBox.prototype.convertVotable2JsonFromURL = function (url, callback) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url);
                //self = this;
                xhr.onload = function () {
                    var xml = xhr.responseXML;
                    if (xml) {
                        this.convertVotable2JsonFromXML(xhr.responseText, callback);
                    } else {
                        console.log("No XML response");
                    }
                };
                xhr.onerror = function (err) {
                    console.log("Error getting table " + url + "\n" + "(" + err
                        + ")");
                };
                xhr.send(null);
            };

            /**************************************************************************************************************/

            /**
             * Convert votable to json from xml
             * @param {Object} xml xml votable
             * @param {Function} callback
             */
            ToolBox.prototype.convertVotable2JsonFromXML = function (xml, callback) {
                try {
                    // Send response of xml to SiTools2 to convert it to GeoJSON
                    $.ajax({
                        type: "POST",
                        url: votable2geojsonUrl,
                        data: {
                            votable: xml,
                            coordSystem: "EQUATORIAL"
                        },
                        success: function (response) {
                            callback(response);
                        },
                        error: function (thrownError) {
                            console.error(thrownError);
                        }
                    });
                } catch (e) {
                    console.log("Error displaying table:\n" + e.toString());
                }
            };

        return ToolBox;
});
