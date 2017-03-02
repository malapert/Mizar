 define(['./CoordinateSystem','../Utils/Utils','../Utils/Constants'],
 function (CoordinateSystem,Utils,Constants) {
   /**
    @name GalacticCoordinateSystem
    @class
       Galactic coordinate system
    @augments CoordinateSystem
    @param options Options for Galactic coordinate system. See {@link CoordinateSystem} for base properties.
    @constructor
    */
    var GalacticCoordinateSystem = function (options) {
      options.geoideName = Constants.GEOIDE.Sky;
      CoordinateSystem.prototype.constructor.call(this, options);
    };

    /**************************************************************************************************************/

    Utils.inherits(CoordinateSystem, GalacticCoordinateSystem);

    /**************************************************************************************************************/

    return GalacticCoordinateSystem;

});
