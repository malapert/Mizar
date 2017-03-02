
define(['../Projection/FlatCoordinateSystem', '../Utils/Utils','../Utils/Constants', '../Renderer/glMatrix'],
    function (FlatCoordinateSystem, Utils, Constants) {
      /**
       @name MollweideCoordinateSystem
       @class
          Mollweide coordinate system
       @augments CoordinateSystem
       @param options Options for Mollweide coordinate system. See {@link CoordinateSystem} for base properties.
       @constructor
       */
       var MollweideCoordinateSystem = function (options) {
         if (options) {
           options.projectionName = Constants.PROJECTION.Mollweide;
         } else {
           options = {
             projectionName:Constants.PROJECTION.Mollweide
           };
         }
         FlatCoordinateSystem.prototype.constructor.call(this, options);
        };

        /**************************************************************************************************************/

        Utils.inherits(FlatCoordinateSystem, MollweideCoordinateSystem);

        /**************************************************************************************************************/

        /**
         *  Newton-Raphson method to find auxiliary theta needed for mollweide x/y computation
         *  @see https://en.wikipedia.org/wiki/Mollweide_projection
         */
        function _findTheta(lat) {
            // Avoid divide by zero
            if (Math.abs(lat) === Math.PI / 2) {
                return lat;
            }

            var epsilon = 0.001;
            var thetaN = lat;  // n
            var thetaN1;       // n+1

            do
            {
                var twoThetaN = 2 * thetaN;
                thetaN = thetaN1;
                if (!thetaN) {
                    thetaN = lat;
                }
                thetaN1 = twoThetaN / 2 - (twoThetaN + Math.sin(twoThetaN) - Math.PI * Math.sin(lat)) / (2 + 2 * Math.cos(twoThetaN));
            } while (Math.abs(thetaN1 - thetaN) >= epsilon);

            return thetaN1;
        }

        /**************************************************************************************************************/

         /**
          * From 3D to Mollweide
          * @function from3DToGeo
          * @memberof MollweideCoordinateSystem.prototype
          * @param position3d
          * @param dest
          */
        MollweideCoordinateSystem.prototype.from3DToGeo = function (position3d, dest) {
            if (!dest) {
                dest = new Array(3);
            }

            var auxTheta = Math.asin(position3d[1] / Math.sqrt(2));
            var phi = Math.asin((2 * auxTheta + Math.sin(2 * auxTheta)) / Math.PI);
            var lambda = (Math.PI * position3d[0]) / ( 2 * Math.sqrt(2) * Math.cos(auxTheta));

            dest[0] = lambda * 180 / Math.PI;
            dest[1] = phi * 180 / Math.PI;
            dest[2] = position3d[2] / this.geoide.heightScale;
            return dest;
        };

        /**************************************************************************************************************/

         /**
          * From Mollweide to 3D
          * @function fromGeoTo3D
          * @memberof MollweideCoordinateSystem.prototype
          * @param geoPos
          * @param dest
          */
        MollweideCoordinateSystem.prototype.fromGeoTo3D = function (geoPos, dest) {
            if (!dest) {
                dest = new Array(3);
            }

            var lambda = geoPos[0] * Math.PI / 180; // longitude
            var theta0 = geoPos[1] * Math.PI / 180;  // latitude
            var auxTheta = _findTheta(theta0);

            // Transfrom to Mollweide coordinate system
            var mollX = 2 * Math.sqrt(2) / Math.PI * lambda * Math.cos(auxTheta);
            var mollY = Math.sqrt(2) * Math.sin(auxTheta);

            dest[0] = mollX;
            dest[1] = mollY;
            dest[2] = geoPos[2] * this.geoide.heightScale;
            return dest;
        };

        /**************************************************************************************************************/

        return MollweideCoordinateSystem;

    });
