define(["jquery", "underscore-min",
        "gw/Utils/Event",
        "gw/Utils/Utils", "MizarCore", "MizarWidgetGui",
        "text!templates/mizarCore.html"],
    function ($, _, Event, Utils, MizarCore, MizarWidgetGui, mizarCoreHTML) {

      var parentElement;
      var options;
      var self;

      var getMizarUrl = function () {
          /**
           *    Store the mizar base urlferf
           *    Used to access to images(Compass, Mollweide, Target icon for name resolver)
           *    Also used to define "star" icon for point data on-fly
           *    NB: Not the best solution of my life.... TODO: think how to improve it..
           */
          // Search throught all the loaded scripts for minified version
          var scripts = document.getElementsByTagName('script');
          var mizarSrc = _.find(scripts, function (script) {
              return script.src.indexOf("MizarWidget.min") !== -1;
          });

          // Depending on its presence decide if Mizar is used on prod or on dev
          var mizarBaseUrl;
          if (mizarSrc) {
              // Prod
              // Extract mizar's url
              mizarBaseUrl = mizarSrc.src.split('/').slice(0, -1).join('/') + '/';
          }
          else {
              // Dev
              // Basically use the relative path from index page
              mizarSrc = _.find(scripts, function (script) {
                  return script.src.indexOf("MizarGlobal") !== -1;
              });
              mizarBaseUrl = mizarSrc.src.split('/').slice(0, -1).join('/') + '/../';
          }
          return mizarBaseUrl;
      }

        /**
         @name MizarGlobal
         @class
         Entry point to manage Mizar Widget.
         @augments Event
         @param div Div to use for the Widget.
         @param userOptions Configuration properties for the Widget.
         @param callbackInitMain Callback function
         */
         var MizarGlobal = function (div, userOptions, callbackInitMain) {
            Event.prototype.constructor.call(this);

            var mizarBaseUrl = getMizarUrl();

            // Sky mode by default
            this.mode = (!_.isEmpty(userOptions.mode)) ? userOptions.mode : "sky";

            parentElement = div;
            self = this;

            var sitoolsBaseUrl = userOptions.sitoolsBaseUrl ? userOptions.sitoolsBaseUrl : "http://demonstrator.telespazio.com/sitools";
            var isMobile = ('ontouchstart' in window || (window.DocumentTouch && document instanceof DocumentTouch));

            options = {
                "sitoolsBaseUrl": sitoolsBaseUrl,
                "mizarBaseUrl": mizarBaseUrl,
                "continuousRendering": userOptions
                    .hasOwnProperty('continuousRendering') ? userOptions.continuousRendering : !isMobile,
                "coordSystem": userOptions.hasOwnProperty('coordSystem') ? userOptions.coordSystem
                    : "EQ",
                "coordinateSystem":userOptions.coordinateSystem,
                "debug": userOptions.hasOwnProperty('debug') ? userOptions.debug
                    : false,
                "nameResolver": {
                    "jsObject": "./name_resolver/DefaultNameResolver",
                    "baseUrl": sitoolsBaseUrl + '/mizar/plugin/nameResolver',
                    // "baseUrl" : "http://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oxp/ALL"
                    "zoomFov": 15,
                    "duration": 3000
                },
                "reverseNameResolver": {
                    "jsObject": "./reverse_name_resolver/CDSReverseNameResolver",
                    "baseUrl": "http://alasky.u-strasbg.fr/cgi/simbad-flat/simbad-quick.py?Ident={coordinates}&SR={radius}",
                },
                "coverageService": {
                    "baseUrl": sitoolsBaseUrl
                    + "/project/mizar/plugin/coverage?moc="
                },
                "solarObjects": {
                    "baseUrl": sitoolsBaseUrl
                    + "/project/mizar/plugin/solarObjects/"
                },
                "votable2geojson": {
                    "baseUrl": sitoolsBaseUrl
                    + "/project/mizar/plugin/votable2geojson"
                },
                "cutOut": {
                    "baseUrl": sitoolsBaseUrl + "/cutout"
                },
                "zScale": {
                    "baseUrl": sitoolsBaseUrl + "/zscale"
                },
                "healpixcut": {
                    "baseUrl": sitoolsBaseUrl + "/healpixcut"
                },
                "shortener": {
                    "baseUrl": sitoolsBaseUrl + "/shortener"
                },
                "navigation": {
                    "initTarget": [85.2500, -2.4608],
                    "initFov": 20,
                    "inertia": true,
                    "minFov": 0.001,
                    "zoomFactor": 0,
                    "isMobile": isMobile,
                    "mouse": {
                        "zoomOnDblClick": true
                    }
                },
                "stats": {
                    "verbose": false,
                    "visible": false
                },
                "positionTracker": {
                    "position": "bottom"
                },
                "elevationTracker": {
                    "position": "bottom"
                },
                "isMobile": isMobile,
                "hipsServiceUrl": userOptions.hasOwnProperty('hipsServiceUrl') ? userOptions.hipsServiceUrl : undefined,
                "mizarGlobal" : this
            };

            var mizarContent = null;
            // Async Load of MizarWidgetGui if GUI activated
            if (userOptions.guiActivated) {
                if (typeof div === "string") {
                  div = document.getElementById(div);
                }
                // Create mizar core HTML
                mizarContent = _.template(mizarCoreHTML, {});
                $(mizarContent).appendTo(div);

                this.mizarCore = new MizarCore(div, options, userOptions);

                this.mizarWidgetGui = new MizarWidgetGui(div, {
                    isMobile: isMobile,
                    mode: userOptions.mode,
                    mizarGlobal: this,
                    sky: this.mizarCore.scene,
                    navigation: this.mizarCore.navigation,
                    options: options
                });

            } else {
                // Create mizar core HTML
                mizarContent = _.template(mizarCoreHTML, {});
                $(mizarContent).appendTo(div);

                this.mizarCore = new MizarCore(div, options, userOptions);
            }

        };

        /**************************************************************************************************************/

        Utils.inherits(Event, MizarGlobal);

        /**************************************************************************************************************/

        /**
          * Get the current Mizar context (Sky/Planet)
          * @function getContext
          * @memberof MizarGlobal.prototype
          * @return {SkyContext} SkyContext
          */
        MizarGlobal.prototype.getContext = function () {
            return this.mizarCore.activatedContext;
        };

         /**
           * Get the current Scene
           * @function getScene
           * @memberof MizarGlobal.prototype
           * @return {Sky} Scene
           */
        MizarGlobal.prototype.getScene = function () {
            return this.mizarCore.scene;
        };

        /**
         * Get the current Navigation
         * @function getNavigation
         * @memberof MizarGlobal.prototype
         * @return {AstroNavigation} Navigation
         */
        MizarGlobal.prototype.getNavigation = function () {
            return this.mizarCore.navigation;
        };

        /**
          * Get Mizar Core
          * @function getCore
          * @memberof MizarGlobal.prototype
          * @return {MizarCore} Mizar Core
          */
        MizarGlobal.prototype.getCore = function () {
            return this.mizarCore;
        };

        /**
          * Get Mizar Gui
          * @function getGui
          * @memberof MizarGlobal.prototype
          * @return {MizarWidgetGui} Mizar Widget Gui
          */
        MizarGlobal.prototype.getGui = function () {
            return this.mizarWidgetGui;
        };

        /**
           * Get layers depending on the mode
           * @function getLayers
           * @memberof MizarGlobal.prototype
           * @param {string} mode (sky, planet, all)
           * @return {*|Array} Layers
           */
        MizarGlobal.prototype.getLayers = function (mode) {
            if (this.mizarCore) {
                return this.mizarCore.getLayers(mode);
            }
        };

          /**
            * Get layer with the given name
            * @function getLayer
            * @memberof MizarGlobal.prototype
            * @param {String} layerName
            * @return {Layer} Layer
            */
        MizarGlobal.prototype.getLayer = function (layerName) {
            if (this.mizarCore) {
                return this.mizarCore.getLayer(layerName);
            }
        };

        /**
          * Add additional layer(OpenSearch, GeoJSON, HIPS, grid coordinates)
          * @function addLayer
          * @memberof MizarGlobal.prototype
          * @param {Object} layerDesc Layer description
          * @param {Layer} planetLayer Planet layer, if described layer must be added to planet (optional)
          * @return {Layer}The created layer
          */
        MizarGlobal.prototype.addLayer = function (layerDesc, planetLayer) {
            if (this.mizarCore) {
                return this.mizarCore.addLayer(layerDesc, planetLayer);
            }
        };

        /**
          * Show/hide the credits popup
          * @function setShowCredits
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setShowCredits = function (visible) {
            if (this.mizarCore) {
                this.mizarCore.setShowCredits(visible);
            }
        };

        /**
          * Show/hide angle distance GUI
          * @function setAngleDistanceSkyGui
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setAngleDistanceSkyGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setAngleDistanceSkyGui(visible);
            }
        };

        /**
          * Show/hide Switch To 2D
          * @function setSwitchTo2D
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setSwitchTo2D = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setSwitchTo2D(visible);
            }
        };

        /**
          * Show/hide samp GUI
          * Only on desktop
          * @function setSampGui
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setSampGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setSampGui(visible);
            }
        };

        /**
          * Show/hide shortener GUI
          * @function setShortenerUrlGui
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setShortenerUrlGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setShortenerUrlGui(visible);
            }
        };

        /**
          * Show/hide 2d map GUI
          * @function setMollweideMapGui
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setMollweideMapGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setMollweideMapGui(visible);
            }
        };

        /**
          * Show/hide reverse name resolver GUI
          * @function setReverseNameResolverGui
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setReverseNameResolverGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setReverseNameResolverGui(visible);
            }
        };

        /**
          * Show/hide name resolver GUI
          * @function setNameResolverGui
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setNameResolverGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setNameResolverGui(visible);
            }
        };

        /**
          * Show/hide jQueryUI layer manager view
          * @function setCategoryGui
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setCategoryGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setCategoryGui(visible);
            }
        };

        /**
          * Show/hide jQueryUI image viewer GUI
          * @function setImageViewerGui
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setImageViewerGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setImageViewerGui(visible);
            }
        };

        /**
          * Show/hide jQueryUI Export GUI
          * @function setExportGui
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setExportGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setExportGui(visible);
            }
        };

        /**
          * Show/hide position tracker GUI
          * @function setPositionTrackerGui
          * @memberof MizarGlobal.prototype
          * @param {boolean} visible
          */
        MizarGlobal.prototype.setPositionTrackerGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setPositionTrackerGui(visible);
            }
        };

        /**
          * Toggle between between 3D and 2D
          * @function toggleDimension
          * @memberof MizarGlobal.prototype
          * @param {Layer} layer the current layer
          */
        MizarGlobal.prototype.toggleDimension = function (gwLayer) {
            if (this.mizarCore) {
                this.mizarCore.toggleDimension(gwLayer);
            }
        };

        /**
          * Toggle between planet and sky mode
          * @function toggleContext
          * @memberof MizarGlobal.prototype
          * @param {Layer} gwLayer
          * @param {String} planetDimension (2D or 3D)
          * @param {Function} callback
          */
        MizarGlobal.prototype.toggleContext = function (gwLayer, planetDimension, callback) {
            if (this.mizarCore) {
                this.mizarCore.toggleContext(gwLayer, planetDimension, callback);
            }
        };

         /**
           * Get additional layers depending on current context
           * @function getAdditionalLayers
           * @memberof MizarGlobal.prototype
           * @return {Array} Layers
           */
        MizarGlobal.prototype.getAdditionalLayers = function () {
            return this.getContext().getAdditionalLayers();
        };

        return MizarGlobal;
    });
