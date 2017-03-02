define(['../Projection/FlatCoordinateSystem', '../Utils/Utils','../Utils/Constants', '../Renderer/glMatrix'],
    function (FlatCoordinateSystem, Utils,Constants) {
      /**
       @name AugustCoordinateSystem
       @class
          August coordinate system
       @augments CoordinateSystem
       @param options Options for August coordinate system. See {@link CoordinateSystem} for base properties.
       @constructor
       */
       var AugustCoordinateSystem = function (options) {
         if (options) {
           options.projectionName = Constants.PROJECTION.August;
         } else {
           options = {
             projectionName:Constants.PROJECTION.August
           };
         }
         FlatCoordinateSystem.prototype.constructor.call(this, options);
        };

        /**************************************************************************************************************/

        Utils.inherits(FlatCoordinateSystem, AugustCoordinateSystem);

        /**************************************************************************************************************/

        /**
         * From 3D to August, not yet implemented
         * @function from3DToGeo
         * @memberof AugustCoordinateSystem.prototype
         * @param position3d
         * @param dest
         */
        AugustCoordinateSystem.prototype.from3DToGeo = function (position3d, dest) {
        };
        /**
         * From August to 3D
         * @function fromGeoTo3D
         * @memberof AugustCoordinateSystem.prototype
         * @param geoPos
         * @param dest
         */
        AugustCoordinateSystem.prototype.fromGeoTo3D = function (geoPos, dest) {
            if (!dest) {
                dest = new Array(3);
            }

            var lambda = geoPos[0] * Math.PI / 180; // longitude
            var phi = geoPos[1] * Math.PI / 180; // latitude

            var tanPhi = Math.tan(phi / 2),
                k = Math.sqrt(1 - tanPhi * tanPhi),
                c = 1 + k * Math.cos(lambda /= 2),
                x = Math.sin(lambda) * k / c,
                y = tanPhi / c,
                x2 = x * x,
                y2 = y * y;

            dest[0] = 4 / 3 * x * (3 + x2 - 3 * y2);
            dest[1] = 4 / 3 * y * (3 + 3 * x2 - y2);
            dest[2] = 0;
            return dest;
        };

        /**************************************************************************************************************/

        return AugustCoordinateSystem;

    });
