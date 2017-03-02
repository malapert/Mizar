define(['./CoordinateSystem','../Utils/Utils','../Utils/Constants'],
function (CoordinateSystem,Utils,Constants) {
  /**
   @name EclipticCoordinateSystem
   @class
      Ecliptic coordinate system
   @augments CoordinateSystem
   @param options Options for Ecliptic coordinate system. See {@link CoordinateSystem} for base properties.
   @constructor
   */
  var EclipticCoordinateSystem = function (options) {
        options.geoideName = Constants.GEOIDE.Sky;
        CoordinateSystem.prototype.constructor.call(this, options);
        // Default coordinate system: ("EQ" or "GAL")
    };

    /**************************************************************************************************************/

    Utils.inherits(CoordinateSystem, EclipticCoordinateSystem);

    /**************************************************************************************************************/

    return EclipticCoordinateSystem;

});
