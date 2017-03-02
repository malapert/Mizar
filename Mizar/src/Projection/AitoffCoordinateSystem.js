define(['../Projection/FlatCoordinateSystem', '../Utils/Utils','../Utils/Constants','../Renderer/glMatrix'],
    function (FlatCoordinateSystem, Utils,Constants) {
      /**
       @name AitoffCoordinateSystem
       @class
          Aitoff coordinate system
       @augments CoordinateSystem
       @param options Options for Aitoff coordinate system. See {@link CoordinateSystem} for base properties.
       @constructor
       */
       var AitoffCoordinateSystem = function (options) {
            if (options) {
              options.projectionName = Constants.PROJECTION.Aitoff;
            } else {
              options = {
                projectionName:Constants.PROJECTION.Aitoff
              };
            }
            FlatCoordinateSystem.prototype.constructor.call(this, options);
         };

        /**************************************************************************************************************/

        Utils.inherits(FlatCoordinateSystem, AitoffCoordinateSystem);

        /**************************************************************************************************************/

        /**
         *    Inverse sampling function(sinc)
         */
        var _sinci = function (x) {
            return x ? x / Math.sin(x) : 1;
        };

        /**************************************************************************************************************/

         /**
          * From 3D to Aitoff
          * @function from3DToGeo
          * @memberof AitoffCoordinateSystem.prototype
          * @param position3d
          * @param dest
          */
        AitoffCoordinateSystem.prototype.from3DToGeo = function (position3d, dest) {
            if (!dest) {
                dest = new Array(3);
            }

            var epsilon = 0.005;
            var deltaLambda;
            var deltaPhi;
            // Abort if [x, y] is not within an ellipse centered at [0, 0] with
            // semi-major axis pi and semi-minor axis pi/2.
            if (position3d[0] * position3d[0] + 4 * position3d[1] * position3d[1] > Math.PI * Math.PI + epsilon) {
              return;
            }

            var lambda = position3d[0],
                phi = position3d[1],
                i = 25;

            do {
                var sinLambda = Math.sin(lambda),
                    sinLambda_2 = Math.sin(lambda / 2),
                    cosLambda_2 = Math.cos(lambda / 2),
                    sinPhi = Math.sin(phi),
                    cosPhi = Math.cos(phi),
                    sin_2phi = Math.sin(2 * phi),
                    sin2phi = sinPhi * sinPhi,
                    cos2phi = cosPhi * cosPhi,
                    sin2lambda_2 = sinLambda_2 * sinLambda_2,
                    F,
                    C = 1 - cos2phi * cosLambda_2 * cosLambda_2,
                    E = C ? Math.acos(cosPhi * cosLambda_2) * Math.sqrt(F = 1 / C) : F = 0,
                    fx = 2 * E * cosPhi * sinLambda_2 - position3d[0],
                    fy = E * sinPhi - position3d[1],
                    deltaXLambda = F * (cos2phi * sin2lambda_2 + E * cosPhi * cosLambda_2 * sin2phi),
                    deltaXPhi = F * (0.5 * sinLambda * sin_2phi - E * 2 * sinPhi * sinLambda_2),
                    deltaYLambda = F * 0.25 * (sin_2phi * sinLambda_2 - E * sinPhi * cos2phi * sinLambda),
                    deltaYPhi = F * (sin2phi * cosLambda_2 + E * sin2lambda_2 * cosPhi),
                    denominator = deltaXPhi * deltaYLambda - deltaYPhi * deltaXLambda;
                if (!denominator) {
                  break;
                }
                deltaLambda = (fy * deltaXPhi - fx * deltaYPhi) / denominator;
                deltaPhi = (fx * deltaYLambda - fy * deltaXLambda) / denominator;
                lambda -= deltaLambda;
                phi -= deltaPhi;
            } while ((Math.abs(deltaLambda) > epsilon || Math.abs(deltaPhi) > epsilon) && --i > 0);

            dest[0] = lambda * 180 / Math.PI;
            dest[1] = phi * 180 / Math.PI;
            dest[2] = 0.0;
            return dest;
        };

        /**************************************************************************************************************/

        /**
         * From Aitoff to 3D
         * @function fromGeoTo3D
         * @memberof AitoffCoordinateSystem.prototype
         * @param geoPos
         * @param dest
         */
        AitoffCoordinateSystem.prototype.fromGeoTo3D = function (geoPos, dest) {
            if (!dest) {
                dest = new Array(3);
            }

            var lambda = geoPos[0] * Math.PI / 180; // longitude
            var phi = geoPos[1] * Math.PI / 180;  // latitude

            var cosPhi = Math.cos(phi);
            var sinciAlpha = _sinci(Math.acos(cosPhi * Math.cos(lambda /= 2)));

            dest[0] = 2 * cosPhi * Math.sin(lambda) * sinciAlpha;
            dest[1] = Math.sin(phi) * sinciAlpha;
            dest[2] = 0;

            // Triple winkel: mode
            // TODO: inverse
            // dest[0] = (dest[0] + lambda / Math.PI/2) / 2;
            // dest[1] = (dest[1] + phi) / 2;

            return dest;
        };

        /**************************************************************************************************************/

        return AitoffCoordinateSystem;

    });
