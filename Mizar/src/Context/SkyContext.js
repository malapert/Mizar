define(["underscore-min", "../Utils/Utils",
        "./BaseContext", "../Layer/LayerManager", "../Provider/StarProvider", "../Provider/ConstellationProvider",
        "../Provider/JsonProvider", "../Provider/OpenSearchProvider", "../Gui/Tracker/PositionTracker", "../Gui/PickingManagerCore",
        "./Sky","./Planet","../Navigation/AstroNavigation","../Renderer/PointSpriteRenderer", "../Renderer/ConvexPolygonRenderer","../Gui/Compass"],
    function ( _, Utils,
              BaseContext, LayerManager, StarProvider, ConstellationProvider,
              JsonProvider, OpenSearchProvider, PositionTracker, PickingManagerCore,
              Sky,Planet,AstroNavigation,PointSpriteRenderer,ConvexPolygonRenderer,Compass) {

        /**************************************************************************************************************/

        /**
         *    Sky context constructor
         *    @param parentElement
         *        Element containing the canvas
         *    @param options Configuration properties for the Globe
         *        <ul>
         *            <li>canvas : the canvas for WebGL, can be string (id) or a canvas element</li>
         *            <li>Same as Mizar options</li>
         *        </ul>
         */
         /**
          @name SkyContext
          @class Context for sky
          @param parentElement Element containing the canvas
          @param options Configuration properties for the Globe
          <ul>
            <li>planetLayer : Planet layer to set</li>
            <li>renderContext : Sky <RenderContext> object</li>
            <li>Same as Mizar options</li>
          </ul>
         */
        var SkyContext = function (parentElement, options) {
          BaseContext.prototype.constructor.call(this, parentElement, options);

          //this.mode = options.mode;
          this.parentElement = parentElement;
          if (options.canvas) {
            this.canvas = options.canvas;
          } else {
            this.canvas = this.parentElement.canvas;
          }

          // Set current context
          this.parentElement.context = this.parentElement.CONTEXT.Sky;

          this.parentElement.skyContext = this;

          skyOptions = {
              canvas: this.canvas,
              tileErrorTreshold: options.tileErrorTreshold || 1.5,
              continuousRendering: options.continuousRendering || false,
              renderTileWithoutTexture: options.renderTileWithoutTexture || false,
              radius: options.radius || 10.0,
              minFar: options.minFar || 15		// Fix problem with far buffer, with planet rendering
          };
          if (options.renderContext) {
            skyOptions.renderContext = options.renderContext;
          }

            // Initialize sky
            try {
                // Create the sky
                this.sky = new Sky(skyOptions);
            }
            catch (err) {
              console.log("Erreur creation Sky : ",err);
              if (document.getElementById('GlobWebCanvas')) {
                document.getElementById('GlobWebCanvas').style.display = "none";
              }
              if (document.getElementById('loading')) {
                document.getElementById('loading').style.display = "none";
              }
              if (document.getElementById('webGLNotAvailable')) {
                document.getElementById('webGLNotAvailable').style.display = "block";
              }
            }

            this.parentElement.scene = this.sky;

            currentView = this.sky;

            this.initPlanetEvents(currentView);

            if (options.isMobile) {
                this.initTouchNavigation(options);
            }

            if (options.navigation) {
                this.navigation = new AstroNavigation(currentView, options.navigation);
            } else {
              this.navigation = new AstroNavigation(currentView, options);
            }
            // Eye position tracker initialization
            this.positionTracker = new PositionTracker(this,{
                element: "posTracker",
                globe: currentView,
                navigation: this.navigation,
                isMobile: this.isMobile,
                positionTracker: options.positionTracker
            });
        };

        /**************************************************************************************************************/

        Utils.inherits(BaseContext, SkyContext);

        /**************************************************************************************************************/

        /**
         * Get additional layers of sky context
         * @function getAdditionalLayers
         * @memberof SkyContext.prototype
         * @return {boolean} Return if layer is not background
         */
        SkyContext.prototype.getAdditionalLayers = function () {
            return _.filter(LayerManager.getLayers("sky"), function (layer) {
                return layer.category !== "background";
            });
        };

        /**************************************************************************************************************/

        /**
         * Load specific sky providers and register them to the LayerManager
         * @function loadProviders
         * @memberof SkyContext.prototype
         */
        SkyContext.prototype.loadProviders = function () {
            BaseContext.prototype.loadProviders.call(this);

            var starProvider = new StarProvider();
            var constellationProvider = new ConstellationProvider();
            var openSearchProvider = new OpenSearchProvider();

            LayerManager.registerDataProvider("constellation", constellationProvider.loadFiles);
            LayerManager.registerDataProvider("star", starProvider.loadFiles);
            LayerManager.registerDataProvider("OpenSearch", function (gwLayer, configuration) {
                openSearchProvider.loadFiles(gwLayer, configuration, 1);
            });
        };

        /**************************************************************************************************************/

        /**
         * Change background survey
         * @function setBackgroundSurvey
         * @memberof SkyContext.prototype
         * @param {string} survey The name of the layer
         */
        SkyContext.prototype.setBackgroundSurvey = function (survey) {
            var globe = this.sky;
            var gwLayer;

            var gwLayers = mizar.getLayers("sky");

            // Find the layer by name among all the layers
            gwLayer = _.findWhere(gwLayers, {name: survey});
            if (gwLayer) {
                // Check if is not already set
                if (gwLayer !== globe.baseImagery) {
                    // Change visibility's of previous layer, because visibility is used to know the active background layer in the layers list (layers can be shared)
                    if (globe.baseImagery) {
                        globe.baseImagery.setVisible(false);
                    }
                    globe.setBaseImagery(gwLayer);
                    gwLayer.setVisible(true);

                    // Clear selection
                    PickingManagerCore.getSelection().length = 0;

                    for (var i = 0; i < gwLayers.length; i++) {
                        var currentLayer = gwLayers[i];
                        if (currentLayer.subLayers) {
                            var len = currentLayer.subLayers.length;
                            for (var j = 0; j < len; j++) {
                                var subLayer = currentLayer.subLayers[j];
                                if (subLayer.name === "SolarObjectsSublayer") {
                                    PickingManagerCore.removePickableLayer(subLayer);
                                    globe.removeLayer(subLayer);
                                    currentLayer.subLayers.splice(j, 1);
                                }
                            }
                        }
                    }
                    this.parentElement.publish("backgroundLayer:change", gwLayer);
                }
            } else {
                this.parentElement.publish("backgroundSurveyError", "Survey " + survey + " hasn't been found");
            }
        };

        /**
         * Set a layer as base imagery
         * @function setBaseImagery
         * @memberof SkyContext.prototype
         * @param {BaseLayer} layer Layer to set
         */
        SkyContext.prototype.setBaseImagery = function (layer) {
          if (this.sky) {
            this.sky.setBaseImagery(layer);
          }
        }

        /**
         * Add a layer
         * @function addLayer
         * @memberof SkyContext.prototype
         * @param {BaseLayer} layer Layer to add
         */
        SkyContext.prototype.addLayer = function (layer) {
          if (this.sky) {
            this.sky.addLayer(layer);
          } else {
            // TODOFL Manage error
            console.log("sky is not defined for sky context");
          }
        }

        /**
         * Force render
         * @function render
         * @memberof SkyContext.prototype
         */
         SkyContext.prototype.render = function() {
          if (this.sky) {
            this.sky.render();
          }

        }

        /**
         * Disable the context
         * @function disable
         * @memberof SkyContext.prototype
         */
        SkyContext.prototype.dispose = function() {
          if (this.sky) {
            this.sky.dispose();
          }
        }

        SkyContext.prototype.enable = function() {
          if (renderers[0].isSky) {
            this.sky.renderContext.renderers[0].enable();
          } else if (renderers[1].isSky) {
            this.sky.renderContext.renderers[1].enable();
          }
        }

        /**
         * Enable the context
         * @function enable
         * @memberof SkyContext.prototype
         */
        SkyContext.prototype.disable = function() {
            renderers = this.planet.renderContext.renderers;
            if (renderers[0].isSky) {
              this.sky.renderContext.renderers[0].disable();
            } else if (renderers[1].isSky) {
              this.sky.renderContext.renderers[1].disable();
            }
        }

        /**
         * Set compass to visible or not
         * @function setCompassVisible
         * @memberof SkyContext.prototype
         * @param {String} divName Name of the compass div
         * @param {Boolean} visible Visible or not
         */
        SkyContext.prototype.setCompassVisible = function (divName,visible) {
          if (visible) {
            this.compass = new Compass({
              element: divName,
              planet: this.planet,
              navigation: this.navigation,
              mizarBaseUrl: "../",
              coordSystem: this.planet.coordinateSystem.type
            });
          } else {
            if (this.compass) {
              this.compass.remove();
            }
          }
          this.setComponentVisibility(divName, visible);
        };

        /**************************************************************************************************************/

        return SkyContext;

    });
