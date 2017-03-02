/**
 * ConstellationProvider module
 *
 * Specific constellation catalogue provider from VizieR database
 * @see http://vizier.cfa.harvard.edu/viz-bin/ftp-index?VI/49
 *
 */
define(["jquery", "./AbstractProvider", "../Layer/LayerManager", "../Renderer/FeatureStyle", "../Utils/Utils"],
    function ($, AbstractProvider, LayerManager, FeatureStyle, Utils) {

        /**************************************************************************************************************/

        var mizarLayer;
        var namesFile;
        var catalogueFile;

        var constellations = {};
        var self;

        /**
         *    Extract information in "constellation" variables
         */
        function extractDatabase() {
            var constellationNamesTab = namesFile.split("\n");
            var catalogueTab = catalogueFile.split("\n");

            // For each constellation point
            for (var i = 0; i < catalogueTab.length; i++) {
                var word = catalogueTab[i].replace("  ", " ");
                word = word.split(" "); // word = "RA Decl Abbreviation "I"/"O"(Inerpolated/Original(Corner))"
                var RA = parseFloat(word[0]);
                var Decl = parseFloat(word[1]);
                var currentAbb = word[2];
                var IO = word[3];

                // Convert hours to degrees
                RA *= 15;

                // If abbreviation doesn't exist
                if (!constellations[currentAbb]) {
                    // Find constellation name
                    for (var j = 0; j < constellationNamesTab.length; j++) {
                        word = constellationNamesTab[j].split(";"); // word[0] = abbreviation, word[1] = name;
                        var abb = word[0];

                        if (abb === currentAbb) {
                            var name = word[1];

                            // Add new constellation as a property
                            constellations[currentAbb] = {
                                coord: [],
                                name: name,

                                // Values used to calculate the position of the center of constellation
                                x: 0.0,
                                y: 0.0,
                                z: 0.0,
                                nbStars: 0
                            };
                            break;
                        }
                    }
                }

                // Convert to default coordinate system
                var posGeo = [RA, Decl];

                // Calculate the center of constillation
                var pos3d = [];
                // Need to convert to 3D because of 0h -> 24h notation
                mizarLayer.planet.coordinateSystem.fromGeoTo3D(posGeo, pos3d);
                constellations[currentAbb].x += pos3d[0];
                constellations[currentAbb].y += pos3d[1];
                constellations[currentAbb].z += pos3d[2];
                constellations[currentAbb].nbStars++;

                constellations[currentAbb].coord.push(posGeo);
            }
        }

        /*
         * 	Failure function
         */
        function failure() {
            console.error("Failed to load files");
        }

        /**************************************************************************************************************/

        /**
         * @name ConstellationProvider
         * @class
         *   ConstellationProvider context constructor
         * @param {object} options
         * @augments AbstractProvider
         * @constructor
         */
        var ConstellationProvider = function (options) {
            AbstractProvider.prototype.constructor.call(this, options);
            self = this;
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractProvider, ConstellationProvider);

        /**************************************************************************************************************/

        /**
         * Asynchronous request to load constellation data
         * @function loadFiles
         * @memberof ConstellationProvider.prototype
         * @param layer Mizar layer
         * @param configuration Configuration options
         *        <ul>
         *            <li>nameUrl : Url providing the constellations name data(necessary option)</li>
         *            <li>catalogueUrl : Url providing all information about each constellation(necessary option)</li>
         *        </ul>
         * @see http://vizier.cfa.harvard.edu/viz-bin/ftp-index?VI/49
         */
        ConstellationProvider.prototype.loadFiles = function (layer, configuration) {
            mizarLayer = layer;
            if (configuration.nameUrl && configuration.catalogueUrl) {
                // loadFiles( configuration.nameUrl, configuration.catalogueUrl );
                var nameRequest = {
                    type: "GET",
                    url: configuration.nameUrl,
                    success: function (response) {
                        namesFile = response;
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        console.error(xhr.responseText);
                    }
                };

                var catalogueRequest = {
                    type: "GET",
                    url: configuration.catalogueUrl,
                    success: function (response) {
                        catalogueFile = response;
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        console.error(xhr.responseText);
                    }
                };

                // Synchronizing two asynchronious requests with the same callback
                $.when($.ajax(nameRequest), $.ajax(catalogueRequest))
                    .then(function () {
                        extractDatabase();
                        self.handleFeatures(mizarLayer);
                    }, failure);
            }
            else {
                console.error("Not valid options");
                return false;
            }
        };

        /**************************************************************************************************************/

        /**
         * Create geoJson features
         * @function handleFeatures
         * @memberof ConstellationProvider.prototype
         */
        ConstellationProvider.prototype.handleFeatures = function () {

            var constellationNamesFeatures = [];
            var constellationShapesFeatures = [];

            // Fill constellationShapes & constellationNames
            for (var i in constellations) {
                var current = constellations[i];

                // Close the polygon
                current.coord.push(current.coord[0]);

                var constellationShape = {
                    geometry: {
                        type: "Polygon",
                        gid: "constellationShape_" + current.name,
                        coordinates: [current.coord]
                    },
                    properties: {
                        name: current.name
                    }
                };

                constellationShapesFeatures.push(constellationShape);

                // Compute mean value to show the constellation name in the center of constellation..
                // .. sometimes out of constellation's perimeter because of the awkward constellation's shape(ex. "Hydra" or "Draco" constellations)
                var geoPos = [];
                mizarLayer.planet.coordinateSystem.from3DToGeo([current.x / current.nbStars, current.y / current.nbStars, current.z / current.nbStars], geoPos);

                var constellationName = {
                    geometry: {
                        type: "Point",
                        gid: "constellationName_" + current.name,
                        coordinates: [geoPos[0], geoPos[1]]
                    },
                    properties: {
                        name: current.name,
                        style: new FeatureStyle({
                            textColor: '#083BA8',
                            fillColor: [1.0, 1.0, 1.0, 1.0],
                            label: current.name
                        })
                    }
                };
                constellationNamesFeatures.push(constellationName);
            }

            // Create feature collections
            var constellationShapesFeatureCollection = {
                type: "FeatureCollection",
                features: constellationShapesFeatures
            };
            var constellationNameFeatureCollection = {
                type: "FeatureCollection",
                features: constellationNamesFeatures
            };

            // Add shapes&names to the layer
            mizarLayer.addFeatureCollection(constellationShapesFeatureCollection);
            mizarLayer.addFeatureCollection(constellationNameFeatureCollection);
        }

        /**************************************************************************************************************/

        return ConstellationProvider;

    });
