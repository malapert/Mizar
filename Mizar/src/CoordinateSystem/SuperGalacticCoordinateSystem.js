define(['./CoordinateSystem','../Utils/Utils','../Utils/Constants'],
 function (CoordinateSystem,Utils,Constants) {
   /**
    @name SuperGalacticCoordinateSystem
    @class
       Super Galactic coordinate system
    @augments CoordinateSystem
    @param options Options for Super Galactic coordinate system. See {@link CoordinateSystem} for base properties.
    @constructor
    */
    var SuperGalacticCoordinateSystem = function (options) {
      options.geoideName = Constants.GEOIDE.Sky;
      CoordinateSystem.prototype.constructor.call(this, options);
    };

    /**************************************************************************************************************/

    Utils.inherits(CoordinateSystem, SuperGalacticCoordinateSystem);

    /**************************************************************************************************************/

    return SuperGalacticCoordinateSystem;

});
