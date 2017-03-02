define(['../Utils/Utils', './RasterLayer', '../Tiling/MercatorTiling'], function (Utils, RasterLayer, MercatorTiling) {

    /**************************************************************************************************************/


    /**
     @name OSMLayer
     @class
         A layer to display data coming from OpenStreetMap server.
     @augments RasterLayer
     @param options Configuration properties for the OSMLayer. See {@link RasterLayer} for base properties :
     <ul>
     <li>baseUrl : the base Url to access the OSM server</li>
     </ul>
     */
    var OSMLayer = function (options) {
        RasterLayer.prototype.constructor.call(this, options);
        this.tilePixelSize = options.tilePixelSize || 256;
        this.tiling = new MercatorTiling(options.baseLevel || 2);
        this.numberOfLevels = options.numberOfLevels || 21;
        this.baseUrl = options.baseUrl;
    };

    /**************************************************************************************************************/

    Utils.inherits(RasterLayer, OSMLayer);

    /**************************************************************************************************************/

    /**
     * Get an url for the given tile
     * @function getUrl
     * @memberof OSMLayer.prototype
     * @param {Tile} tile Tile
     * @return {String} Url
     */
    OSMLayer.prototype.getUrl = function (tile) {
        var url = this.baseUrl + '/' + tile.level + '/' + tile.x + '/' + tile.y + '.png';
        return url;
    };


    /**************************************************************************************************************/

    return OSMLayer;

});
