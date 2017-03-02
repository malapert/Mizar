define(['../Context/Planet', '../CoordinateSystem/EquatorialCoordinateSystem','../CoordinateSystem/GalacticCoordinateSystem', '../Tiling/TileManager', '../Tiling/TilePool', '../Utils/Utils'],
    function (Planet, EquatorialCoordinateSystem,GalacticCoordinateSystem,TileManager, TilePool, Utils) {
      /**
       @name Sky
       @class
           Create a virtual sky in a HTML canvas element, passed in options parameter.
       The virtual sky data is set using setBaseImage/addLayer methods.
       @augments Globe
       @param options Configuration properties for the Sky :
       <ul>
       <li>canvas : the canvas for WebGL, can be string (id) or a canvas element</li>
       <li>renderContext : <RenderContext> object to use the existing render context</li>
       <li>backgroundColor : the background color of the canvas (an array of 4 floats)</li>
       <li>shadersPath : the path to shaders file</li>
       <li>continuousRendering: if true rendering is done continuously, otherwise it is done only if needed</li>
       </ul>
       */
        var Sky = function (options) {
            options.geoideName = "Sky";
            options.coordinateSystem = new EquatorialCoordinateSystem(options);
            Planet.prototype.constructor.call(this,options);

            this.isEnable = true;

            this.isSky = true;

            this.tilePool = new TilePool(this.renderContext);

            options.galactic = "GAL";
            this.tileManagers = {
                'EQ': this.tileManager,
                'GAL': new TileManager(this, options)
            };

            this.renderContext.requestFrame();
        };

        /**************************************************************************************************************/
        Utils.inherits(Planet, Sky);

        /**************************************************************************************************************/

        /**
         * Dispose the sky and all its ressources
         * @function dispose
         * @memberof Sky.prototype
         */
        Sky.prototype.dispose = function () {
            for (var x in this.tileManagers) {
                this.tileManagers[x].tilePool.disposeAll();
                this.tileManagers[x].reset();
            }
        };

        /**************************************************************************************************************/

        /**
         * Set the base imagery layer for the sky
         * @function setBaseImagery
         * @memberof Sky.prototype
         * @param {RasterLayer} layer the layer to use, must be an imagery RasterLayer
         */
        Sky.prototype.setBaseImagery = function (layer) {
            if (this.baseImagery === layer) {
                return;
            }

            if (this.baseImagery) {
                this.removeLayer(this.baseImagery);
                this.tileManagers[this.baseImagery.coordSystem].setImageryProvider(null);
                this.baseImagery = null;
            }

            // Attach the layer to the globe
            if (layer) {
                layer._overlay = false;
                this.addLayer(layer);

                // Modify the tile manager after the layer has been attached
                this.tileManagers[layer.coordSystem].setImageryProvider(layer);
                this.baseImagery = layer;
            }

        };
        /**
         * Get the base imagery layer for the sky
         * @function getBaseImagery
         * @memberof Sky.prototype
         * @return {RasterLayer} layer the layer to use, must be an imagery RasterLayer
         */
        Sky.prototype.getBaseImagery = function (layer) {
            return this.baseImagery;
        };

        /**
         * Get the tile manager
         * @function getTileManager
         * @memberof Sky.prototype
         * @return {TileManager} Tile manager
         */
        Sky.prototype.getTileManager = function () {
            return this.tileManager;
        };

        /**************************************************************************************************************/
         /**
          * Render the sky
          * (private for now because it is automatically called in requestAnimationFrame)
          * @function render
          * @memberof Sky.prototype
          * @private
          */
        Sky.prototype.render = function () {
            // Render tiles manager
            if (this.isEnable) {
              this.tileManagers.GAL.render();
              this.tileManagers.EQ.render();
            }
        };

        /**
         * Enable the sky
         * @function enable
         * @memberof Sky.prototype
         */
        Sky.prototype.enable = function () {
            this.isEnable = true;
            // Render tiles manager
            this.tileManagers.GAL.render();
            this.tileManagers.EQ.render();
        };

        /**
         * Disable the sky
         * @function disable
         * @memberof Sky.prototype
         */
        Sky.prototype.disable = function () {
            this.isEnable = false;
            // Render tiles manager
            this.tileManagers.GAL.render(false);
            this.tileManagers.EQ.render(false);
        };

        /**************************************************************************************************************/

        return Sky;

    });
