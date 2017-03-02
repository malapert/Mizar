define(['../Utils/Utils', './RasterLayer', '../Tiling/GeoTiling'],
    function (Utils, RasterLayer, GeoTiling) {
      /**
         @name WMSLayer
         @class
             A layer to display WMS (Web Map Service) data.
         @augments RasterLayer
         @param options Configuration properties for the WMSLayer. See {@link RasterLayer} for base properties :
         <ul>
         <li>baseUrl : the base Url to access the WMS server</li>
         <li>layers : the list of layers to request (WMS parameter)</li>
         <li>srs : the spatial system reference to use, default is EPSG:4326 (WMS parameter)</li>
         <li>format : the file format to request, default is image/jpeg (WMS parameter)</li>
         </ul>
         */
        var WMSLayer = function (options) {
            RasterLayer.prototype.constructor.call(this, options);

            this.baseUrl = options.baseUrl;
            this.tilePixelSize = options.tilePixelSize || 256;
            this.tiling = new GeoTiling(4, 2);
            this.numberOfLevels = options.numberOfLevels || 21;

            // Build the base GetMap URL
            var url = this.baseUrl;
            if (url.indexOf('?', 0) === -1) {
                url += '?service=wms';
            }
            else {
                url += '&service=wms';
            }
            url += "&version=";
            url += options.hasOwnProperty('version') ? options.version : '1.1.1';
            url += "&request=GetMap";
            url += "&layers=" + options.layers;
            url += "&styles=";
            if (options.hasOwnProperty('styles')) {
                url += options.styles;
            }
            url += "&format=";
            url += options.hasOwnProperty('format') ? options.format : 'image/jpeg';
            if (options.hasOwnProperty('transparent')) {
                url += "&transparent=" + options.transparent;
            }
            url += "&width=";
            url += this.tilePixelSize;
            url += "&height=";
            url += this.tilePixelSize;
            if (options.hasOwnProperty('time')) {
                url += "&time=" + options.time;
            }

            this.getMapBaseUrl = url;
        };

        /**************************************************************************************************************/

        Utils.inherits(RasterLayer, WMSLayer);

        /**************************************************************************************************************/

        /**
         * Get an url for the given tile
         * @function getUrl
         * @memberof WMSLayer.prototype
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        WMSLayer.prototype.getUrl = function (tile) {
            // Just add the bounding box to the GetMap URL
            var bound = tile.bound;
            var url = this.getMapBaseUrl;

            url += "&srs=" + tile.config.srs;
            url += "&bbox=";

            url += bound.west;
            url += ",";
            url += bound.south;
            url += ",";
            url += bound.east;
            url += ",";
            url += bound.north;

            return url;
        };

        /**************************************************************************************************************/

        return WMSLayer;

    });
