define(['../Utils/Utils', './BaseLayer', '../Renderer/FeatureStyle'],
    function (Utils, BaseLayer, FeatureStyle) {
        /**
         @name VectorLayer
         @class
             Create a layer to display vector data in GeoJSON format.
         @augments BaseLayer
         @param options Configuration properties for VectorLayer. See {@link BaseLayer} for base properties :
         <ul>
         <li>style : the style to use. See {@link FeatureStyle}</li>
         <li>minLevel : minimum rendering level depending on tile level</li>
         <li>maxLevel : maximum rendering level depending on tile level</li>
         <li>url : the url of json data to load when attaching to Planet</li>
         <li>callback : the callback function called when data are loaded. Data loaded are passed in parameter of the function.</li>
         </ul>
         */
        var VectorLayer = function (options) {
            BaseLayer.prototype.constructor.call(this, options);

            if (options && options.url) {
              this.url = options.url;
            } else {
              this.url = null;
            }

            if (options && options.callback) {
              this.callback = options.callback;
            } else {
              this.callback = null;
            }

            // Set style
            if (options && options.style) {
                this.style = options.style;
            } else {
                this.style = new FeatureStyle();
            }

            this.minLevel = options && options.hasOwnProperty('minLevel') ? options.minLevel : 0.0;
            this.maxLevel = options && options.hasOwnProperty('maxLevel') ? options.maxLevel : 15.0;

            this.features = [];
        };

        /**************************************************************************************************************/

        Utils.inherits(BaseLayer, VectorLayer);

        /**************************************************************************************************************/

        /**
         Attach the vector layer to the planet
         * @function _attach
         * @memberof VectorLayer.prototype
         * @param {Planet} g Planet
         * @private
         */
        VectorLayer.prototype._attach = function (g) {
            BaseLayer.prototype._attach.call(this, g);

            // Add the feature to renderers
            for (var i = 0; i < this.features.length; i++) {
                this._addFeatureToRenderers(this.features[i]);
            }
        };

        /**************************************************************************************************************/

        /**
         * Detach the vector layer from the planet
         * @function _detach
         * @memberof VectorLayer.prototype
         * @private
         */
        VectorLayer.prototype._detach = function () {
            // Remove feature from renderers
            for (var i = 0; i < this.features.length; i++) {
                this._removeFeatureFromRenderers(this.features[i]);
            }

            BaseLayer.prototype._detach.call(this);
        };

        /**************************************************************************************************************/

        /**
         * Adds a feature collection, in GeoJSON format
         *	@function addFeatureCollection
         *	@memberof VectorLayer.prototype
         *	@param {GeoJSON} featureCollection Feature Collection
        */
        VectorLayer.prototype.addFeatureCollection = function (featureCollection) {
            // Note : use property defined as ['']  to avoid renaming when compiled in advanced mode with the closure compiler
            var features = featureCollection.features;
            if (features) {
                for (var i = 0; i < features.length; i++) {
                    this.addFeature(features[i]);
                }
            }
        };

        /**************************************************************************************************************/

        /**
         * Removes a feature collection, in GeoJSON format
         * @function removeFeatureCollection
       	 * @memberof VectorLayer.prototype
         * @param {GeoJSON} featureCollection Feature Collection
         */
        VectorLayer.prototype.removeFeatureCollection = function (featureCollection) {
            // Note : use property defined as ['']  to avoid renaming when compiled in advanced mode with the closure compiler
            var features = featureCollection.features;
            if (features) {
                for (var i = 0; i < features.length; i++) {
                    this.removeFeature(features[i]);
                }
            }
        };

        /**************************************************************************************************************/

         /**
          * Add a feature to renderers
          *	@function _addFeatureToRenderers
          * @memberof VectorLayer.prototype
          *	@param {GeoJSON} feature Feature
          * @private
          */
        VectorLayer.prototype._addFeatureToRenderers = function (feature) {
            var geometry = feature.geometry;

            // Manage style, if undefined try with properties, otherwise use defaultStyle
            var style = this.style;
            var props = feature.properties;
            if (props && props.style) {
                style = props.style;
            }

            // Manage geometry collection
            if (geometry.type === "GeometryCollection") {
                var geoms = geometry.geometries;
                for (var i = 0; i < geoms.length; i++) {
                    this.planet.vectorRendererManager.addGeometry(this, geoms[i], style);
                }
            }
            else {
                // Add geometry to renderers
                this.planet.vectorRendererManager.addGeometry(this, geometry, style);
            }
        };

        /**************************************************************************************************************/

        /**
         * Remove a feature from renderers
         * @function _removeFeatureFromRenderers
         * @memberof VectorLayer.prototype
         * @param {GeoJSON} feature Feature
         * @private
        */
        VectorLayer.prototype._removeFeatureFromRenderers = function (feature) {
            var geometry = feature.geometry;

            // Manage geometry collection
            if (geometry.type === "GeometryCollection") {
                var geoms = geometry.geometries;
                var res = false;
                if (this.planet && this.planet.vectorRendererManager) {
                  for (var i = 0; i < geoms.length; i++) {
                      res = this.planet.vectorRendererManager.removeGeometry(geoms[i], this);
                  }
                }
                return res;
            }
            else {
              if (this.planet && this.planet.vectorRendererManager) {
                return this.planet.vectorRendererManager.removeGeometry(geometry, this);
              }
            }
        };

        /**************************************************************************************************************/
        /**
         * Add a feature to the layer
         * @function addFeature
         * @memberof VectorLayer.prototype
         * @param {GeoJSON} feature Feature
         */
        VectorLayer.prototype.addFeature = function (feature) {
            // Check feature geometry : only add valid feature
            var geometry = feature.geometry;
            if (!geometry || !geometry.type) {
                return;
            }
            this.features.push(feature);

            // Add features to renderer if layer is attached to planet
            if (this.planet) {
                this._addFeatureToRenderers(feature);
                if (this._visible) {
                  this.planet.renderContext.requestFrame();
                }
            }
        };

        /**************************************************************************************************************/
        /**
         * Remove a feature from the layer
         * @function removeFeature
         * @memberof VectorLayer.prototype
         * @param {GeoJSON} feature Feature
        */
        VectorLayer.prototype.removeFeature = function (feature) {
            var index = this.features.indexOf(feature);
            this.features.splice(index, 1);
            if (this.planet) {
                this._removeFeatureFromRenderers(feature);
                if (this._visible) {
                  this.planet.renderContext.requestFrame();
                }
            }
        };

        /**************************************************************************************************************/

       /**
        * Remove all feature from the layer
        * @function removeAllFeatures
        * @memberof VectorLayer.prototype
       */
       VectorLayer.prototype.removeAllFeatures = function () {
            // Remove feature from renderers
            if (this.planet) {
                for (var i = 0; i < this.features.length; i++) {
                    this._removeFeatureFromRenderers(this.features[i]);
                }
            }
            this.features.length = 0;

            // Refresh rendering if needed
            if (this.planet && this._visible) {
                this.planet.renderContext.requestFrame();
            }
        };

        /**************************************************************************************************************/
        /**
         * Modify feature style
         * @function modifyFeatureStyle
         * @memberof VectorLayer.prototype
         * @param {GeoJSON} feature Feature
         * @param {FeatureStyle} style Feature style
         */
       VectorLayer.prototype.modifyFeatureStyle = function (feature, style) {
          if (this._removeFeatureFromRenderers(feature)) {
            feature.properties.style = style;
            this._addFeatureToRenderers(feature);
          }
        };

        /**************************************************************************************************************/

         /**
          * Modify the vector layer style
          *	@function modifyStyle
          *	@memberof VectorLayer.prototype
          * @param {FeatureStyle} style Feature style
          */
        VectorLayer.prototype.modifyStyle = function (style) {
            var i;
            for (i = 0; i < this.features.length; i++) {
                this._removeFeatureFromRenderers(this.features[i]);
            }

            this.style = style;

            for (i = 0; i < this.features.length; i++) {
                this._addFeatureToRenderers(this.features[i]);
            }
        };

        /**************************************************************************************************************/

        /**
         * Get the vector layer style
         * @function getStyle
         * @memberof VectorLayer.prototype
         * @return {FeatureStyle}  Feature style
         */
        VectorLayer.prototype.getStyle = function () {
          return this.style;
        };

        /**
         * Set the vector layer style
         * @function setStyle
         * @memberof VectorLayer.prototype
         * @param {FeatureStyle} arg Feature style
         */
        VectorLayer.prototype.setStyle = function (arg) {
          this.style = arg;
        };

        return VectorLayer;

    });
