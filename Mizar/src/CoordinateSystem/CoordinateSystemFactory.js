define([ "../Utils/Constants","./WGS84CoordinateSystem","./EquatorialCoordinateSystem","./EclipticCoordinateSystem",
         "./GalacticCoordinateSystem","./SuperGalacticCoordinateSystem","./ICRSCoordinateSystem",
         "../Projection/AitoffCoordinateSystem","../Projection/AugustCoordinateSystem",
         "../Projection/MercatorCoordinateSystem","../Projection/MollweideCoordinateSystem",
         "../Projection/PlateCoordinateSystem","../Projection/AzimuthCoordinateSystem"],
    function (Constants,WGS84CoordinateSystem,EquatorialCoordinateSystem,EclipticCoordinateSystem,
              GalacticCoordinateSystem,SuperGalacticCoordinateSystem,ICRSCoordinateSystem,
              AitoffCoordinateSystem,AugustCoordinateSystem,MercatorCoordinateSystem,
              MollweideCoordinateSystem,PlateCoordinateSystem,AzimuthCoordinateSystem) {
    /**
     @name CoordinateSystemFactory
     @class
        Factory for coordinate system
     @constructor
     */
    var CoordinateSystemFactory = function () {
    };

    /**
     Create and get a COMPLETE coordinate system (Geoide + projection)
     @function create
     @memberof CoordinateSystemFactory.prototype
     @param {JSON} options Options for Coordinate system.
        <ul>
         <li>geoide : geoide object</li>
         <li>geoideName : predefined geoide name (having priority on geoide option)</li>
         <li>projectionName : projection name</li>
        </ul>
        Geoide + projection ==> 2D
        Geoide without projection ==> 3D
      @return {CoordinateSystem||null} Coordinate System created (or null if there is a problem)
      @constructor
    */
    CoordinateSystemFactory.prototype.create = function(options) {
      // projection name has priority when creating
      if (options && options.projectionName) {
          switch (options.projectionName) {
            case Constants.PROJECTION.Aitoff :
              return new AitoffCoordinateSystem(options);
            case Constants.PROJECTION.August :
              return new AugustCoordinateSystem(options);
            case Constants.PROJECTION.Azimuth :
                return new AzimuthCoordinateSystem(options);
            case Constants.PROJECTION.Mercator :
              return new MercatorCoordinateSystem(options);
            case Constants.PROJECTION.Mollweide :
              return new MollweideCoordinateSystem(options);
            case Constants.PROJECTION.Plate :
              return new PlateCoordinateSystem(options);
            default :
              return null;
          }
      }

      // if no projection is provided, check geoide name
      if (options && options.geoideName) {
        switch (options.geoideName) {
            case Constants.GEOIDE.Ecliptic :
              return new EclipticCoordinateSystem(options);
            case Constants.GEOIDE.Equatorial :
              return new EquatorialCoordinateSystem(options);
            case Constants.GEOIDE.Galactic :
              return new GalacticCoordinateSystem(options);
            case Constants.GEOIDE.SuperGalactic :
              return new SuperGalacticCoordinateSystem(options);
            case Constants.GEOIDE.ICRS :
              return new ICRSCoordinateSystem(options);
            // For Earth
            case Constants.GEOIDE.WGS84 :
              return new WGS84CoordinateSystem(options);
            // For Mars
            case Constants.GEOIDE.Mars_2000_IAU_IAG :
              return new CoordinateSystem(options);
            // Unknown geoide name
            default :
              return null;
        }

        if (options && options.geoide) {
          return new CoordinateSystem(options);
        }

        // Too less options to create Coordinate System
        return null;

      }
    }
    /**
     Create and get a WGS84 coordinate system
     @function createWGS84
     @memberof CoordinateSystemFactory.prototype
     @param options Configuration properties. See {@link WGS84CoordinateSystem} for properties.
    */
    CoordinateSystemFactory.prototype.createWGS84 = function (options) {
        // Check option HERE
        cs = new WGS84CoordinateSystem(options);
        return cs;
    };

    /**
     Create and get an Equatorial coordinate system
     @function createEquatorial
     @memberof CoordinateSystemFactory.prototype
     @param options Configuration properties. See {@link EquatorialCoordinateSystem} for properties.
    */
    CoordinateSystemFactory.prototype.createEquatorial = function (options) {
        // Check option HERE
        cs = new EquatorialCoordinateSystem(options);
        return cs;
    };

    /**
     Create and get an Ecliptic coordinate system
     @function createEcliptic
     @memberof CoordinateSystemFactory.prototype
     @param options Configuration properties. See {@link EclipticCoordinateSystem} for properties.
    */
    CoordinateSystemFactory.prototype.createEcliptic = function () {
        // Check option HERE
        cs = new EclipticCoordinateSystem();
        return cs;
    };

    /**
     Create and get a Galactic coordinate system
     @function createGalactic
     @memberof CoordinateSystemFactory.prototype
     @param options Configuration properties. See {@link GalacticCoordinateSystem} for properties.
    */
    CoordinateSystemFactory.prototype.createGalactic = function (options) {
        // Check option HERE
        cs = new GalacticCoordinateSystem(options);
        return cs;
    };

    /**
     Create and get a Super Galactic coordinate system
     @function createSuperGalactic
     @memberof CoordinateSystemFactory.prototype
     @param options Configuration properties. See {@link SuperGalacticCoordinateSystem} for properties.
    */
    CoordinateSystemFactory.prototype.createSuperGalactic = function (options) {
        // Check option HERE
        cs = new SuperGalacticCoordinateSystem(options);
        return cs;
    };

    /**
     Create and get an ICRS coordinate system
     @function createICRS
     @memberof CoordinateSystemFactory.prototype
     @param options Configuration properties. See {@link ICRSCoordinateSystem} for properties.
    */
    CoordinateSystemFactory.prototype.createICRS = function (options) {
        // Check option HERE
        cs = new ICRSCoordinateSystem(options);
        return cs;
    };

    /**************************************************************************************************************/

    return CoordinateSystemFactory;

});
