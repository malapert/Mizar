define(['../CoordinateSystem/CoordinateSystem','../Renderer/RenderContext', '../Tiling/TileManager',
        '../Tiling/Tile', '../Renderer/VectorRendererManager', '../Renderer/Ray', '../Renderer/GeoBound',
        '../Utils/Event', '../Utils/Utils',
        '../CoordinateSystem/CoordinateSystemFactory'],
    function (CoordinateSystem, RenderContext, TileManager,
              Tile, VectorRendererManager, Ray, GeoBound,
              Event, Utils,
              CoordinateSystemFactory) {
        /**
         @name Planet
         @class
             Create a virtual planet in a HTML canvas element, passed in options parameter.
         The virtual planet data is set using setBaseImage/addLayer methods.
         @augments Event
         @param options Configuration properties for the Planet :
         <ul>
         <li>canvas : the canvas for WebGL, can be string (id) or a canvas element</li>
         <li>renderContext : <RenderContext> object to use the existing render context</li>
         <li>backgroundColor : the background color of the canvas (an array of 4 floats)</li>
         <li>shadersPath : the path to shaders file</li>
         <li>continuousRendering: if true rendering is done continuously, otherwise it is done only if needed</li>
         <li>defaultColor : Texture color without imagery provider</li>
         </ul>
         */
        var Planet = function (options) {
            Event.prototype.constructor.call(this);
            if (options.coordinateSystem) {

                if (options.coordinateSystem.geoBound ) {
                  // coordinate system always created
                  this.coordinateSystem = options.coordinateSystem;
                } else {
                  // create it
                  options.coordinateSystem = new CoordinateSystemFactory().create(options.coordinateSystem);
                  this.coordinateSystem = options.coordinateSystem;
                }
            }
            else {
                // Create a default in WGS84
                this.coordinateSystem = new CoordinateSystem({geoideName:"WGS84"});
            }
            if (!options.renderContext) {
                this.renderContext = new RenderContext(options);
            }
            else {
                this.renderContext = options.renderContext;
            }
            this.continuousRendering = options.continuousRendering || true;
            this.tileManager = new TileManager(this, options);
            this.vectorRendererManager = new VectorRendererManager(this);
            this.attributionHandler = null;
            this.baseImagery = null;
            this.preRenderers = [];
            this.nbCreatedLayers = 0;

            this.tileManager.addPostRenderer(this.vectorRendererManager);

            this.renderContext.renderers.push(this);
            this.renderContext.requestFrame();
        };

        /**************************************************************************************************************/

        Utils.inherits(Event, Planet);

        /**************************************************************************************************************/

         /**
          * Dispose the Planet and all its ressources
          * @function dispose
          * @memberof Planet.prototype
          */
        Planet.prototype.dispose = function () {
            this.tileManager.tilePool.disposeAll();
            this.tileManager.reset();
        };

        /**************************************************************************************************************/

         /**
          * Destroy the Planet
          * @function destroy
          * @memberof Planet.prototype
          */
        Planet.prototype.destroy = function () {
            this.dispose();
            this.tileManager.removePostRenderer(this.vectorRendererManager);
            this.renderContext.renderers.splice(this.renderContext.renderers.indexOf(this.globe), 1);
        };


        /**************************************************************************************************************/

        /**
         * Refresh rendering, must be called when canvas size is modified
         * @function refresh
         * @memberof Planet.prototype
         */
        Planet.prototype.refresh = function () {
            this.renderContext.requestFrame();
        };

        /**************************************************************************************************************/

         /**
          * Set the base imagery layer for the Planet
          * @function setBaseImagery
          * @memberof Planet.prototype
          * @param {RasterLayer} layer the layer to use, must be an imagery RasterLayer
          */
        Planet.prototype.setBaseImagery = function (layer) {
            if (this.baseImagery === layer) {
                return;
            }

            if (this.baseImagery) {
                this.removeLayer(this.baseImagery);
                this.baseImagery = null;
            }
            // Attach the layer to the globe
            if (layer) {
                layer._overlay = false;
                this.addLayer(layer);
                this.baseImagery = layer;
            }
            // Modify the tile manager after the layer has been attached
            this.tileManager.setImageryProvider(layer);
        };

        /**
         * Get the base imagery layer for the Planet
         * @function getBaseImagery
         * @memberof Planet.prototype
         * @returns {RasterLayer} the layer used
         */
       Planet.prototype.getBaseImagery = function () {
           return this.baseImagery;
       };

        /**************************************************************************************************************/

         /**
          * Set the base elevation layer for the Planet
          * @function setBaseElevation
          * @memberof Planet.prototype
          * @param {RasterLayer} layer the layer to use, must be an elevation RasterLayer
          */
        Planet.prototype.setBaseElevation = function (layer) {
            if (this.tileManager.elevationProvider) {
                this.removeLayer(this.tileManager.elevationProvider);
            }
            this.tileManager.setElevationProvider(layer);
            if (layer) {
                layer._overlay = false;
                this.addLayer(layer);
            }
        };

        /**
         * Get the base elevation layer for the globe
         * @function getBaseElevation
         * @memberof Planet.prototype
         * @returns {RasterLayer} the layer used
         */
       Planet.prototype.getBaseElevation = function (layer) {
           return this.tileManager.elevationProvider;
       };


        /**************************************************************************************************************/

         /**
          * Add a layer to the Planet.
          * A layer must be added to be visualized on the Planet.
          * @function addLayer
          * @memberof Planet.prototype
          * @param {BaseLayer} layer the layer to add
          */
        Planet.prototype.addLayer = function (layer) {
            var currentPlanet = this;
            if (layer.url) {
        			$.ajax({
        					url: layer.url,
        					success: function(data)
        					{
          					layer.addFeatureCollection( data );
                    layer.id = currentPlanet.nbCreatedLayers;
                    layer._attach(currentPlanet);
                    currentPlanet.renderContext.requestFrame();
                    currentPlanet.nbCreatedLayers++;
                    if (layer.callback) {
                      layer.callback(data);
                    }
        					}
        			});
            } else {
              layer.id = this.nbCreatedLayers;
              layer._attach(this);
              this.renderContext.requestFrame();
              this.nbCreatedLayers++;
            }
        };

        /**************************************************************************************************************/

        /**
         * Remove a layer.
         * @function removeLayer
         * @memberof Planet.prototype
         * @param {BaseLayer} layer the layer to remove
         */
        Planet.prototype.removeLayer = function (layer) {
            layer._detach();
            this.renderContext.requestFrame();
        };

        /**************************************************************************************************************/

         /**
          * Add an animation
          * @function addAnimation
          * @memberof Planet.prototype
          * @param {Animation} anim the animation to add
          */
        Planet.prototype.addAnimation = function (anim) {
            anim.renderContext = this.renderContext;
        };

        /**************************************************************************************************************/

        /**
         * Remove an animation
         * @function removeAnimation
         * @memberof Planet.prototype
         * @param {Animation} anim the animation to remove
         */
        Planet.prototype.removeAnimation = function (anim) {
            anim.renderContext = null;
        };

        /**************************************************************************************************************/

         /**
          * Get the elevation at a geo position
          * @function getElevation
          * @memberof Planet.prototype
          * @param {Float} lon the longitude in degree
          * @param {Float} lat  the latitude in degree
          * @return {Float} the elevation in meter at the position [lon,lat]
          */
        Planet.prototype.getElevation = function (lon, lat) {
            // Use imagery provider tiling if defined, otherwise use globe default one
            var tiling = this.tileManager.tiling;
            if (this.baseImagery) {
                tiling = this.baseImagery.tiling;
            }
            var levelZeroTile = this.tileManager.level0Tiles[tiling.lonlat2LevelZeroIndex(lon, lat)];
            if (Tile.State && levelZeroTile && levelZeroTile.state === Tile.State.LOADED) {
                return levelZeroTile.getElevation(lon, lat);
            } else {
                return 0.0;
            }
        };

        /**************************************************************************************************************/

         /**
          * Get the viewport geo bound
          * @function getViewportGeoBound
          * @memberof Planet.prototype
          * @param transformCallback Callback transforming the frustum/globe intersection coordinates if needed
          * @return {GeoBound} the geo bound of the viewport
          */
        Planet.prototype.getViewportGeoBound = function (transformCallback) {
            var rc = this.renderContext;
            var tmpMat = mat4.create();

            // Compute eye in world space
            mat4.inverse(rc.viewMatrix, tmpMat);
            var eye = [tmpMat[12], tmpMat[13], tmpMat[14]];

            // Compute the inverse of view/proj matrix
            mat4.multiply(rc.projectionMatrix, rc.viewMatrix, tmpMat);
            mat4.inverse(tmpMat);

            // Transform the four corners of the frustum into world space
            // and then for each corner compute the intersection of ray starting from the eye with the earth
            var points = [[-1, -1, 1, 1], [1, -1, 1, 1], [-1, 1, 1, 1], [1, 1, 1, 1]];
            var earthCenter = [0, 0, 0];
            for (var i = 0; i < 4; i++) {
                mat4.multiplyVec4(tmpMat, points[i]);
                vec3.scale(points[i], 1.0 / points[i][3]);
                vec3.subtract(points[i], eye, points[i]);
                vec3.normalize(points[i]);

                var ray = new Ray(eye, points[i]);
                var t = ray.sphereIntersect(earthCenter, this.coordinateSystem.geoide.radius);
                //var t = ray.sphereIntersect(earthCenter, 15);
                if (t < 0.0) {
                    return null;
                }
                var pos3d = ray.computePoint(t);
                points[i] = this.coordinateSystem.from3DToGeo(pos3d);
                if (transformCallback) {
                    points[i] = transformCallback(points[i]);
                }
            }

            var geoBound = new GeoBound();
            geoBound.computeFromCoordinates(points);

            return geoBound;
        };

        /**************************************************************************************************************/

         /**
          * Get the lon-lat from a pixel.
          * The pixel is expressed in the canvas frame, i.e. (0,0) corresponds to the lower-left corner of the pixel
          * @function getLonLatFromPixel
          * @memberof Planet.prototype
          * @param    {Int} x the pixel x coordinate
          * @param    {Int} y the pixel y coordinate
          * @return   {Float[]} an array of two numbers [lon,lat] or null if the pixel is not on the globe
          */
        Planet.prototype.getLonLatFromPixel = function (x, y) {
          var ray = Ray.createFromPixel(this.renderContext, x, y);
          var intersection;
          if (this.coordinateSystem.isFlat) {
            intersection = ray.planeIntersect([0, 0, 0], [0, 0, 1]);
          } else {
            intersection = ray.sphereIntersect([0, 0, 0], this.coordinateSystem.geoide.radius);
          }

          if (intersection >= 0) {
            var pos = this.coordinateSystem.from3DToGeo(ray.computePoint(intersection));
            if (!pos || pos[0] < -180 || pos[0] > 180 || pos[1] < -90 || pos[1] > 90 || isNaN(pos[0]) || isNaN(pos[1]) ) {
              return null;
            } else {

              return pos;
            }
          } else {
            return null;
          }
        };

        /**************************************************************************************************************/

         /**
          * Get pixel from lon-lat
          * The pixel is expressed in the canvas frame, i.e. (0,0) corresponds to the lower-left corner of the pixel
          * @function getPixelFromLonLat
          * @memberof Planet.prototype
          * @param {Float} lon    the longitude
          * @param {Float} lat    the latitude
          * @return {Int[]}   an array of two numbers [x,y] or null if the pixel is not on the globe
          */
        Planet.prototype.getPixelFromLonLat = function (lon, lat) {
            var pos3d = vec3.create();
            this.coordinateSystem.fromGeoTo3D([lon, lat], pos3d);
            var pixel = this.renderContext.getPixelFrom3D(pos3d[0], pos3d[1], pos3d[2]);
            return pixel;
        };

        /**************************************************************************************************************/

         /**
          * Render the Planet
          * The pixel is expressed in the canvas frame, i.e. (0,0) corresponds to the lower-left corner of the pixel
          * (private for now because it is automatically called in requestAnimationFrame)
          * @function render
          * @memberof Planet.prototype
          * @private
          */
        Planet.prototype.render = function () {
            // Call pre-renderers (only in 3D mode, no atmosphear for 2D)
            if (this.coordinateSystem.isFlat === false) {
              for (var i = 0; i < this.preRenderers.length; i++) {
                  this.preRenderers[i].preRender();
              }
            }
          // Render tiles
          this.tileManager.render();
        };

        /**************************************************************************************************************/

         /**
          * Set coordinate system
          * @function setCoordinateSystem
          * @memberof Planet.prototype
          * @param {CoordinateSystem} coordinateSystem Coordinate system
          */
        Planet.prototype.setCoordinateSystem = function (coordinateSystem) {
            this.coordinateSystem = coordinateSystem;
            this.tileManager.tileConfig.coordinateSystem = coordinateSystem;
            this.dispose();
            this.tileManager.level0Tiles = this.tileManager.tiling.generateLevelZeroTiles(this.tileManager.tileConfig, this.tileManager.tilePool);
        };

        /**
         * Get coordinate system
         * @function getCoordinateSystem
         * @memberof Planet.prototype
         * @return {CoordinateSystem} coordinateSystem Coordinate system
         */
       Planet.prototype.getCoordinateSystem = function () {
           return this.coordinateSystem;
       };


        /**************************************************************************************************************/

         /**
          * Display some render statistics
          * @function getRenderStats
          * @private
          * @memberof Planet.prototype
          * @return {String} render statistics
          */
        Planet.prototype.getRenderStats = function () {
            return "# rendered tiles : " + this.tileManager.tilesToRender.length;
        };

        /**
         * Get render context
         * @function getRenderContext
         * @memberof Planet.prototype
         *
         * @return {RenderContext} Render context
         */
         Planet.prototype.getRenderContext = function () {
           return this.renderContext;
         }

         /**
          * Set render context
          * @function setRenderContext
          * @memberof Planet.prototype
          *
          * @param {RenderContext} context Render context
          */
          Planet.prototype.setRenderContext = function (context) {
            this.renderContext = context;
          }

        /**************************************************************************************************************/

        return Planet;

    });
