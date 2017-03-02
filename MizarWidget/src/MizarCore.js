define(["jquery", "underscore-min",
        "gw/Context/BaseContext",
        "gw/Context/PlanetContext",
        "gw/Context/SkyContext",
        "text!data/backgroundSurveys.json",
        "gw/Layer/LayerManager",
        "./service/NameResolver", "./service/ReverseNameResolver",
        "./service/MocBase",
        "gw/Utils/Utils",
        "gui/dialog/ErrorDialog",
        "gui/dialog/AboutDialog",
        "uws/UWSManager",
        "gui/ImageManagerCore",
        "gw/Utils/Event",

        // Mizar
        "gw/Mizar",
        "gw/Utils/UtilsCore",


        "gw/NameResolver/NameResolverManager",
        "./reverse_name_resolver/ReverseNameResolverManager"
      ],
    function ($, _, BaseContext, PlanetContext, SkyContext,
              backgroundSurveys,
              LayerManager, NameResolver,
              ReverseNameResolver, MocBase,
              Utils,
              ErrorDialog, AboutDialog, UWSManager, ImageManagerCore, Event,Mizar,UtilsCore) {

                /**
                 * Private variables
                 */
                var parentElement;
                var options;
                var planetContext;
                var skyContext;
                var self;

                /**************************************************************************************************************/

                /**
                 * Apply shared parameters to options if exist
                 */
                var _applySharedParameters = function () {
                    var documentURI = window.document.documentURI;
                    // Retrieve shared parameters
                    var sharedParametersIndex = documentURI
                        .indexOf("sharedParameters=");
                    if (sharedParametersIndex !== -1) {
                        var startIndex = sharedParametersIndex
                            + "sharedParameters=".length;
                        var sharedString = documentURI.substr(startIndex);
                        if (options.shortener) {
                            $.ajax({
                                type: "GET",
                                url: options.shortener.baseUrl + '/'
                                + sharedString,
                                async: false, // TODO: create callback
                                success: function (sharedConf) {
                                    _mergeWithOptions(sharedConf);
                                },
                                error: function (thrownError) {
                                    console.error(thrownError);
                                }
                            });
                        } else {
                            console.log("Shortener plugin isn't defined, try to extract as a string");
                            var sharedParameters = JSON
                                .parse(decodeURI(sharedString));
                            _mergeWithOptions(sharedParameters);
                        }
                    }
                };

                /**************************************************************************************************************/

                /**
                 * Remove "C"-like comment lines from string
                 * @private
                 */
                var _removeComments = function (string) {
                    var starCommentRe = new RegExp("/\\\*(.|[\r\n])*?\\\*/", "g");
                    var slashCommentRe = new RegExp("[^:]//.*[\r\n]", "g");
                    string = string.replace(slashCommentRe, "");
                    string = string.replace(starCommentRe, "");

                    return string;
                };

                /**************************************************************************************************************/

                /**
                 * Merge retrieved shared parameters with Mizar configuration
                 * @param {object} sharedParameters
                 * @private
                 */
                var _mergeWithOptions = function (sharedParameters) {
                    // Navigation
                    options.navigation.initTarget = sharedParameters.initTarget;
                    options.navigation.initFov = sharedParameters.fov;
                    options.navigation.up = sharedParameters.up;

                    // Layer visibility
                    options.layerVisibility = sharedParameters.visibility;
                };

                /**************************************************************************************************************/

                /**
                 * Add layers to sky (default) or to planet if planetLayer is defined.
                 * @param {array} layers
                 * @param {PlanetLayer} planetLayer (optional)
                 * @private
                 */
                var callbackLayersLoaded = function (layers, planetLayer) {
                    // Add surveys
                    for (var i = 0; i < layers.length; i++) {
                        var layer = layers[i];
                        var gwLayer = self.addLayer(layer, planetLayer);

                        // Update layer visibility according to options
                        if (options.layerVisibility
                            && options.layerVisibility.hasOwnProperty(layer.name)) {
                            gwLayer.visible(options.layerVisibility[layer.name]);
                        }
                        self.publish("backgroundSurveysReady");
                    }
                };

                /**************************************************************************************************************/

                /**
                 * Store the mizar base url Used to access to images(Compass,
                 * Mollweide, Target icon for name resolver) Also used to define
                 * "star" icon for point data on-fly NB: Not the best solution of my
                 * life.... TODO: think how to improve it..
                 */
                // Search throught all the loaded scripts for minified version
                var scripts = document.getElementsByTagName('script');
                var mizarSrc = _.find(scripts, function (script) {
                    return script.src.indexOf("MizarWidget.min") !== -1;
                });

                // Depending on its presence decide if Mizar is used on prod or on
                // dev
                var mizarBaseUrl;
                if (mizarSrc) {
                    // Prod
                    // Extract mizar's url
                    mizarBaseUrl = mizarSrc.src.split('/').slice(0, -1).join('/')
                        + '/';
                } else {
                    // Dev
                    // Basically use the relative path from index page
                    mizarSrc = _.find(scripts, function (script) {
                        return script.src.indexOf("Mizar") !== -1;
                    });
                    mizarBaseUrl = mizarSrc.src.split('/').slice(0, -1).join('/')
                        + '/../';
                }


        /**
         @name MizarCore
         @class
         Mizar core constructor
         @augments Event
         @param div Div to use for the Widget.
         @param globalOptions Global configuration properties for the Widget.
         @param userOptions User configuration properties for the Widget.
         */
        var MizarCore = function (div, globalOptions, userOptions) {
            $('#loading').hide();
            Event.prototype.constructor.call(this);

            this.div = div;
            this.canvas = $(this.div).find('#GlobWebCanvas')[0];

            // Sky mode by default
            this.mode = (!_.isEmpty(userOptions.mode)) ? userOptions.mode : "sky";

            self = this;
            //parentElement = div;
            options = globalOptions;
            this.mizarGlobal = globalOptions.mizarGlobal;

            var extendableOptions = ["navigation", "nameResolver",
                "stats", "positionTracker", "elevationTracker"];
            // Merge default options with user ones
            for (var i = 0; i < extendableOptions.length; i++) {
                var option = extendableOptions[i];
                $.extend(options[option], userOptions[option]);
            }

            _applySharedParameters();

            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.mizar = new Mizar({canvas:this.canvas});

            options.mizar = this.mizar;

            this.loadContext(this.mode,userOptions);



            LayerManager.init(this, options);

            // Get background surveys only
            // Currently in background surveys there are not only background
            // layers but also catalog ones
            // TODO : Refactor it !
            $('#loading').show();
            var layers = [];
            if (userOptions.backgroundSurveys) {
                // Use user defined background surveys
                layers = userOptions.backgroundSurveys;
                callbackLayersLoaded(layers);
            } else {
                layers = $.proxy(this.loadBackgroundLayersFromFile, this)(layers, userOptions.backgroundSurveysFiles);
            }

            // Load additionals layers
            $.proxy(this.loadAdditionalLayersFromFile, this)(userOptions.additionalLayersFiles);

            // Add stats
            if (options.stats.visible) {
                this.mizar.createStats( {
                    element: $("#fps"),
                    verbose: options.stats.verbose
                });
                $("#fps").show();
            }

            this.scene.coordinateSystem.type = options.coordSystem;

            // Add attribution handler
            this.mizar.createAttributionHandler(this.scene, {
                element: 'attributions'
            });

/*            new AttributionHandler(this.scene, {
                element: 'attributions'
            });
*/
            // Initialize name resolver
            NameResolver.init(this, this.activatedContext, options);

            // Initialize reverse name resolver
            ReverseNameResolver.init(this, this.activatedContext);

            // UWS services initialization
            UWSManager.init(options);

            // Initialization of tools useful for different modules
            UtilsCore.init(this, options);

            // Initialize moc base
            MocBase.init(this, options);


            // Fullscreen mode
            document.addEventListener("keydown", function (event) {
                // Ctrl + Space
                if (event.ctrlKey === true && event.keyCode === 32) {
                    $('.canvas > canvas').siblings(":not(canvas)").each(
                        function () {
                            $(this).fadeToggle();
                        });
                }
            });
        };

        /**************************************************************************************************************/

        Utils.inherits(Event, MizarCore);

        /**************************************************************************************************************/

        /**
          * Load Context according to mode
          * @function loadContext
          * @memberof MizarCore.prototype
          * @param {string} mode sky/planet
          * @param {object} userOptions
          */
        MizarCore.prototype.loadContext = function (mode, userOptions) {
            switch (mode) {
                case "sky":
                    skyContext = this.mizar.ContextFactory.create(this.mizar.CONTEXT.Sky,options);
                    this.activatedContext = skyContext;
                    this.scene = skyContext.planet;
                    this.navigation = skyContext.navigation;

                    skyContext.initCanvas(this.mizar.canvas);

                    // Load providers
                    skyContext.loadProviders();

                    // TODO : Extend GlobWeb base layer to be able to publish events
                    // by itself
                    // to avoid the following useless call
                    this.activatedContext.planet.subscribe("features:added", function (featureData) {
                        self.publish("features:added", featureData);
                    });

                    break;

                case "planet":
                    //options.canvas = $(div).find('#GlobWebCanvas')[0];
                    planetContext = this.mizar.ContextFactory.create(this.mizar.CONTEXT.Planet,options);
                    //planetContext = new PlanetContext(div, options);

                    this.activatedContext = planetContext;
                    this.scene = planetContext.planet;
                    this.navigation = planetContext.navigation;

                    planetContext.initCanvas(this.mizar.canvas);



                    // Load providers
                    planetContext.loadProviders();

                    this.activatedContext.setComponentVisibility("categoryDiv", true);
                    this.activatedContext.setComponentVisibility("searchDiv", false);
                    this.activatedContext.setComponentVisibility("posTracker", this.activatedContext.components.posTracker);
                    this.activatedContext.setComponentVisibility("elevTracker", this.activatedContext.components.posTracker);
                    this.activatedContext.setComponentVisibility("compassDiv", false);
                    this.activatedContext.setComponentVisibility("measureContainer", true);
                    this.activatedContext.setComponentVisibility("switch2DContainer", false);
                    this.activatedContext.setComponentVisibility("measurePlanetContainer", true);

                    var planetVM = mat4.create();
                    this.activatedContext.navigation.computeInverseViewMatrix();
                    mat4.inverse(this.activatedContext.navigation.inverseViewMatrix, planetVM);

                    this.scene.renderContext.tileErrorTreshold = 3;
                    // Store old view matrix & fov to be able to rollback to sky context
                    this.oldVM = this.scene.renderContext.viewMatrix;
                    this.oldFov = this.scene.renderContext.fov;
                    this.navigation.planet.isSky = false;

                    //planetContext.planet.publish("baseLayersReady");
                    var defaultLayer = userOptions.defaultLayer || "Viking";

                    // Add smooth animation from sky context to planet context
                    this.navigation.toViewMatrix(planetVM, 45, 2000, function () {
                        planetContext.setBackgroundSurvey(defaultLayer);
                        //mizar.getCore().getLayerManager().setBackgroundSurvey(defaultLayer);
                        //planetContext.planet.baseImagery.tiling = mizar.getLayer("DSS").tiling;

                        planetContext.show();
                        planetContext.planet.refresh();

                        var marsLayer = mizar.getLayer("Mars");
                        marsLayer.planet = planetContext.planet;
                        self.publish("mizarMode:toggle", marsLayer);
                        mizar.getCore().activatedContext.planetLayer = marsLayer;
                        $(".backToSky").hide();
                        $(".toggleDimension").hide();
                        $(".switch").hide();
                    });
                    break;
            }
        };

        /**
         * Load Addional layers from files by specifing backgroundSurveysFiles from userOptions
         * @function loadBackgroundLayersFromFile
         * @memberof MizarCore.prototype
         * @param {Array} layers
         * @param {Array} backgroundSurveysFiles
         * @returns {Array} layers
         * @example backgroundSurveysFiles : ["data/backgroundSurveys.json"],
         */
        MizarCore.prototype.loadBackgroundLayersFromFile = function (layers, backgroundSurveysFiles) {
            if (_.isEmpty(backgroundSurveysFiles)) {
                callbackLayersLoaded(layers);
                return layers;
            }

            var mizarCore = this;
            var backgroundFileUrl = backgroundSurveysFiles.shift();
            $.ajax({
                type: "GET",
                async: false, // Deal with it..
                //url: mizarBaseUrl + "data/backgroundSurveys.json",
                url: mizarBaseUrl + backgroundFileUrl,
                dataType: "text",
                success: function (response) {
                    response = _removeComments(response);
                    try {
                        layers = layers.concat($.parseJSON(response));
                    } catch (e) {
                        ErrorDialog.open("Background surveys parsing error<br/> For more details see http://jsonlint.com/.");
                        console.error(e.message);
                        //return false;
                    }
                    mizarCore.loadBackgroundLayersFromFile(layers, backgroundSurveysFiles);
                },
                error: function (thrownError) {
                    console.error(thrownError);
                    mizarCore.loadBackgroundLayersFromFile(layers, backgroundSurveysFiles);
                }
            });
        };

        /**
         * Load Addional layers from files by specifing additionalLayersFiles from userOptions
         * @function loadAdditionalLayersFromFile
         * @memberof MizarCore.prototype
         * @param {array} additionalLayersFiles
         * @example additionalLayersFiles : [{
                layerName : "Mars",
                url : "../data/marsLayers.json"
            }],
         */
        MizarCore.prototype.loadAdditionalLayersFromFile = function (additionalLayersFiles) {
            if (_.isEmpty(additionalLayersFiles)) {
                return;
            }
            var additionalLayer = additionalLayersFiles.shift();

            var mizarCore = this;
            var layers = [];
            $.ajax({
                type: "GET",
                //async: false, // Deal with it..
                url: mizarBaseUrl + additionalLayer.url,
                dataType: "text",
                success: function (response) {
                    response = _removeComments(response);
                    try {
                        layers = $.parseJSON(response);
                    } catch (e) {
                        ErrorDialog.open("Background surveys parsing error<br/> For more details see http://jsonlint.com/.");
                        console.error(e.message);
                        //return false;
                    }
                    var planetLayer = mizarCore.getLayer(additionalLayer.layerName);
                    callbackLayersLoaded(layers, planetLayer);
                    mizarCore.loadAdditionalLayersFromFile(additionalLayersFiles);
                    $('#loading').hide();
                },
                error: function (thrownError) {
                    console.error(thrownError);
                    mizarCore.loadAdditionalLayersFromFile(additionalLayersFiles);
                    $('#loading').hide();
                }
            });
        };

        /**
         * Set a custom background survey
         * @function setCustomBackgroundSurvey
         * @memberof MizarCore.prototype
         * @param {JSON} layerDesc
         */
        MizarCore.prototype.setCustomBackgroundSurvey = function (layerDesc) {
            layerDesc.background = true; // Ensure that background option
            // is set to true
            var layer = LayerManager.addLayerFromDescription(layerDesc);
            this.activatedContext.setBackgroundSurvey(layerDesc.name);
            //LayerManager.setBackgroundSurvey(layerDesc.name);
            return layer;
        };

        /**************************************************************************************************************/

        /**
         * Add additional layer(OpenSearch, GeoJSON, HIPS, grid coordinates)
         * @function addLayer
         * @memberof MizarCore.prototype
         * @param {JSON} layerDesc Layer description
         * @param {PlanetLayer} planetLayer Planet layer, if described layer must be added to planet (optional)
         * @return {Layer} The created layer
         */
        MizarCore.prototype.addLayer = function (layerDesc, planetLayer) {
            this.publish('layer:fitsSupported', layerDesc, planetLayer);
            return LayerManager.addLayerFromDescription(layerDesc, planetLayer);
        };

        /**
         * Remove the given layer
         * @function removeLayer
         * @memberof MizarCore.prototype
         * @param {Layer} layer Layer to remove
         */
        MizarCore.prototype.removeLayer = function (layer) {
            LayerManager.removeLayer(layer);
        };

        /**
         * Point to a given location
         * @function goTo
         * @memberof MizarCore.prototype
         * @param {String} location
         *            Could be: 1) Coordinates in hms/dms : "0:42:14.33
         *            41:16:7.5" 2) Coordinates in decimal degree : "11.11
         *            41.3" 3) Astronomical object name : m31, Mars, Polaris
         *  @param {Function} callback
         */
        MizarCore.prototype.goTo = function (location, callback) {
            NameResolver.goTo(location, callback);
        };

        /**
         * Return current fov
         * @function getCurrentFov
         * @memberof MizarCore.prototype
         * @return {Float[]} Fovx and fovy in degrees
         */
        MizarCore.prototype.getCurrentFov = function () {
            return this.navigation.getFov();
        };

        /**
         * Set zoom(in other words fov)
         * @function setZoom
         * @memberof MizarCore.prototype
         * @param {Number} fovInDegrees
         * @param {Function} callback
         */
        MizarCore.prototype.setZoom = function (fovInDegrees, callback) {
            var geoPos = this.scene.coordinateSystem
                .from3DToGeo(this.navigation.center3d);
            this.navigation.zoomTo(geoPos, fovInDegrees, 1000, callback);
        };

        /**
         * TODO used in MizarWidgetGui
         * Set coordinate system
         * @function setCoordinateSystem
         * @memberof MizarCore.prototype
         * @param newCoordSystem
         *            "EQ" or "GAL"(respectively equatorial or galactic)
         */
        MizarCore.prototype.setCoordinateSystem = function (newCoordSystem) {
            this.scene.coordinateSystem.type = newCoordSystem;

            if (this.mizarGlobal.mizarWidgetGui.mollweideViewer) {
                this.mizarGlobal.mizarWidgetGui.mollweideViewer.setCoordSystem(newCoordSystem);
            }

            // Publish modified event to update compass north
            this.navigation.publish('modified');
        };

        /**
         * Get layers depending on context
         * @function getLayers
         * @memberof MizarCore.prototype
         * @param {string} mode
         * @returns {*|Array} Layers
         */
        MizarCore.prototype.getLayers = function (mode) {
            return LayerManager.getLayers(mode);
        };

        /**
         * Get layer with the given name
         * @function getLayer
         * @memberof MizarCore.prototype
         * @param {String} layerName
         */
        MizarCore.prototype.getLayer = function (layerName) {
            var layers = this.getLayers("sky");
            return _.findWhere(layers, {
                name: layerName
            });
        };

        /**
         *
         * Get LayerManager already initialized
         * @function getLayerManager
         * @memberof MizarCore.prototype
         * @return {LayerManager} Layer manager
         */
        MizarCore.prototype.getLayerManager = function () {
            return LayerManager;
        };

        /**
         * Intersect the given layers
         * @function xMatch
         * @memberof MizarCore.prototype
         * @param {Array} layers Layers
         * @return {Boolean} Intersect or not the given layers
         */
        MizarCore.prototype.xMatch = function (layers) {
            return MocBase.intersectLayers(layers);
        };

        /**
         * Add fits image to the given feature data
         * @function requestFits
         * @memberof MizarCore.prototype
         * @param {JSON} featureData Feature data
         */
        MizarCore.prototype.requestFits = function (featureData) {
            featureData.isFits = true; // TODO: Refactor it
            ImageManagerCore.addImage(featureData);
        };

        /**
         * Remove fits image to the given feature data
         * @function removeFits
         * @memberof MizarCore.prototype
         * @param {JSON} featureData Feature data
         */
        MizarCore.prototype.removeFits = function (featureData) {
            ImageManagerCore.removeImage(featureData);
        };

        /**
         * Show/hide the credits popup
         * @function setShowCredits
         * @memberof MizarCore.prototype
         * @param {Boolean} visible Visible or not
         */
        MizarCore.prototype.setShowCredits = function (visible) {
            this.activatedContext.showCredits(visible);
        };

        /**
         * View planet with the given name
         * @function viewPlanet
         * @memberof MizarCore.prototype
         * @param {String} planetName Planet name
         * @param {Boolean} is flat ?
         */
        MizarCore.prototype.viewPlanet = function (planetName, isFlat) {
            var planetLayer = this.getLayer(planetName);
            if (planetLayer) {
                // HACK : mizar must be in sky mode to be toggled to earth
                // mode
                // TODO: think about better mode management..
                this.mode = "sky";
                this.toggleContext(planetLayer, isFlat);
            } else {
                console.error("No planet with name : " + planetName
                    + " has been found");
            }

        };

        /**
         * Toggle between planet/sky mode
         * @function toggleContext
         * @memberof MizarCore.prototype
         * @param gwLayer Layer
         * @param {Boolean} isFlat is Flat ?
         * @param callback Callback function
         */
        MizarCore.prototype.toggleContext = function (gwLayer, isFlat, callback) {
            this.mizarGlobal.mizarWidgetGui.toggleContext(gwLayer,isFlat,callback);
        };

        /**
         * Toggle between planet/sky mode
         * @function toggleDimension
         * @memberof MizarCore.prototype
         * @param gwLayer Layer
         */
        MizarCore.prototype.toggleDimension = function (gwLayer) {
            if (this.mode === "sky") {
                return;
            }
            if (!this.activatedContext.getCoordinateSystem().isFlat) {
              if (this._atmosphereLayer !== undefined) {
                if (this._atmosphereLayer.planet !== null) {
                  this._saveAtmosphereVisible = this._atmosphereLayer._visible;
                  this._atmosphereLayer.setVisible(false);
                  this.mizar.render();
                }
              }
            } else {
              if (this._atmosphereLayer !== undefined) {
                if (this._atmosphereLayer.planet !== null) {
                  this._atmosphereLayer.setVisible(this._saveAtmosphereVisible);
                  this.mizar.render();
                }
              }
            }

            var isFlat = this.activatedContext.toggleDimension();
            var callback = function () {
                this.viewPlanet("Mars", isFlat);
            }.bind(this);

            this.mizar.render();

            // Update navigation in measure tools
            //this.toggleContext(undefined, undefined, callback);

            // // Hide planet
            // planetContext.hide();
            // // Destroy planet context
            // planetContext.destroy();
            // planetContext = null;

            // this.viewPlanet("Mars", dimension);
        };

        /**
         * get Mizar Core API
         * @function getMizarCoreAPI
         * @memberof MizarCore.prototype
         @ @return {Mizar} Mizar core API
         */
        MizarCore.prototype.getMizar = function () {
            return this.mizar;
        };
        return MizarCore;
    });
