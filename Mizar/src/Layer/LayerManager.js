/**
 * LayerManager module
 */
define(["jquery", "underscore-min","./LayerFactory","../DrawingFactory",
        "../Gui/PickingManagerCore", "../Utils/Utils","../Utils/UtilsCore", "../Parser/JsonProcessor", "../Utils/Constants"],
    function ($, _, LayerFactory, DrawingFactory,
              PickingManagerCore, Utils,UtilsCore, JsonProcessor, Constants) {

        /**
         * Private variables
         */
        var sky;
        var mizarLayers = [];
        var planetLayers = [];
        var configuration;

        // GeoJSON data providers
        var dataProviders = {};
        var mizarCore;

        var drawingFactory = new DrawingFactory();
        var layerFactory = new LayerFactory();

        var coreAPI;

        /**
         * Private functions
         */

        /**************************************************************************************************************/

        /**************************************************************************************************************/

        /**
         * Get service url from HIPS Layer
         * @function getHipsServiceUrlArray
         * @param hipsLayer
         * @returns {Array}
         */
        function getHipsServiceUrlArray(hipsLayer) {
            var hipsServiceUrlArray = [];

            if(hipsLayer.hips_service_url) {
                hipsServiceUrlArray.push(hipsLayer.hips_service_url);
            }
            if(hipsLayer.hips_service_url_1) {
                hipsServiceUrlArray.push(hipsLayer.hips_service_url_1);
            }
            if(hipsLayer.hips_service_url_2) {
                hipsServiceUrlArray.push(hipsLayer.hips_service_url_2);
            }
            return hipsServiceUrlArray;
        }

        /**************************************************************************************************************/

        /**
         * Add HIPS Layer to Mizar
         *
         * @param hipsLayer
         * @param hipsServiceUrl
         */
        function addHIPSLayer(hipsLayer, hipsServiceUrl) {
            var imageFormat;
            if(hipsLayer.hips_tile_format) {
                 imageFormat = (hipsLayer.hips_tile_format.match("png")) ? "png" : "jpg";
            } else {
                console.log("No hips_tile_format defined for layer  : " + hipsLayer.obs_title );
                imageFormat = "png";
            }
            var coordSystem;
            console.log(hipsLayer.obs_collection + " ==> "+hipsLayer.hips_frame);
            if (hipsLayer.hips_frame === "equatorial") {
                coordSystem = "EQ";
            }
            else if (hipsLayer.hips_frame === "galactic") {
                coordSystem = "GAL";
            }

            // Skipping no public layers
            if (hipsLayer.hasOwnProperty("hips_status") && !hipsLayer.hips_status.match('public') === null) {
                return;
            }

            var layerToAdd = {
                category: "Image",
                type: "hips",
                name: (_.isArray(hipsLayer.obs_collection) ? hipsLayer.obs_collection[0] : hipsLayer.obs_collection),
                description: hipsLayer.obs_description,
                baseUrl: hipsServiceUrl,
                numberOfLevels: hipsLayer.hips_order,
                copyright: hipsLayer.obs_copyright,
                attribution: hipsLayer.obs_copyright,
                copyrightUrl: hipsLayer.obs_copyright_url,
                ack: hipsLayer.obs_ack,
                serviceUrl: hipsLayer.moc_access_url,
                format: imageFormat,
                coordSystem : coordSystem,
                background: false,
                visible: false,
                properties : {
                    initialRa : hipsLayer.hasOwnProperty("obs_initial_ra")? parseFloat(hipsLayer.obs_initial_ra) : undefined,
                    initialDec : hipsLayer.hasOwnProperty("obs_initial_dec")? parseFloat(hipsLayer.obs_initial_dec) : undefined,
                    initialFov : hipsLayer.hasOwnProperty("obs_initial_fov")? parseFloat(hipsLayer.obs_initial_fov) : undefined,
                    mocCoverage : hipsLayer.hasOwnProperty("moc_sky_fraction")? hipsLayer.moc_sky_fraction : undefined
                }
            };

            if(hipsLayer.hasOwnProperty("moc_access_url")){
                layerToAdd.availableServices = ["Moc"];
            }

            var healpixLayer = mizarCore.addLayer(layerToAdd);

            if(hipsLayer.hasOwnProperty("moc_access_url")) {
                healpixLayer.serviceUrl = hipsLayer.moc_access_url;
            }
        }

        /**************************************************************************************************************/

        /**
         * Execute when layer visibility is changed
         * @function onVisibilityChange
         * @param {Layer} layer
         */
        function onVisibilityChange(layer) {
            if(layer.getVisible() && layer.properties && layer.properties.hasOwnProperty("initialRa") && layer.properties.hasOwnProperty("initialDec") && layer.properties.hasOwnProperty("initialFov")) {
                if (mizarCore.mode === "sky") {
                    //mizar.activatedContext.navigation.zoomTo([layer.properties.initialRa, layer.properties.initialDec], layer.properties.initialFov, 3000);
                    var fov = mizarCore.activatedContext.navigation.renderContext.fov;
                    mizarCore.activatedContext.navigation.zoomTo([layer.properties.initialRa, layer.properties.initialDec], fov, 3000);
                }
                else {
                    mizarCore.activatedContext.navigation.zoomTo([layer.properties.initialRa, layer.properties.initialDec], layer.properties.initialFov, 3000, null);
                }
            }
        }

        /**
         * Create simple vector layer
         * @function createSimpleLayer
         * @param {String} name
         * @returns {Layer} layer
         */
        function createSimpleLayer(name) {
            // Generate random color
            var rgb = UtilsCore.generateColor();
            var rgba = rgb.concat([1]);

            // Create style
            var options = {
                name: name,
                id: _.uniqueId(name + '_'),
                style: drawingFactory.createFeatureStyle({
                    iconUrl: configuration.mizarBaseUrl + "../css/images/star.png",
                    fillColor: rgba,
                    strokeColor: rgba,
                    visible: true
                })
            };

            // Create vector layer
            var mizarLayer = layerFactory.createVector(options);
            // Add the type GeoJSON to be able to zoom on the layer ! (cf HTML generation of additional layer)
            mizarLayer.type = "GeoJSON";
            mizarLayer.deletable = true;
            mizarLayer.pickable = true;

            return mizarLayer;
        }

        /**************************************************************************************************************/

        /**
         * Create layer from configuration file
         * @function createLayerFromConf
         * @param {Object} layerDesc
         * @returns {Layer} layer
         */
        function createLayerFromConf(layerDesc) {
            var mizarLayer;

            // Ensure that the attribution link will be opened in new tab
            if (layerDesc.attribution && layerDesc.attribution.search('<a') >= 0 && layerDesc.attribution.search('target=') < 0) {
                layerDesc.attribution = layerDesc.attribution.replace(' ', ' target=_blank ');
            }

            // Update layer color
            if (layerDesc.color) {
                layerDesc.color = drawingFactory.fromStringToColor(layerDesc.color);
            }
            else {
                // Generate random color
                var rgb = UtilsCore.generateColor();
                layerDesc.color = rgb.concat([1]);
            }

            // Layer opacity must be in range [0, 1]
            if (layerDesc.opacity) {
                layerDesc.opacity /= 100;
            }
            // Layers are not visible by default
            if (!layerDesc.visible) {
                layerDesc.visible = false;
            }

            // Create style if needed
            if (!layerDesc.style) {
                layerDesc.style = drawingFactory.createFeatureStyle({
                    rendererHint: "Basic",
                    opacity: layerDesc.opacity,
                    iconUrl: layerDesc.icon ? layerDesc.icon : configuration.mizarBaseUrl + "css/images/star.png",
                    fillColor: layerDesc.color,
                    strokeColor: layerDesc.color
                });
            }

            // Depending on type of layer, create layer
            switch (layerDesc.type) {
                case "atmosphere":
                    mizarLayer = layerFactory.create(Constants.LAYER.Atmosphere,layerDesc);
                    break;
                case "tileWireframe":
                    mizarLayer = layerFactory.create(Constants.LAYER.TileWireframe,layerDesc);
                    break;
                case "hips":
                    if (layerDesc.fitsSupported) {
                        mizarLayer = layerFactory.create(Constants.LAYER.HipsFits,layerDesc);
                    }
                    else {
                        mizarLayer = layerFactory.create(Constants.LAYER.Hips,layerDesc);
                    }

                    if (layerDesc.availableServices) {
                        mizarLayer.availableServices = layerDesc.availableServices;
                        mizarLayer.healpixCutFileName = layerDesc.healpixCutFileName;
                    }

                    break;

                case "coordinateGrid":
                    mizarLayer = layerFactory.create(Constants.LAYER.CoordinateGrid,layerDesc);
                    break;

                case "hipsGrid":
                    mizarLayer = layerFactory.create(Constants.LAYER.TileWireframe,layerDesc);
                    break;

                case "GeoJSON":
                    mizarLayer = layerFactory.create(Constants.LAYER.Vector,layerDesc);
                    mizarLayer.pickable = layerDesc.hasOwnProperty('pickable') ? layerDesc.pickable : true;

                    break;

                case "DynamicOpenSearch":
                    mizarLayer = layerFactory.create(Constants.LAYER.OpenSearch,layerDesc);

                    if (layerDesc.displayProperties) {
                        mizarLayer.displayProperties = layerDesc.displayProperties;
                    }
                    mizarLayer.pickable = layerDesc.hasOwnProperty('pickable') ? layerDesc.pickable : true;
                    mizarLayer.availableServices = layerDesc.availableServices;
                    break;

                case "Moc":
                    layerDesc.style.fill = true;
                    layerDesc.style.fillColor[3] = 0.3; // make transparent
                    mizarLayer = layerFactory.create(Constants.LAYER.Moc,layerDesc);
                    mizarLayer.dataType = "line";
                    break;

                case "Vector":
                    mizarLayer = createSimpleLayer(layerDesc.name);
                    mizarLayer.pickable = layerDesc.hasOwnProperty('pickable') ? layerDesc.pickable : true;
                    mizarLayer.deletable = false;
                    break;

                case "Planet":
                    mizarLayer = layerFactory.create(Constants.LAYER.Planet,layerDesc);
                    break;

                case "WMS":
                    mizarLayer = layerFactory.create(Constants.LAYER.WMS,layerDesc);
                    break;

                case "WMTS":
                    mizarLayer = layerFactory.create(Constants.LAYER.WMTS,layerDesc);
                    break;

                case "OSM":
                    mizarLayer = layerFactory.create(Constants.LAYER.OSM,layerDesc);
                    break;

                case "Bing":
                    mizarLayer = layerFactory.create(Constants.LAYER.Bing,layerDesc);
                    break;
                default:
                    console.error(layerDesc.type + " isn't not implemented");
                    return null;
            }
            mizarLayer.type = layerDesc.type;
            mizarLayer.dataType = layerDesc.dataType;
            // Store category name on GlobWeb layer object to be able to restore it later
            mizarLayer.category = layerDesc.background ? "background" : layerDesc.category;

            mizarLayer.subscribe("visibility:changed", onVisibilityChange);

            return mizarLayer;
        }

        /**************************************************************************************************************/

        /**
         * Fill the LayerManager table
         * @function initLayers
         * @param {Layer} layer
         */
        function initLayers(layers) {
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                this.addLayerFromDescription(layer);
            }
        }

        /**************************************************************************************************************/

        /**
         * Load HIPS layers from passed service url
         * @function checkHipsServiceIsAvailable
         * @param {Array} hipsServiceUrlArray HIPS service URL
         * @param {String}imageFormat HIPS format
         * @param callback
         */
        function checkHipsServiceIsAvailable(hipsServiceUrlArray, imageFormat, callback) {
            if (hipsServiceUrlArray.length === 0) {
                return callback(undefined);
            }
            var url = hipsServiceUrlArray.shift();
            $.ajax({
                type: 'GET',
                url: url+"/Norder3/Allsky."+imageFormat,
                dataType : 'text'
                //context: layerManager,
                //timeout: 10000
            }).done(function (data, status, xhr) {
                if (xhr.status === 200) {
                    return callback(url);
                }
            }).error(function () {
                checkHipsServiceIsAvailable(hipsServiceUrlArray, imageFormat, callback);
            });
        }

        /**************************************************************************************************************/

        /**
         * Load HIPS layers from passed service url
         * @function loadHIPSLayers
         * @param layerManager
         * @param {String} hipsServiceUrl
         */
        function loadHIPSLayers(layerManager, hipsServiceUrl) {
            $.ajax({
                type: 'GET',
                url: hipsServiceUrl,
                context: layerManager,
                dataType : 'json'

            }).done(function (hipsLayersJSON) {
                _.each(hipsLayersJSON, function (hipsLayer) {
                    var hipsServiceUrlArray = getHipsServiceUrlArray(hipsLayer);
                    var imageFormat = (hipsLayer.hips_tile_format.match("jpeg")) ? "jpg" : "png";
                    var hipsUrl = this.checkHipsServiceIsAvailable(hipsServiceUrlArray, imageFormat, function (hipsServiceUrl) {
                       if(hipsServiceUrl === undefined){
                           console.log("Cannot add layer " + hipsLayer.obs_title + " no mirror available");
                           return;
                       }
                        $.proxy(addHIPSLayer, layerManager)(hipsLayer, hipsServiceUrl);
                    });
                }, layerManager);
            });
        }


        /**************************************************************************************************************/

        return {
            /**
             * Initialisation of LayerManager
             * @function init
             * @param m mizarCore source Object
             * @param conf Mizar configuration
             */
            init: function (m, conf) {
                mizarCore = m;
                configuration = conf;
                // Store the sky in the global module variable
                sky = mizarCore.scene;

                PickingManagerCore.init(m);

                // TODO : Call init layers
                //initLayers(configuration.layers);
                loadHIPSLayers(this, conf.hipsServiceUrl);
            },

            /**
             * Register data provider
             * @function registerDataProvider
             * @param type Type of data
             * @param loadFunc Callback function loading and adding data to the layer
             */
            registerDataProvider: function (type, loadFunc) {
                dataProviders[type.toString()] = loadFunc;
            },

            /**
             * Get current layers
             * @function getLayers
             * @param {string} mode the current mode sky or planet
             * @return {Array} layers
             */
            getLayers: function (mode) {
                var layers = [];
                if (mode === "sky") {
                    layers = mizarLayers;
                } else if (mode === "planet") {
                    layers = this.getPlanetLayers();
                } else if (mode === "all") {
                    layers = this.getAllLayers();
                } else {
                    console.log("Unknow mode "+mode+". Correct mode are 'sky' or 'planet' ");
                    layers = mizarLayers;
                }
                return layers;
            },

            /**
             * Get current layers
             * @function getAllLayers
             * @returns {Array} layers
             */
            getAllLayers: function () {
                return _.union(mizarLayers, this.getPlanetLayers());
            },

            /**
             * Get only planet layers
             * @function getPlanetLayers
             * @returns {Array} layers
             */
            getPlanetLayers: function() {
                var layers = planetLayers;
                var planetLayer = _.filter(mizarLayers, function (layer) {
                    return (layer.isType("Planet"));
                });

                if (planetLayer && planetLayer.length > 0) {
                    for (var i = 0; i < planetLayer.length; i++) {
                        layers = _.union(layers, planetLayer[i].layers);
                    }
                }
                return layers;
            },

            /**
             * Get current layer by ID
             * @function getLayerById
             * @param layerId The layer ID
             */
            getLayerById: function (layerId) {
                _.find(_.union(this.getAllLayers()), function (layer) {
                    return (layer.layerId === layerId);
                });
            },

            /**
             * Get one or several layers having the same name
             * @function getLayerByName
             * @param layerName The layer name
             * @return an array of layers
             */
            getLayerByName: function (layerName) {
                return _.findWhere(this.getAllLayers(), {name: layerName});
            },

            /**
             * Add layer to activated planet(could be planet or sky)
             * Triggers events createion events
             * @function addLayerToPlanet
             * @param mizarLayer Mizar layer to add
             */
            addLayerToPlanet: function (mizarLayer) {
                var planet = mizarCore.activatedContext.planet;
                if (mizarLayer.category === "background") {
                    // Add to engine
                    if (mizarLayer.getVisible()) {
                        // Change visibility's of previous layer(maybe mizarLayer should do it ?)
                        if (planet.baseImagery) {
                            planet.baseImagery.setVisible(false);
                        }

                        planet.setBaseImagery(mizarLayer);
                        mizarLayer.setVisible(true);
                    }

                    // Publish the event
                    mizarCore.publish("backgroundLayer:add", mizarLayer);
                }
                else {
                    // Add to engine
                    if (!(mizarLayer.isType("Planet"))) {
                        planet.addLayer(mizarLayer);
                    }

                    // Publish the event
                    mizarCore.publish("additionalLayer:add", mizarLayer);
                }
            },

            /**
             * Add layer to planet depending on Mizar's mode
             * @function addLayer
             * @param mizarLayer Mizar layer
             * @param planetLayer Planet layer, if described layer must be added to planet (optional)
             */
            addLayer: function (mizarLayer, planetLayer) {
                if (planetLayer) {
                    // Add layer to planet
                    planetLayer.layers.push(mizarLayer);
                    if (mizarCore.mode === "planet") {
                        this.addLayerToPlanet(mizarLayer);
                    }
                }
                else {
                    // Store planet base imageries to be able to set background from name
                    if (mizarLayer.isType("Planet")) {
                        for (var i = 0; i < mizarLayer.baseImageries.length; i++) {
                            planetLayers.push(mizarLayer.baseImageries[i]);
                        }
                    }

                    // Add layer to sky
                    mizarLayers.push(mizarLayer);
                    if (mizarCore.mode === "sky") {
                        this.addLayerToPlanet(mizarLayer);
                    }
                }
            },

            /**
             * Create layer from layer description and add it engine
             * @function addLayerFromDescription
             * @param layerDesc Layer description
             * @param planetLayer Planet layer, if described layer must be added to planet (optional)
             * @return Created layer if doesn't already exist, existing layer otherwise
             */
            addLayerFromDescription: function (layerDesc, planetLayer) {
                var mizarLayer = _.findWhere(mizarLayers, {name: layerDesc.name});
                if (!mizarLayer) {

                    mizarLayer = createLayerFromConf(layerDesc);
                    if (mizarLayer) {
                        this.addLayer(mizarLayer, planetLayer);
                    }

                    // Fill data-provider-type layer by features coming from data object
                    if (layerDesc.data && dataProviders[layerDesc.data.type]) {
                        var callback = dataProviders[layerDesc.data.type];
                        var data = callback(mizarLayer, layerDesc.data);
                    }

                    if (mizarLayer.pickable) {
                        PickingManagerCore.addPickableLayer(mizarLayer);
                    }
                }

                return mizarLayer;
            },

            /**
             * Remove the given layer
             * @function removeLayer
             * @param mizarLayer GlobWeb layer
             */
            removeLayer: function (mizarLayer) {
                var index = mizarLayers.indexOf(mizarLayer);
                mizarLayers.splice(index, 1);
                if (mizarLayer.pickable) {
                    PickingManagerCore.removePickableLayer(mizarLayer);
                }

                mizarCore.publish("layer:remove", mizarLayer);
                sky.removeLayer(mizarLayer);
            },

            /**
             * Create layer from FITS
             * @function createLayerFromFits
             * @param {String} name
             * @param fits
             */
            createLayerFromFits: function (name, fits) {
                var mizarLayer = createSimpleLayer(name);
                mizarLayer.dataType = "line";

                // Create feature
                var coords = UtilsCore.getPolygonCoordinatesFromFits(fits);
                var feature = {
                    "geometry": {
                        "gid": name,
                        "coordinates": [coords],
                        "type": "Polygon"
                    },
                    "properties": {
                        "identifier": name
                    },
                    "type": "Feature"
                };

                mizarLayer.addFeature(feature);
                PickingManagerCore.addPickableLayer(mizarLayer);
                this.addLayer(mizarLayer, mizarCore.activatedContext.planetLayer);
                return mizarLayer;
            },

            /**
             * Create layer from GeoJSON
             * @function createLayerFromGeoJson
             * @param {String} name
             * @param {String} geoJson GeoJson data
             */
            createLayerFromGeoJson: function (name, geoJson) {
                // Add feature collection
                var mizarLayer = createSimpleLayer(name);

                // Add feature collection
                JsonProcessor.handleFeatureCollection(mizarLayer, geoJson);
                mizarLayer.addFeatureCollection(geoJson);
                PickingManagerCore.addPickableLayer(mizarLayer);

                this.addLayer(mizarLayer, mizarCore.activatedContext.planetLayer);
                return mizarLayer;
            },

            /**
             * Get one or several layers corresponding to the given query string
             * @function searchGlobeLayer
             * @param queryString The query string
             * @return an array of layers
             */
            searchGlobeLayer: function (query) {
                var results = [];
                var layers = this.getLayers();
                //Search by name
                results = _.filter(layers, function(layer) {
                    return (  (String(layer.name).indexOf(query)>=0) || (String(layer.description||"").indexOf(query)>=0) );
                });
                return results;
            },

            /**
             * Get one or several layers corresponding to the given query string
             * @function searchPlanetLayer
             * @param queryString The query string
             * @return an array of layers
             */
            searchPlanetLayer: function (query) {
                var results = [];
                var layers = this.getPlanetLayers();
                //Search by name
                results = _.filter(layers, function(layer) {
                    return ( (String(layer.name).indexOf(query)>=0) || (String(layer.description||"").indexOf(query)>=0) );
                });
                return results;
            },

            createSimpleLayer: createSimpleLayer,
            checkHipsServiceIsAvailable : checkHipsServiceIsAvailable,
            getPickingManagerCore : function () {
                return PickingManagerCore;
            }
        };

    });
