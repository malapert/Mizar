define(
  ['../Utils/Numeric','./Geoide','../Utils/Constants'],
  function (Numeric,Geoide,Constants) {
  /**
   @name CoordinateSystem
   @class
      Coordinate system
   @param {JSON} options Options for Coordinate system.
      <ul>
       <li>geoide : geoide object</li>
       <li>geoideName : predefined geoide name (having priority on geoide option)</li>
       <li>projectionName : projection name</li>
      </ul>
    @constructor
   */
    var CoordinateSystem = function (options) {
        this.geoide = null;
        this.projectionName = null;

        this.geoBound = [-180,-90,180,90];

          // If geoideName is specified, use it
          if (options && options.geoideName) {
            var geoideOptions = {};
            if (options.geoideName === Constants.GEOIDE.WGS84) {
              geoideOptions.radius = 1.0;
              geoideOptions.realPlanetRadius = 6378137;//6356752.3142;
            } else if (options.geoideName === Constants.GEOIDE.Mars_2000_IAU_IAG) {
              // TODO : same values as Earth for the moment, to change
              geoideOptions.radius = 1.0;
              geoideOptions.realPlanetRadius = 3396190;
            } else if (options.geoideName === Constants.GEOIDE.Sky) {
              // TODO : same values as Earth for the moment, to change
              geoideOptions.radius = 10.0;
              //geoideOptions.realPlanetRadius = 6356752.3142;
            }

            this.geoide = new Geoide(geoideOptions);
            this.geoideName = options.geoideName;
          } else if (options && options.geoide) {
            // Else, use the geoide object provided
            this.geoide = options.geoide;
          }  else {
            console.log("Info : no geoide provided in coordinate system constructor, set it to Earth");
            this.geoide = new Geoide({ radius : 1.0,realPlanetRadius: 6356752.3142});
          }

          // If projectionName is specified, use it
          if (options && options.projectionName) {
            this.projectionName = options.projectionName;
          }

	        this.isFlat = (this.projectionName !== null);
    };

    /**
      * Get vertical at the given 3d position
      * @function getVerticalAt3D
      * @memberof CoordinateSystem.prototype
      *
      * @param {Array} pos
      * @param {Array} dest
      */
    CoordinateSystem.prototype.getVerticalAt3D = function (pos,dest) {
			if (!dest) {
				dest = new Array(3);
			}
			if (this.isFlat) {
				dest[0]  = 0.0;
				dest[1]  = 0.0;
				dest[2]  = 1.0;
			} else {
				vec3.normalize(pos,dest);
			}
			return dest;
    }
    /**************************************************************************************************************/

    /**
     * Convert a geographic position to 3D
     * @function fromGeoTo3D
     * @memberof CoordinateSystem.prototype
     *
     * @param {Array} geo
     * @param {Array} dest
     * @return {Array} dest Pos as 3 values [long, lat, distance from earth surface]
     */
    CoordinateSystem.prototype.fromGeoTo3D = function (geo, dest) {
        if (!dest) {
            dest = new Array(3);
        }
        if ( (!geo) || (geo.length<2) ) {
          console.log("Erreur !");
          dest[0]=0;
          dest[1]=0;
          dest[2]=0;
          return dest;
        }
        var longInRad = Numeric.toRadian(geo[0]);
        var latInRad = Numeric.toRadian(geo[1]);
        var cosLat = Math.cos(latInRad);

        // Take height into account
        var height = geo.length > 2 ? this.geoide.heightScale * geo[2] : 0;
        var radius = this.geoide.radius + height;

        dest[0] = radius * Math.cos(longInRad) * cosLat;
        dest[1] = radius * Math.sin(longInRad) * cosLat;
        dest[2] = radius * Math.sin(latInRad);

        return dest;
    };

    /**************************************************************************************************************/

     /**
      * Convert a 3D position to geiographic
      * @function from3DToGeo
      * @memberof CoordinateSystem.prototype
      *
      * @param {Array} position3d
      * @param {Array} dest
      * @return {Array} dest Pos as 3 values [long, lat, distance from earth surface]
      */
    CoordinateSystem.prototype.from3DToGeo = function (position3d, dest) {
        if (!dest) {
            dest = new Array(3);
        }

        var r = Math.sqrt(position3d[0] * position3d[0] +
            position3d[1] * position3d[1] +
            position3d[2] * position3d[2]);
        var lon = Math.atan2(position3d[1] / r, position3d[0] / r);
        var lat = Math.asin(position3d[2] / r);

        dest[0] = Numeric.toDegree(lon);
        dest[1] = Numeric.toDegree(lat);
        dest[2] = this.geoide.getRealPlanetRadius() * (r - this.geoide.getRadius());

        return dest;
    };

    /**
     * Convert a 3D position to geiographic
     * @function from3DToGeo
     * @memberof CoordinateSystem.prototype
     *
     * @param {Array} position3d
     * @param {Array} dest
     * @return {Array} dest Pos as 3 values [long, lat, distance from earth surface]
     */
   CoordinateSystem.prototype.getElevation = function (r) {
       return this.geoide.getRealPlanetRadius() * (r - this.geoide.getRadius());
   };

    /**************************************************************************************************************/

     /**
      * Get local transformation
      * @function getLocalTransform
      * @memberof CoordinateSystem.prototype
      * @param {Array} geo
      * @param {Array} dest
      * @return {Array} dest Matrix as 16 values
      */
    CoordinateSystem.prototype.getLocalTransform = function (geo, dest) {
        if (!dest) {
            dest = mat4.create();
        }

        var longitude = geo[0] * Math.PI / 180.0;
        var latitude = geo[1] * Math.PI / 180.0;

        var up = [Math.cos(longitude) * Math.cos(latitude), Math.sin(longitude) * Math.cos(latitude), Math.sin(latitude)];
        var east = [-Math.sin(longitude), Math.cos(longitude), 0];
        var north = vec3.create();
        vec3.cross(up, east, north);

        dest[0] = east[0];
        dest[1] = east[1];
        dest[2] = east[2];
        dest[3] = 0.0;

        dest[4] = north[0];
        dest[5] = north[1];
        dest[6] = north[2];
        dest[7] = 0.0;

        dest[8] = up[0];
        dest[9] = up[1];
        dest[10] = up[2];
        dest[11] = 0.0;

        dest[12] = 0.0;
        dest[13] = 0.0;
        dest[14] = 0.0;
        dest[15] = 1.0;

        return dest;
    };

    /**************************************************************************************************************/

     /**
      * Get LHV transformation
      * @function getLHVTransform
      * @memberof CoordinateSystem.prototype
      * @param {Array} geo
      * @param {Array} dest
      * @return {Array} dest Matrix as 16 values
      */
    CoordinateSystem.prototype.getLHVTransform = function (geo, dest) {
        if (!dest) {
            dest = mat4.create();
        }

        var longitude = geo[0] * Math.PI / 180.0;
        var latitude = geo[1] * Math.PI / 180.0;

        var up = [Math.cos(longitude) * Math.cos(latitude), Math.sin(longitude) * Math.cos(latitude), Math.sin(latitude)];
        var east = [-Math.sin(longitude), Math.cos(longitude), 0];
        var north = vec3.create();
        vec3.cross(up, east, north);

        var pt = this.fromGeoTo3D(geo);

        dest[0] = east[0];
        dest[1] = east[1];
        dest[2] = east[2];
        dest[3] = 0.0;

        dest[4] = north[0];
        dest[5] = north[1];
        dest[6] = north[2];
        dest[7] = 0.0;

        dest[8] = up[0];
        dest[9] = up[1];
        dest[10] = up[2];
        dest[11] = 0.0;

        dest[12] = pt[0];
        dest[13] = pt[1];
        dest[14] = pt[2];
        dest[15] = 1.0;

        return dest;
    };

    /**************************************************************************************************************/

     /**
      * Get the side (i.e. X) vector from a local transformation
      * @function getSideVector
      * @memberof CoordinateSystem.prototype
      * @param {Array} matrix
      * @param {Array} v
      * @return {Array} v Vector as 3 values
      */
    CoordinateSystem.prototype.getSideVector = function (matrix, v) {
        v[0] = matrix[0];
        v[1] = matrix[1];
        v[2] = matrix[2];

        return v;
    };

    /**************************************************************************************************************/

     /**
      * Get the front (i.e. Y) vector from a local transformation
      * @function getFrontVector
      * @memberof CoordinateSystem.prototype
      * @param {Array} matrix
      * @param {Array} v
      * @return {Array} v Vector as 3 values
      */
    CoordinateSystem.prototype.getFrontVector = function (matrix, v) {
        v[0] = matrix[4];
        v[1] = matrix[5];
        v[2] = matrix[6];

        return v;
    };

    /**************************************************************************************************************/

     /**
      * Get the up (i.e. Z) vector from a local transformation
      * @function getUpVector
      * @memberof CoordinateSystem.prototype
      * @param {Array} matrix
      * @param {Array} v
      * @return {Array} v Vector as 3 values
      */
    CoordinateSystem.prototype.getUpVector = function (matrix, v) {
        v[0] = matrix[8];
        v[1] = matrix[9];
        v[2] = matrix[10];

        return v;
    };

    /**************************************************************************************************************/
    return CoordinateSystem;
});
