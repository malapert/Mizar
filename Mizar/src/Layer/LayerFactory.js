define([ "../Utils/Constants","./WMSLayer","./WMTSLayer","./WCSElevationLayer","./VectorLayer",
          "./AtmosphereLayer","./BingLayer","./GroundOverlayLayer","./OSMLayer",
          "./TileWireframeLayer","./CoordinateGridLayer",
          "./HipsFitsLayer",
          "./HipsLayer",
          "./MocLayer",
          "./OpenSearchLayer",
          "./PlanetLayer",
          "./WMSElevationLayer"
        ],
    function (Constants,WMSLayer,WMTSLayer,WCSElevationLayer,VectorLayer,AtmosphereLayer,
      BingLayer,GroundOverlayLayer,OSMLayer,TileWireframeLayer,CoordinateGridLayer,
      HipsFitsLayer,
      HipsLayer,
      MocLayer,
      OpenSearchLayer,
      PlanetLayer,
      WMSElevationLayer
    ) {

    /**
     @name LayerFactory
     @class
     Layer Factory
    */
    var LayerFactory = function () {
    };

    /**
     Create and get a Layer
     @function create
     @memberof LayerFactory.prototype
     @param {String} layerType Type of layer to create
     <ul>
     <li>WMS</li>
     <li>WMTS</li>
     <li>WMSElevation</li>
     <li>WCSElevation</li>
     <li>Vector</li>
     <li>Atmosphere</li>
     <li>Bing</li>
     <li>GroundOverlay</li>
     <li>OSM</li>
     <li>TileWireframe</li>
     <li>CoordinateGrid</li>
     <li>HipsFits</li>
     <li>Hips</li>
     <li>Moc</li>
     <li>OpenSearch</li>
     <li>Planet</li>
     </ul>
     @param options Configuration properties for the layer.
     <ul>
     <li>See {@link WMSLayer} for WMS properties</li>
     <li>See {@link WMTSLayer} for WMTS properties</li>
     <li>See {@link WMSElevationLayer} for WMSElevation properties</li>
     <li>See {@link WCSElevationLayer} for WCSElevation properties</li>
     <li>See {@link VectorLayer} for Vector properties</li>
     <li>See {@link AtmosphereLayer} for Atmosphere properties</li>
     <li>See {@link BingLayer} for Bing properties</li>
     <li>See {@link GroundOverlayLayer} for GroundOverlay properties</li>
     <li>See {@link OSMLayer} for OSM properties</li>
     <li>See {@link TileWireframeLayer} for TileWireframe properties</li>
     <li>See {@link CoordinateGridLayer} for CoordinateGrid properties</li>
     <li>See {@link HipsFitsLayer} for HipsFits properties</li>
     <li>See {@link HipsLayer} for Hips properties</li>
     <li>See {@link MocLayer} for Moc properties</li>
     <li>See {@link OpenSearchLayer} for OpenSearch properties</li>
     <li>See {@link PlanetLayer} for Planet properties</li>
     </ul>
     @return {Layer} layer
    */
    LayerFactory.prototype.create = function (layerType,options) {
        switch (layerType) {
          case Constants.LAYER.WMS :
            return this.createWMS(options);
          case Constants.LAYER.WMTS :
            return this.createWMTS(options);
          case Constants.LAYER.WMSElevation :
            return this.createWMSElevation(options);
          case Constants.LAYER.WCSElevation :
            return this.createWCSElevation(options);
          case Constants.LAYER.Vector :
            return this.createVector(options);
          case Constants.LAYER.Atmosphere :
            return this.createAtmosphere(options);
          case Constants.LAYER.Bing :
            return this.createBing(options);
          case Constants.LAYER.GroundOverlay :
            return this.createGroundOverlay(options);
          case Constants.LAYER.OSM :
            return this.createOSM(options);
          case Constants.LAYER.TileWireframe :
            return this.createTileWireframe(options);
          case Constants.LAYER.CoordinateGrid :
            return this.createCoordinateGrid(options);
          case Constants.LAYER.HipsFits :
            return this.createHipsFits(options);
          case Constants.LAYER.Hips :
            return this.createHips(options);
          case Constants.LAYER.Moc :
            return this.createMoc(options);
          case Constants.LAYER.OpenSearch :
            return this.createOpenSearch(options);
          case Constants.LAYER.Planet :
            return this.createPlanet(options);
          default :
            // TODOFL : throw an error
            return null;
        }

    };


    /**
     Create and get a WMS Layer
     @function createWMS
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the wms layer. See {@link WMSLayer} for properties
     @return {WMSLayer} layer
    */
    LayerFactory.prototype.createWMS = function (options) {
        layer = new WMSLayer(options);
        return layer;
    };

    /**
     Create and get a WCS Elevation Layer
     @function createWCSElevation
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the WCS elevation layer. See {@link WCSElevationLayer} for properties
     @return {WCSElevationLayer} layer
    */
    LayerFactory.prototype.createWCSElevation = function (options) {
        layer = new WCSElevationLayer(options);
        return layer;
    };

    /**
     Create and get a vector Layer
     @function createVector
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the vector layer. See {@link VectorLayer} for properties
     @return {VectorLayer} layer
    */
    LayerFactory.prototype.createVector = function (options) {
        layer = new VectorLayer(options);
        return layer;
    };

    /**
     Create and get an Atmosphere Layer
     @function createAtmosphere
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the atmosphere layer. See {@link AtmosphereLayer} for properties
     @return {AtmosphereLayer} layer
    */
    LayerFactory.prototype.createAtmosphere = function (options) {
        layer = new AtmosphereLayer(options);
        return layer;
    };

    /**
     Create and get a WMTS Layer
     @function createWMTS
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the WMTS layer. See {@link WMTSLayer} for properties
     @return {WMTSLayer} layer
    */
    LayerFactory.prototype.createWMTS = function (options) {
        layer = new WMTSLayer(options);
        return layer;
    };

    /**
     Create and get a Bing Layer
     @function createBing
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the Bng layer. See {@link BingLayer} for properties
     @return {BingLayer} layer
    */
    LayerFactory.prototype.createBing = function (options) {
        layer = new BingLayer(options);
        return layer;
    };

    /**
     Create and get a Ground Overlay Layer
     @function createGroundOverlay
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the ground overlay layer. See {@link GroundOverlayLayer} for properties
     @return {GroundOverlayLayer} layer
    */
    LayerFactory.prototype.createGroundOverlay = function (options) {
        layer = new GroundOverlayLayer(options);
        return layer;
    };

    /**
     Create and get an OpenStreetMap Layer
     @function createOSM
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the OpenStreetMap layer. See {@link OSMLayer} for properties
     @return {OSMLayer} layer
    */
    LayerFactory.prototype.createOSM = function (options) {
        layer = new OSMLayer(options);
        return layer;
    };

    /**
     Create and get a Tile Wire Frame Layer
     @function createTileWireframe
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the tile wire frame layer. See {@link TileWireframeLayer} for properties
     @return {TileWireframeLayer} layer
    */
    LayerFactory.prototype.createTileWireframe = function (options) {
        layer = new TileWireframeLayer(options);
        return layer;
    };

    /**
     Create and get a coordinate grid Layer
     @function createCoordinateGrid
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the coordinate grid layer. See {@link CoordinateGridLayer} for properties
     @return {CoordinateGridLayer} layer
    */
    LayerFactory.prototype.createCoordinateGrid = function (options) {
        layer = new CoordinateGridLayer(options);
        return layer;
    };

    /**
     Create and get a Hips Fits Layer
     @function createHipsFits
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the Hips Fits layer. See {@link HipsFitsLayer} for properties
     @return {HipsFitsLayer} layer
    */
    LayerFactory.prototype.createHipsFits = function (options) {
        layer = new HipsFitsLayer(options);
        return layer;
    };

    /**
     Create and get a Hips Layer
     @function createHips
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the Hips layer. See {@link HipsLayer} for properties
     @return {HipsLayer} layer
    */
    LayerFactory.prototype.createHips = function (options) {
        layer = new HipsLayer(options);
        return layer;
    };

    /**
     Create and get a MOC Layer
     @function createMoc
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the MOC layer. See {@link MocLayer} for properties
     @return {MocLayer} layer
    */
    LayerFactory.prototype.createMoc = function (options) {
        layer = new MocLayer(options);
        return layer;
    };

    /**
     Create and get an OpenSearch Layer
     @function createOpenSearch
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the OpenSearch layer. See {@link OpenSearchLayer} for properties
     @return {OpenSearchLayer} layer
    */
    LayerFactory.prototype.createOpenSearch = function (options) {
        layer = new OpenSearchLayer(options);
        return layer;
    };

    /**
     Create and get a Planet Layer
     @function createPlanet
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the Planet layer. See {@link PlanetLayer} for properties
     @return {PlanetLayer} layer
    */
    LayerFactory.prototype.createPlanet = function (options) {
        layer = new PlanetLayer(options);
        return layer;
    };

    /**
     Create and get a WMS Elevation Layer
     @function createWMSElevation
     @private
     @memberof LayerFactory.prototype
     @param options Configuration properties for the WMS Elevation layer. See {@link WMSElevationLayer} for properties
     @return {WMSElevationLayer} layer
    */
    LayerFactory.prototype.createWMSElevation = function (options) {
        layer = new WMSElevationLayer(options);
        return layer;
    };

    /**************************************************************************************************************/

    return LayerFactory;

});
