define(['../Projection/FlatCoordinateSystem', '../Utils/Utils','../Utils/Constants', '../Renderer/glMatrix'],
    function (FlatCoordinateSystem, Utils,Constants) {
      /**
       @name MercatorCoordinateSystem
       @class
          Mercator coordinate system
       @augments CoordinateSystem
       @param options Options for August coordinate system. See {@link CoordinateSystem} for base properties.
       <ul>
       <li>lambda0 : is the longitude of an arbitrary central meridian usually(but not always) Greenwich, in degrees</li>
       </ul>
       @constructor
       */
        var MercatorCoordinateSystem = function (options) {
          if (options) {
            options.projectionName = Constants.PROJECTION.Mercator;
          } else {
            options = {
              projectionName:Constants.PROJECTION.Mercator
            };
          }
          FlatCoordinateSystem.prototype.constructor.call(this, options);
          this.lambda0 = options && options.lambda0 ? options.lambda0 : 0.0; // Greenwich (i.e., zero)
        };

        /**************************************************************************************************************/

        Utils.inherits(FlatCoordinateSystem, MercatorCoordinateSystem);

        /**************************************************************************************************************/

        /**
         *  Hyperbolic sine
         */
        var _sinh = function (x) {
            var expY = Math.exp(x);
            return (expY - 1 / expY) / 2;
        };

        /**************************************************************************************************************/

        /**
         * From 3D to Mercator
         * @function from3DToGeo
         * @memberof MercatorCoordinateSystem.prototype
         * @param position3d
         * @param dest
         */
        MercatorCoordinateSystem.prototype.from3DToGeo = function (position3d, dest) {
            if (!dest) {
                dest = new Array(3);
            }

            dest[0] = this.lambda0 + position3d[0] * 180 / Math.PI;
            dest[1] = Math.atan(_sinh(position3d[1])) * 180 / Math.PI;
            dest[2] = 0.0;
			
			if (Math.abs(dest[1]) > 85.05)
				return null;
			
            return dest;
        };

        /**
         * From Mercator to 3D
         * @function fromGeoTo3D
         * @memberof MercatorCoordinateSystem.prototype
         * @param geoPos
         * @param dest
         */
        MercatorCoordinateSystem.prototype.fromGeoTo3D = function (geoPos, dest) {
            if (!dest) {
                dest = new Array(3);
            }

            // Clamp latitude values, since mercator converges to infinity at poles
            if (geoPos[1] > 85.05) {
                geoPos[1] = 85.05;
            }
            if (geoPos[1] < -85.05) {
                geoPos[1] = -85.05;
            }

            var longInRad = geoPos[0] * Math.PI / 180; // longitude
            var latInRad = geoPos[1] * Math.PI / 180;  // latitude

            var x = longInRad - (this.lambda0 * Math.PI / 180);
            var y = Math.log(Math.tan(latInRad) + 1 / Math.cos(latInRad));

            dest[0] = x;
            dest[1] = y;
            dest[2] = 0;
            return dest;
        };

        /**************************************************************************************************************/

        return MercatorCoordinateSystem;

    });
