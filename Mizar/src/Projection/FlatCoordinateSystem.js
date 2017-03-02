define(['../CoordinateSystem/CoordinateSystem', '../Utils/Utils', '../Renderer/glMatrix'],
    function (CoordinateSystem, Utils) {

         /**
          @name FlatCoordinateSystem
          @class
             Flat coordinate system
          @augments CoordinateSystem
          @param options Options for Flat coordinate system. See {@link CoordinateSystem} for base properties.
          @constructor
          */
          var FlatCoordinateSystem = function (options) {

            CoordinateSystem.prototype.constructor.call(this, options);
            this.isFlat = true;
        };

        /**************************************************************************************************************/

        Utils.inherits(CoordinateSystem, FlatCoordinateSystem);

		 /**************************************************************************************************************/

		 /**
		  * Get local transformation
		  * @function getLocalTransform
		  * @memberof CoordinateSystem.prototype
		  * @param {Array} geo
		  * @param {Array} dest
		  * @return {Array} dest Matrix as 16 values
		  */
		FlatCoordinateSystem.prototype.getLocalTransform = function (geo, dest) {
			if (!dest) {
				dest = mat4.create();
			}
			mat4.identity(dest);
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
		FlatCoordinateSystem.prototype.getLHVTransform = function (geo, dest) {
			if (!dest) {
				dest = mat4.create();
			}
			var pt = this.fromGeoTo3D(geo);
			mat4.identity(dest);
			dest[12] = pt[0];
			dest[13] = pt[1];
			dest[14] = pt[2];
			dest[15] = 1.0;
			return dest;
		};
		
        /**************************************************************************************************************/

        return FlatCoordinateSystem;

    });
