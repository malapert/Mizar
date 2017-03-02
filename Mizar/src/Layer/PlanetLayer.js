/**
 * Planet renderer/layer module
 */
define(["jquery", "underscore-min", "./BaseLayer", "./WMSLayer", "./WCSElevationLayer", "../Utils/Utils"],
    function ($, _ , BaseLayer, WMSLayer, WCSElevationLayer, Utils) {

      /**
        @name PlanetLayer
        @class
        This layer draws a planet layer
        @augments BaseLayer
        */
        var PlanetLayer = function (options) {

            BaseLayer.prototype.constructor.call(this, options);
            this.name = options.name;
            this.baseImageries = [];
            this.layers = [];
            this.category = "Planets";
            this.nameResolver = options.nameResolver;

            this.typeLayer = "Planet";

            for (var i = 0; i < options.baseImageries.length; i++) {
                var planetDesc = options.baseImageries[i];
                planetDesc = $.extend({}, options, planetDesc);
                var gwLayer = new WMSLayer(planetDesc);
                gwLayer.background = true;
                gwLayer.category = "background";
                gwLayer.type = "WMS";
                this.baseImageries.push(gwLayer);
            }
            if (options.elevation) {
                this.elevationLayer = new WCSElevationLayer(options.elevation);
            }
        };

        /**************************************************************************************************************/

        Utils.inherits(BaseLayer, PlanetLayer);

        /**************************************************************************************************************/

        /**
         * Attach to a planet
         * @function _attach
         * @memberof PlanetLayer.prototype
         * @param {Planet} g Planet
         * @private
         */

        PlanetLayer.prototype._attach = function (g) {
            BaseLayer.prototype._attach.call(this, g);
            var baseImagery = _.findWhere(this.baseImageries, {_visible: true});
            // Set first WMS layer as base imagery
            if (!baseImagery) {
                baseImagery = this.baseImageries[0];
            }
            this.planet.setBaseImagery(baseImagery);
            // Set elevation if exists
            if (this.elevationLayer) {
                this.planet.setBaseElevation(this.elevationLayer);
            }
            baseImagery.setVisible(true);

            for (var i = 0; i < this.layers.length; i++) {
                this.planet.addLayer(this.layers[i]);
            }
        };

        /**************************************************************************************************************/

        /**
         * Detach
         * @function _detach
         * @memberof PlanetLayer.prototype
         * @private
         */
        PlanetLayer.prototype._detach = function () {
            this.planet.setBaseImagery(null);
            for (var i = 0; i < this.layers.length; i++) {
                this.planet.removeLayer(this.layers[i]);
            }
            BaseLayer.prototype._detach.call(this);
        };

        /**************************************************************************************************************/

        return PlanetLayer;

    });
