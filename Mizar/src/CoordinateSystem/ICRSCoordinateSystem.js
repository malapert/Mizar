define(['./CoordinateSystem','../Utils/Utils','../Utils/Constants'],
 function (CoordinateSystem,Utils,Constants) {
   /**
    @name ICRSCoordinateSystem
    @class
       ICRS coordinate system
    @augments CoordinateSystem
    @param options Options for ICRS coordinate system. See {@link CoordinateSystem} for base properties.
    @constructor
    */
    var ICRSCoordinateSystem = function (options) {
        options.geoideName = Constants.GEOIDE.Sky;
        CoordinateSystem.prototype.constructor.call(this, options);
    };

    /**************************************************************************************************************/

    Utils.inherits(CoordinateSystem, ICRSCoordinateSystem);

    /**************************************************************************************************************/

    return ICRSCoordinateSystem;

});
