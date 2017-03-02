
define(['../Projection/FlatCoordinateSystem', '../Utils/Utils','../Utils/Constants', '../Renderer/glMatrix'],
    function (FlatCoordinateSystem, Utils,Constants) {

         /**
          @name AzimuthCoordinateSystem
          @class
             Azimuth coordinate system
          @augments CoordinateSystem
          @param options Options for Azimuth coordinate system. See {@link CoordinateSystem} for base properties.
          @constructor
          */
          var AzimuthCoordinateSystem = function (options) {
            if (options) {
              options.projectionName = Constants.PROJECTION.Azimuth;
            } else {
              options = {projectionName:Constants.PROJECTION.Azimuth};
            }
            FlatCoordinateSystem.prototype.constructor.call(this, options);
 
   			this.pole = (options && options.pole) || "north";
   			if (this.pole === "south") {
      				this.geoBound = [-180,-90,180,0];
            }	else {
        		    this.geoBound = [-180,0,180,90];
      				  this.pole = "north";
      			}
          };

          /**************************************************************************************************************/

        Utils.inherits(FlatCoordinateSystem, AzimuthCoordinateSystem);

        /**************************************************************************************************************/


         /**
          * From 3D to Azimuth
          * @function from3DToGeo
          * @memberof AzimuthCoordinateSystem.prototype
          * @param position3d
          * @param dest
          */
        AzimuthCoordinateSystem.prototype.from3DToGeo = function (position3d, dest) {
			var p = Math.sqrt( position3d[0] * position3d[0] + position3d[1] * position3d[1] );
			var o = Math.atan2( position3d[0], -position3d[1] );

			p = p * 180 / Math.PI;
			o =	o * 180 / Math.PI;

			o *= this.pole === "south" ? -1 : 1;
			
			if (p > 90)
				return null;
            
			if (!dest) {
                dest = new Array(3);
            }
            dest[0] = o;
            dest[1] = this.pole === "south" ? p - 90 : 90 - p;
            dest[2] = 0.0;
            return dest;
        };

        /**************************************************************************************************************/

         /**
          * From Azimuth to 3D
          * @function fromGeoTo3D
          * @memberof AzimuthCoordinateSystem.prototype
          * @param geoPos
          * @param dest
          */
        AzimuthCoordinateSystem.prototype.fromGeoTo3D = function (geoPos, dest) {
            if (!dest) {
                dest = new Array(3);
            }
   			var p = this.pole === "south" ? 90 + geoPos[1] : 90 - geoPos[1];
			p = p * Math.PI / 180;

			var o = geoPos[0] * Math.PI / 180;
			o *= this.pole === "south" ? -1 : 1;

			dest[0] = p * Math.sin(o);
            dest[1] = -p * Math.cos(o);
            dest[2] = 0.0;
            return dest;
        };

        /**************************************************************************************************************/

        return AzimuthCoordinateSystem;

    });
