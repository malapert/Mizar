define(['./CoordinateSystem','../Utils/Utils','../Utils/Constants'],
 function (CoordinateSystem,Utils,Constants) {
   /**
    @name Mars2000CoordinateSystem
    @class
       Mars2000 coordinate system
    @augments CoordinateSystem
    @param options Options for Mars2000 coordinate system. See {@link CoordinateSystem} for base properties.
    @constructor
    */
    var WGS84CoordinateSystem = function (options) {
      options.geoideName = Constants.GEOIDE.Mars_2000_IAU_IAG;
      CoordinateSystem.prototype.constructor.call(this, options);
    };

    /**************************************************************************************************************/

    Utils.inherits(CoordinateSystem, WGS84CoordinateSystem);

    /**************************************************************************************************************/

    return WGS84CoordinateSystem;

});
