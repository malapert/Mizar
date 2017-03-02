define(['../Utils/Utils', './WMSLayer'],
    function (Utils, WMSLayer) {

      /**
       @name WMSElevationLayer
       @class
           Create a layer for elevation data using WMS protocol.
       @augments WMSLayer
       @param options Configuration properties for the WMSElevationLayer. See {@link WMSLayer} for base properties :
       <ul>
       <li>tilePixelSize : size in pixel of tile (33 by default)</li>
       </ul>
       */
        var WMSElevationLayer = function (options) {
            options.format = 'image/x-aaigrid';
            options.tilePixelSize = options.tilePixelSize || 33;
            WMSLayer.prototype.constructor.call(this, options);
        };

        Utils.inherits(WMSLayer, WMSElevationLayer);


        /**************************************************************************************************************/

        /**
         * Parse a elevation response
         * @function parseElevations
         * @memberof WMSElevationLayer.prototype
         * @param {String} text Response as text
         * @return {Array} Array of float
         */
        WMSElevationLayer.prototype.parseElevations = function (text) {
            var elevations = [];
            var lines = text.trim().split('\n');

            for (var i = 5; i < lines.length; i++) {
                var elts = lines[i].trim().split(/\s+/);
                for (var n = 0; n < elts.length; n++) {
                    elevations.push(parseInt(elts[n]));
                }
            }

            return elevations;
        };

        /**************************************************************************************************************/

        return WMSElevationLayer;

    });
