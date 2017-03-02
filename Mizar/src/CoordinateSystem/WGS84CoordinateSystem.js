define(['./CoordinateSystem','../Utils/Utils','../Utils/Constants'],
 function (CoordinateSystem,Utils,Constants) {
   /**
    @name WGS84CoordinateSystem
    @class
       WGS84 coordinate system
    @augments CoordinateSystem
    @param options Options for WGS84 coordinate system. See {@link CoordinateSystem} for base properties.
    @constructor
    */
    var WGS84CoordinateSystem = function (options) {
      options.geoideName = Constants.GEOIDE.WGS84;
      CoordinateSystem.prototype.constructor.call(this, options);
    };

    /**************************************************************************************************************/

    Utils.inherits(CoordinateSystem, WGS84CoordinateSystem);

    /**************************************************************************************************************/

    return WGS84CoordinateSystem;

});
