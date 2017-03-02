 define(["underscore-min","./Planet", "../AttributionHandler", "../Navigation/Navigation", "../Utils/Utils",
    "./BaseContext", "../Layer/LayerManager", "../Provider/JsonProvider", "../Gui/Tracker/PositionTracker",
    "../Gui/Tracker/ElevationTracker", "../Navigation/FlatNavigation", "../Projection/MercatorCoordinateSystem", "../Layer/WCSElevationLayer",
  "../Renderer/PointRenderer", "../Renderer/LineStringRenderable", "../Renderer/PolygonRenderer", "../Renderer/LineRenderer",
  "../CoordinateSystem/CoordinateSystemFactory","../Utils/Constants"],
    function (_,Planet, AttributionHandler, Navigation, Utils, BaseContext,
              LayerManager, JsonProvider, PositionTracker,
              ElevationTracker, FlatNavigation, MercatorCoordinateSystem, WCSElevationLayer,
            PointRenderer,LineStringRenderable,PolygonRenderer,LineRenderer,
            CoordinateSystemFactory,Constants) {

         /**
          @name PlanetContext
          @class PlanetContext constructor
          @param parentElement Element containing the canvas
          @param options Configuration properties for the Globe
          <ul>
            <li>planetLayer : Planet layer to set</li>
            <li>renderContext : Sky <RenderContext> object</li>
            <li>Same as Mizar options</li>
          </ul>
         */
         var PlanetContext = function (parentElement, options) {
            BaseContext.prototype.constructor.call(this, parentElement, options);
            this.parentElement = parentElement;
            this.canvas = this.parentElement.canvas;

            // Set current context
            this.parentElement.context = this.parentElement.CONTEXT.Planet;

            // Set planet context to Mizar object
            this.parentElement.planetContext = this;
            this.coordinateSystemFactory = new CoordinateSystemFactory();

            planetOptions = {
                tileErrorTreshold: options.tileErrorTreshold || 3,
                continuousRendering: options.continuousRendering || false,
                renderContext: options.renderContext, // TODO DXT : check if render context should be given here
                canvas: this.canvas,
				        coordinateSystem: options.projection,
                shadersPath: "../../shaders/"
            };

            // Initialize planet
            try {
                this.planet = new Planet(planetOptions);
            }
            catch (err) {
                console.log("Erreur creation Planet : ",err);
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
            this.initPlanetEvents(this.planet);

            this.parentElement.scene = this.planet;
            // Add attribution handler
            new AttributionHandler(this.planet, {element: 'globeAttributions'});

            // Initialize planet context
            this.planetLayer = options.planetLayer;
            if (this.planetLayer) {
                this.planet.addLayer(this.planetLayer);
            }

            if (options.isMobile) {
                this.initTouchNavigation(options);
            }

            // Don't update view matrix on creation, since we want to use animation on context change
            if (options.navigation) {
              options.navigation.updateViewMatrix = false;
            }

            // Eye position tracker initialization

            this.positionTracker = new PositionTracker(this,{
                element: "posTracker",
                globe: this.planet,
                positionTracker: options.positionTracker
            });

			      this.navigationOptions = options.navigation;

            if (this.getCoordinateSystem().isFlat) {
                this.navigation = new FlatNavigation(this.planet, options.navigation);
                this.planet.flatNavigation = this.navigation;
                if (options.initTarget) {
                  this.navigation.zoomTo(options.initTarget);
                }
            } else {
                this.elevationTracker = new ElevationTracker({
                    element: "elevTracker",
                    globe: this.planet,
                    elevationTracker: options.elevationTracker,
                    elevationLayer: (options.planetLayer !== undefined) ? options.planetLayer.elevationLayer : undefined
                });

                this.navigation = new Navigation(this.planet, options.navigation);
				        if (options.initTarget) {
					        this.navigation.zoomTo(options.initTarget, 18000000);
				        }
          }

          this.planet.publish("baseLayersReady");

        };

        /**************************************************************************************************************/

        Utils.inherits(BaseContext, PlanetContext);

        /**************************************************************************************************************/

        /**
         * Get additional layers of planet context
         * @function getAdditionalLayers
         * @memberof PlanetContext.prototype
         */
        PlanetContext.prototype.getAdditionalLayers = function () {
            return this.planetLayer.layers;
        };

        /**************************************************************************************************************/

        /**
         * Get the current elevation tracker
         * @function getElevationTracker
         * @memberof PlanetContext.prototype
         * @returns {ElevationTracker|*}
         */
        PlanetContext.prototype.getElevationTracker = function () {
            return this.elevationTracker | console.log("No elevationTracker defined");
        };

        /**************************************************************************************************************/

		PlanetContext.prototype.dispose = function() {
           this.planet.dispose();
         }

        /**************************************************************************************************************/

        /**
         * Destroy method
         * @function destroy
         * @memberof PlanetContext.prototype
         */
        PlanetContext.prototype.destroy = function () {
            this.planet.removeLayer(this.planetLayer);
            this.hide();
            this.planet.destroy();
            this.planet = null;
        };

        /**************************************************************************************************************/

        /**
         * Change planet dimension
         * @function destroy
         * @memberof PlanetContext.prototype
         * @param {BaseLayer} gwLayer Layer
         * @returns {Boolean} if the new mode is flat
         */
        PlanetContext.prototype.toggleDimension = function (gwLayer) {
            if (this.planet.getCoordinateSystem().isFlat) {
                // Enable skyContext
                this.parentElement.skyContext.enable();

                this.setCoordinateSystem(this.coordinateSystemFactory.create({geoideName:this.getCoordinateSystem().geoideName}));
                //this.setCoordinateSystem(this.getCoordinateSystem().clone({projectionName:null}));
                // Check zoom level
                this.navigation.zoom(0);
                this.render();
            } else {
                // Disable skyContext
                this.parentElement.skyContext.disable();

                //this.setCoordinateSystem(this.planet.getCoordinateSystem().clone({projectionName:Constants.PROJECTION.Plate}));
                this.setCoordinateSystem(this.coordinateSystemFactory.create({geoideName:this.getCoordinateSystem().geoideName,projectionName:Constants.PROJECTION.Plate}));
                this.render();
            }
          return this.getCoordinateSystem().isFlat;
        };

        /**************************************************************************************************************/

        /**
         * Load specific planet providers and register them to the LayerManager
         * @function loadProviders
         * @memberof PlanetContext.prototype
         */
        PlanetContext.prototype.loadProviders = function () {
            BaseContext.prototype.loadProviders.call(this);
        };

        /**************************************************************************************************************/

        /**
         * Change background survey
         * @function setBackgroundSurvey
         * @memberof PlanetContext.prototype
         * @param {string} survey The name of the layer
         */
        PlanetContext.prototype.setBackgroundSurvey = function (survey) {
            var planet = this.planet;
            var gwLayer;

            var planetLayers = mizar.getLayers("planet");
            gwLayer = _.findWhere(planetLayers, {name: survey});

            if (!_.isEmpty(gwLayer)) {
                if (planet.baseImagery) {
                    planet.baseImagery.setVisible(false);
                }
                planet.setBaseImagery(gwLayer);
                gwLayer.setVisible(true);
                this.parentElement.publish("backgroundLayer:change", gwLayer);
            }
        };

        /**
         * Set a layer as base imagery
         * @function setBaseImagery
         * @memberof PlanetContext.prototype
         * @param {BaseLayer} layer Layer to set
         */
        PlanetContext.prototype.setBaseImagery = function (layer) {
          if (this.planet) {
            this.planet.setBaseImagery(layer);
          }
        }

        /**
         * Set a layer as base elevation
         * @function setBaseElevation
         * @memberof PlanetContext.prototype
         * @param {BaseLayer} layer Layer to set
         */
        PlanetContext.prototype.setBaseElevation = function (layer) {
          if (this.planet) {
            this.planet.setBaseElevation(layer);
          }
        }

        /**
         * Add a layer
         * @function addLayer
         * @memberof PlanetContext.prototype
         * @param {BaseLayer} layer Layer to add
         */
         PlanetContext.prototype.addLayer = function (layer) {
          if (this.planet) {
            this.planet.addLayer(layer);
          } else {
            console.log("planet is not defined for planet context");
          }
        }

        /**
         * Force render
         * @function render
         * @memberof PlanetContext.prototype
         */
        PlanetContext.prototype.render = function() {
          if (this.planet) {
            this.planet.render();
          }
        }

        /**
         * Set a coordinate system
         * @function setCoordinateSystem
         * @memberof PlanetContext.prototype
         * @param {CoordinateSystem} cs Coordinate system to set
         */
    		PlanetContext.prototype.setCoordinateSystem = function(cs) {
    			// Change navigation
    			var geoCenter;
    			var geoDistance;
    			if (this.planet.coordinateSystem.isFlat) {
    				geoCenter = this.planet.coordinateSystem.from3DToGeo(this.navigation.center);
    				geoDistance = this.navigation.distance / this.planet.coordinateSystem.geoide.heightScale;
    			} else {
    				geoCenter = this.navigation.geoCenter;
    				geoDistance = this.navigation.distance / this.planet.coordinateSystem.geoide.heightScale;
    			}

    			this.planet.setCoordinateSystem(cs);

          this.navigation.stop();

    			if (cs.isFlat) {
              this.navigation = new FlatNavigation(this.planet,this.navigationOptions);
    				  this.navigation.center =  this.planet.coordinateSystem.fromGeoTo3D(geoCenter);
    				  this.navigation.distance = geoDistance * this.planet.coordinateSystem.geoide.heightScale;
    			} else {
              this.navigation = new Navigation(this.planet,this.navigationOptions);
    				  this.navigation.geoCenter = geoCenter;
    				  this.navigation.distance = geoDistance * this.planet.coordinateSystem.geoide.heightScale;
    			}

    			this.navigation.computeViewMatrix();
    		}

        /**
         * Get the coordinate system
         * @function getCoordinateSystem
         * @memberof PlanetContext.prototype
         * @return {CoordinateSystem} Coordinate system
         */
        PlanetContext.prototype.getCoordinateSystem = function() {
          if (this.planet) {
            return this.planet.coordinateSystem;
          }
          return null;
        }

        /**
         * Set compass to visible or not
         * @function setCompassVisible
         * @memberof PlanetContext.prototype
         * @param {String} divName Name of the compass div
         * @param {Boolean} visible Visible or not
         */
        PlanetContext.prototype.setCompassVisible = function (divName,visible) {
          console.log("Error, Compass is not implemented for the planet context");
        };

        /**************************************************************************************************************/
        return PlanetContext;

    });
