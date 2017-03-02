define(['../Projection/FlatCoordinateSystem', '../Utils/Utils', '../Utils/Constants', '../Renderer/glMatrix'],
    function (FlatCoordinateSystem, Utils, Constants) {


         /**
          @name PlateCoordinateSystem
          @class
             Plate carré coordinate system
          @augments CoordinateSystem
          @param options Options for Plate carré coordinate system. See {@link CoordinateSystem} for base properties.
          @constructor
          */
          var PlateCoordinateSystem = function (options) {
            if (options) {
              options.projectionName = Constants.PROJECTION.Plate;
            } else {
              options = {
                projectionName:Constants.PROJECTION.Plate
              };
            }
            FlatCoordinateSystem.prototype.constructor.call(this, options);
         };

        /**************************************************************************************************************/

        Utils.inherits(FlatCoordinateSystem, PlateCoordinateSystem);

        /**************************************************************************************************************/

         /**
          * From 3D to Plate Carré
          * @function from3DToGeo
          * @memberof PlateCoordinateSystem.prototype
          * @param position3d
          * @param dest
          */
        PlateCoordinateSystem.prototype.from3DToGeo = function (position3d, dest) {
            if (!dest) {
                dest = new Array(3);
            }
            dest[0] = position3d[0] * 180 / Math.PI;
            dest[1] = position3d[1] * 180 / Math.PI;
            dest[2] = position3d[2] / this.geoide.heightScale;
            return dest;
        };

        /**************************************************************************************************************/

        /**
          * From Plate Carré to 3D
          * @function fromGeoTo3D
          * @memberof PlateCoordinateSystem.prototype
          * @param geoPos
          * @param dest
          */
        PlateCoordinateSystem.prototype.fromGeoTo3D = function (geoPos, dest) {
            if (!dest) {
                dest = new Array(3);
            }
            dest[0] = geoPos[0] * Math.PI / 180;
            dest[1] = geoPos[1] * Math.PI / 180;
            dest[2] = geoPos[2] * this.geoide.heightScale;
            return dest;
        };
  
        /**************************************************************************************************************/

        return PlateCoordinateSystem;

    });
