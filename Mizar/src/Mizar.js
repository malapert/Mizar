define(["./Utils/Stats",
        "./Context/ContextFactory","./Navigation/NavigationFactory","./Layer/LayerFactory",
        "./CoordinateSystem/CoordinateSystemFactory",
        "./AttributionHandler",
        "./DrawingFactory","./Animation/AnimationFactory","./Parser/ParserFactory",
        "./UtilityFactory",
        "./Gui/Compass",
        "./Utils/Numeric","./Utils/Utils","./Utils/ToolBox",
        "./Utils/Event","./Utils/Constants"],
    function (Stats,
              ContextFactory,NavigationFactory,LayerFactory,
              CoordinateSystemFactory,
              AttributionHandler,
              DrawingFactory,AnimationFactory,ParserFactory,
              UtilityFactory,
              Compass,
              Numeric,Utils,ToolBox,
              Event,Constants)
    {
      /**
        @name Mizar
        @class
        Mizar class
        This is the entry point for Mizar API
        @param options Configuration properties for the Mizar object
        <ul>
          <li>canvas : {String} canvas name where Mizar will be drawn</li>
          <li>TODO: complete it</li>
        </ul>
      */
      var Mizar = function (options) {
          Event.prototype.constructor.call(this);

          if (options === undefined) {
            console.log("Error : no options found");
            return;
          }

          if (options.canvas === undefined) {
            console.log("Error : no canvas found");
            return;
          }

          if (typeof options.canvas === "string") {
            this.canvas = document.getElementById(options.canvas);
          } else {
            this.canvas = options.canvas;
          }

          // Init all factories
          this.ContextFactory = new ContextFactory(this);
          this.NavigationFactory = new NavigationFactory();
          this.LayerFactory = new LayerFactory();
          this.CoordinateSystemFactory = new CoordinateSystemFactory();
          this.DrawingFactory = new DrawingFactory();
          this.AnimationFactory = new AnimationFactory();
          this.ParserFactory = new ParserFactory();
          this.UtilityFactory = new UtilityFactory();

          this.ToolBox = new ToolBox(this,options);

          this.planetContext = null;
          this.skyContext = null;

          this.currentNavigation = null;
          this.navigations = [];

          this.renderContext = null;

          if (options.skyContext) {
            this.skyContext = this.ContextFactory.create(this.CONTEXT.Sky,options.skyContext);

            if (options.skyContext.projection) {
                  options.skyContext.projection =  this.CoordinateSystemFactory.create(options.skyContext.projection);
            }
           }

			  if (options.planetContext) {
				      if (this.renderContext) {
					           options.planetContext.renderContext = this.renderContext;
				      }
				      if (options.planetContext.projection) {
				            options.planetContext.projection =  this.CoordinateSystemFactory.create(options.planetContext.projection);
				      }
				      this.planetContext = this.ContextFactory.create(this.CONTEXT.Planet,options.planetContext);
        }

        if ((options.compass) && (options.compass === true)) {
            this.compass = new Compass({
                element: "compassDiv",
                planet: this.planetContext.planet,
                navigation: this.navigation,
                coordSystem: this.planetContext.planet.coordinateSystem.type
                //isMobile: options.isMobile,
                //mizarBaseUrl: options.mizarBaseUrl
            });
            console.log(this.compass);
        }
      };

      /**************************************************************************************************************/

      Utils.inherits(Event, Mizar);

      /**************************************************************************************************************/

      Mizar.prototype.ANIMATION =  Constants.ANIMATION;

      Mizar.prototype.LAYER =  Constants.LAYER;

      Mizar.prototype.CONTEXT = Constants.CONTEXT;

      Mizar.prototype.PROJECTION = Constants.PROJECTION;


      /**
       * Render the canvas
       * @function render
       * @memberof Mizar.prototype
       */
       Mizar.prototype.render = function() {
          this.renderContext.frame();
       };

       /**
        * Dispose Mizar
        * @function dispose
        * @memberof Mizar.prototype
        */
        Mizar.prototype.dispose = function() {
          if (this.planetContext) {
            this.planetContext.dispose();
          } else if (this.skyContext) {
            this.skyContext.dispose();
          }
        };
        /**
         * Destroy
         * @function destroy
         * @memberof Mizar.prototype
         */
         Mizar.prototype.destroy = function() {
           if (this.planetContext) {
             this.planetContext.destroy();
           } else if (this.skyContext) {
             this.skyContext.destroy();
           }
         };

         /**
          * Return image as base64
          * @function getImageData
          * @memberof Mizar.prototype
          *
          * @param {String} canvasName Canvas
          * @return {String} Image data as Base64
          */
         Mizar.prototype.getImageData = function(canvasName) {
           this.render();
           canvas = document.getElementById(canvasName);
           if (canvas) {
             return canvas.toDataURL();
           }
           return null;
         }

         /*****************************************************************************************************
          *                       Management functions
          *****************************************************************************************************
         */

      /**
       * Create and get Stats Object
       * @function createStats
       * @memberof Mizar.prototype
       *
       * @param {String} view
       * @param options Configuration properties for stats. See {@link Stats} for properties
       * @return {Stats}
       */
      Mizar.prototype.createStats = function (options) {
        if (this.skyContext) {
          this.Stats = new Stats( this.skyContext, options );
        } else {
          if (this.planetContext) {
            this.Stats = new Stats( this.planetContext,options);
          } else {
            console.log("No context");
          }
        }
        return this.Stats;
      };

      /**
       * Create and get AttributionHandler Object
       * @function createAttributionHandler
       * @memberof Mizar.prototype
       *
       * @param {String} view
       * @param options Configuration properties for attribution handler. See {@link AttributionHandler} for properties
       * @return {Stats}
       */
      Mizar.prototype.createAttributionHandler = function (view,options) {
        this.AttributionHandler = new AttributionHandler( view, options );

        return this.AttributionHandler;
      };

      /**
       * Return the Numeric utility
       * @function getUtilityNumeric
       * @memberof Mizar.prototype
       * @return {Numeric}
       */
      Mizar.prototype.getUtilityNumeric = function () {
        return Numeric;
      };

      /**
       * Return the Utils utility
       * @function getUtils
       * @memberof Mizar.prototype
       * @return {Utils}
       */
      Mizar.prototype.getUtils = function () {
        return Utils;
      };

      /**
       * Add a layer to the planet context
       * @function addPlanetLayer
       * @memberof Mizar.prototype
       * @param {BaseLayer} layer Layer to add to the planet context
       */
      Mizar.prototype.addPlanetLayer = function (layer) {
        if (this.planetContext) {
          this.planetContext.addLayer(layer);
        } else {
          // TODOFL Manage error
          console.log("No planet context defined");
        }
      };

      /**
       * Set base imagery for planet context
       * @function setPlanetBaseImagery
       * @memberof Mizar.prototype
       * @param {BaseLayer} layer Layer to set as planet base imagery
       */
      Mizar.prototype.setPlanetBaseImagery = function (layer) {
        if (this.planetContext) {
          this.planetContext.setBaseImagery(layer);
        } else {
          // TODOFL Manage error
          console.log("No planet context defined");
        }
      };

      /**
       * Set base elevation for planet context
       * @function setBaseElevation
       * @memberof Mizar.prototype
       * @param {BaseLayer} layer Layer to set as planet base elevation
       */
      Mizar.prototype.setBaseElevation = function (layer) {
        if (this.planetContext) {
          this.planetContext.setBaseElevation(layer);
        } else {
          // TODOFL Manage error
          console.log("No planet context defined");
        }
      };

      /**
       * Set base imagery for sky context
       * @function setSkyBaseImagery
       * @memberof Mizar.prototype
       * @param {BaseLayer} layer Layer to set as sky base imagery
       */
      Mizar.prototype.setSkyBaseImagery = function (layer) {
        if (this.skyContext) {
          this.skyContext.setBaseImagery(layer);
        } else {
          // TODOFL Manage error
          console.log("No sky context defined");
        }
      };


      /**
       * Add a layer to the sky context
       * @function addSkyLayer
       * @memberof Mizar.prototype
       * @param {BaseLayer} layer Layer to add to the sky context
       */
      Mizar.prototype.addSkyLayer = function (layer) {
        if (this.skyContext) {
          this.skyContext.addLayer(layer);
        } else {
          // TODOFL Manage error
          console.log("No sky context defined");
        }
      };

      /**
       * Return the Event utility
       * @function getEvent
       * @memberof Mizar.prototype
       * @return {Event}
       */
      Mizar.prototype.getEvent = function () {
        return Event;
      };

      // Make object MIZAR available in caller web page
      window.Mizar = Mizar;

      return Mizar;
    });
