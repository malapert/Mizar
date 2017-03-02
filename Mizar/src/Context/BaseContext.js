define(["jquery", "underscore-min", "../Layer/LayerManager", "../Provider/JsonProvider", "../Provider/PlanetProvider"],
    function ($, _, LayerManager, JsonProvider, PlanetProvider) {

        /**************************************************************************************************************/

        /**
         *    Mizar context constructor
         */
        var BaseContext = function (div, options) {

            this.components = {
                "2dMapContainer": false,
                "posTracker": true,
                "shareContainer": false,
                "sampContainer": false,
                "measureContainer": false,
                "compassDiv": false,
                "imageViewerDiv": false,
                "categoryDiv": false,
                "searchDiv": false
            };

            this.planet = null;	// Sky or globe
            this.navigation = null;
            this.parentElement = div;
            this.aboutShown = false;
            this.credits = true;
            this.configuration = options;
        };

        /**************************************************************************************************************/

         /**
          * Initialize touch navigation handler
          * @function initTouchNavigation
          * @memberof BaseContext.prototype
          * @param {JSON} options to add touch navigation
          */
        BaseContext.prototype.initTouchNavigation = function (options) {
            options.navigation.touch = {
                inversed: (this.planet.isSky ? true : false),
                zoomOnDblClick: true
            };

            var self = this;
            window.addEventListener("orientationchange", function () {
                self.planet.refresh();
            }, false);
        };

        /**************************************************************************************************************/

         /**
          * Initialization of canvas element
          * @function initCanvas
          * @memberof BaseContext.prototype
          * @param {JSON} canvas Canvas object
          */
        BaseContext.prototype.initCanvas = function (canvas) {
            var parentCanvas = null;
            var width,height;
            if (!canvas.parentElement) {
              // If we haven't any parent to canvas, set to full screen
              width = window.innerWidth;
              height = window.innerHeight;

            } else {
              parentCanvas = $(canvas.parentElement);

              // Set canvas dimensions from width/height attributes
              width = parentCanvas.attr("width");
              if (!width) {
                  // Use window width by default if not defined
                  width = window.innerWidth;
              }

              height = parentCanvas.attr("height");
              if (!height) {
                  // Use window height if not defined
                  height = window.innerHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;

            // Add some useful css properties to parent element
            if (parentCanvas) {
              parentCanvas.css({
                position: "relative",
                overflow: "hidden"
              });
            }

            var self = this;

            // Define on resize function
            var onResize = function () {
                if (parentCanvas && parentCanvas.attr("height") && parentCanvas.attr("width")) {
                    // Embedded
                    canvas.width = parentCanvas.width();
                    canvas.height = parentCanvas.height();
                }
                else {
                    // Fullscreen
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }
                self.planet.refresh();
            };

            // Take into account window resize 1s after resizing stopped
            var timer;
            $(window).resize(function () {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(onResize, 500);
            });

            // Context lost listener
            canvas.addEventListener("webglcontextlost", function (event) {
                // TODO
                event.preventDefault();
                document.getElementById('loading').style.display = "none";
                document.getElementById('webGLContextLost').style.display = "block";
            }, false);
        };

        /**************************************************************************************************************/

         /**
          * Handles credits window
          * @function showCredits
          * @memberof BaseContext.prototype
          * @param {boolean} visible Set if credits are visibles
          */
        BaseContext.prototype.showCredits = function (visible) {
            this.credits = visible;
        };
        /**************************************************************************************************************/

         /**
          * Hide loading and show about on first connection
          * @function showAbout
          * @memberof BaseContext.prototype
          */
        BaseContext.prototype.showAbout = function () {
            // Show about information only at the end of first loading
            // TOFL uncomment about dialog
            if (this.credits && localStorage.showAbout === undefined && !this.aboutShowed) {
                //AboutDialog.show();
                this.aboutShowed = true;
            }

            $(this.parentElement).find('#loading').hide(300);
        };

        /**************************************************************************************************************/

         /**
          * Initialize planet events
          * @function initPlanetEvents
          * @memberof BaseContext.prototype
          * @param {planet} planet Planet object
          */
        BaseContext.prototype.initPlanetEvents = function (planet) {
            if (planet) {
              this.planet = planet;
            }
            this.planet.subscribe("baseLayersReady", $.proxy(this.showAbout, this));

            // When base layer failed to load, open error dialog
            this.planet.subscribe("baseLayersError", function (layer) {

                $(this.parentElement).find('#loading').hide();
                // TODO : handle multiple errors !
                var layerType = layer.id === 0 ? " background layer " : " additional layer ";
                //ErrorDialog.open("<p>The" + layerType + "<span style='color: orange'>" + layer.name + "</span> can not be displayed.</p><p>First check if data source related to this layer is still accessible. Otherwise, check your Sitools2 configuration.</p>");
            });
        };

        /**************************************************************************************************************/

         /**
          * "Show" sky context
          * @function show
          * @memberof BaseContext.prototype
          */
        BaseContext.prototype.show = function () {
            this.navigation.start();

            // Show UI components depending on its state
            for (var componentId in this.components) {
                if (this.components[componentId]) {
                    //$(this.parentElement).find("#" + componentId).fadeIn(1000);
                    $("#" + componentId).fadeIn(1000);
                }
            }
        };

        /**************************************************************************************************************/

         /**
          * "Hide" sky component
          * @function hide
          * @memberof BaseContext.prototype
          */
        BaseContext.prototype.hide = function () {
            this.navigation.stopAnimations();
            this.navigation.stop();

            // Hide all the UI components
            for (var componentId in this.components) {
                //$(this.parentElement).find("#" + componentId).fadeOut();
                $("#" + componentId).fadeOut();
            }
        };

        /**************************************************************************************************************/

         /**
          * Set UI component visibility
          * @function setComponentVisibility
          * @memberof BaseContext.prototype
          * @param {String} componentId Id of the component
          * @param {boolean} isVisible Set if component is visible or not
          */
        BaseContext.prototype.setComponentVisibility = function (componentId, isVisible) {
            var component = $("#"+componentId);
            if (isVisible) {
                component.show();
            }
            else {
                component.hide();
            }

            this.components[componentId] = isVisible;
        };

        /**************************************************************************************************************/

         /**
          * Show additional layers
          *    (used on context change)
          * @function showAdditionalLayers
          * @memberof BaseContext.prototype
          */
        BaseContext.prototype.showAdditionalLayers = function () {
            _.each(this.visibleLayers, function (layer) {
                layer.setVisible(true);
            });
        };

        /**************************************************************************************************************/

         /**
          * Hide additional layers
          *    (used on context change)
          * @function hideAdditionalLayers
          * @memberof BaseContext.prototype
          */
        BaseContext.prototype.hideAdditionalLayers = function () {
            this.visibleLayers = [];
            var gwLayers = this.getAdditionalLayers();
            var self = this;
            _.each(gwLayers, function (layer) {
                if (layer.getVisible()) {
                    layer.setVisible(false);
                    self.visibleLayers.push(layer);
                }

            });
        };

        /**************************************************************************************************************/

         /**
          * Overload in PlanetContext and SkyContext
          * @function getAdditionalLayers
          * @memberof BaseContext.prototype
          * @return {Array} Array of layers
          */
        BaseContext.prototype.getAdditionalLayers = function () {
            return [];
        };

        /**************************************************************************************************************/

        /**
         * Get the current position tracker
         * @function getPositionTracker
         * @memberof BaseContext.prototype
         * @returns {PositionTracker|*}
         */
        BaseContext.prototype.getPositionTracker = function () {
            return this.positionTracker | console.log("No positionTracker defined");
        };

        /**************************************************************************************************************/

         /**
          * Load common providers to sky/planet and register them to the LayerManager
          * @function loadProviders
          * @memberof BaseContext.prototype
          */
            var jsonProvider = new JsonProvider();
            BaseContext.prototype.loadProviders = function () {
            var planetProvider = new PlanetProvider();
            LayerManager.registerDataProvider("JSON", jsonProvider.loadFiles);
            LayerManager.registerDataProvider("planets", planetProvider.handleFeatures);
        };

        /**************************************************************************************************************/

        /**
         * Change background survey
         * @function setBackgroundSurvey
         * @memberof BaseContext.prototype
         * @param {string} survey the name of the layer
         */
        BaseContext.prototype.setBackgroundSurvey = function (survey) {

        };

        /**
         * Return the planet render context
         * @function getPlanetRenderContext
         * @memberof BaseContext.prototype
         * @param {RenderContext} Render context
         */
        BaseContext.prototype.getPlanetRenderContext = function() {
          if (this.planet) {
            return this.planet.getRenderContext();
          }
        }

        /**
         * Return the sky render context
         * @function getSkyRenderContext
         * @memberof BaseContext.prototype
         * @param {RenderContext} Render context
         */
        BaseContext.prototype.getSkyRenderContext = function() {
          if (this.sky) {
            return this.sky.getRenderContext();
          }
        }

        /**
         * Disable the context
         * @function disable
         * @memberof BaseContext.prototype
         */
        BaseContext.prototype.disable = function() {
        }

        /**
         * Enable the context
         * @function enable
         * @memberof BaseContext.prototype
         */
        BaseContext.prototype.enable = function() {
        }

        /**
         * Set compass to visible or not
         * @function setCompassVisible
         * @memberof BaseContext.prototype
         * @param {String} divName Name of the compass div
         * @param {Boolean} visible Visible or not
         */
        BaseContext.prototype.setCompassVisible = function (divName,visible) {
          console.log("Error, Compass is not implemented for this context");
        };

        /**************************************************************************************************************/

        return BaseContext;

    });
