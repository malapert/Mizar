define(['../Utils/Utils', './RasterLayer', '../Tiling/GeoTiling'],
    function (Utils, RasterLayer, GeoTiling) {
      /**
       @name WMTSLayer
       @class
           Create a layer for imagery data using WMTS protocol.
       @augments RasterLayer
       @param options Configuration properties for the WMTSLayer. See {@link RasterLayer} for base properties :
       <ul>
       <li>baseUrl : the base Url to access the WMS server</li>
       <li>tilePixelSize : size in pixel of tile (256 by default)</li>
       <li>numberOfLevels : number of levels (21 by default)</li>
       <li>startLevel : start level (1 by default)</li>
       </ul>
       */
      var WMTSLayer = function (options) {
            RasterLayer.prototype.constructor.call(this, options);

            this.baseUrl = options.baseUrl;
            this.tilePixelSize = options.tilePixelSize || 256;
            this.tiling = new GeoTiling(4, 2);
            this.numberOfLevels = options.numberOfLevels || 21;
            this.type = "ImageryRaster";
            this.startLevel = options.startLevel || 1;

            // Build the base GetTile URL
            var url = this.baseUrl;
            if (url.indexOf('?', 0) === -1) {
                url += '?service=wmts';
            }
            else {
                url += '&service=wmts';
            }
            url += "&version=";
            url += options.version || '1.0.0';
            url += "&request=GetTile";
            url += "&layer=" + options.layer;
            url += "&tilematrixset=" + options.matrixSet;
            if (options.style) {
                url += "&style=" + options.style;
            }
            url += "&format=";
            if (options.time) {
              url += options.format || 'image/png';
                url += "&time=" + options.time;
            }

            this.getTileBaseUrl = url;
        };

        /**************************************************************************************************************/

        Utils.inherits(RasterLayer, WMTSLayer);

        /**************************************************************************************************************/

        /**
         * Get an url for the given tile
         * @function getUrl
         * @memberof WMTSLayer.prototype
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        WMTSLayer.prototype.getUrl = function (tile) {
            var url = this.getTileBaseUrl;
            url += "&tilematrix=";
            url += tile.level + this.startLevel;
            url += "&tilecol=" + tile.x;
            url += "&tilerow=" + tile.y;

            return url;
        };

        /**************************************************************************************************************/

        return WMTSLayer;

    });
