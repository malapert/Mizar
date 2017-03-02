define(["./Renderer/BoundingBox","./Renderer/GeoBound"],
    function (BoudingBox,GeoBound) {

    /**
     @name UtilityFactory
     @class
     Utility Factory
    */
    var UtilityFactory = function () {
    };

    /**
     Create and get a Bounding Box
     @function createBoundingBox
     @memberof UtilityFactory.prototype
     @param {Float[]} min Min corner as 3D point (array of 3 float)
  	 @param {Float[]} max Max corner as 3D point (array of 3 float)
     @return {BoundingBox} BoundingBox Object
    */
    UtilityFactory.prototype.createBoundingBox = function (min,max) {
        return new BoundingBox(min,max);
    };

    /**
     Create and get a Geo Bound
     @function createGeoBound
     @memberof UtilityFactory.prototype
     @param {Float} w West
     @param {Float} s South
     @param {Float} e East
     @param {Float} n North
     @return {GeoBound} GeoBound Object
    */
    UtilityFactory.prototype.createGeoBound = function (w, s, e, n) {
        return new GeoBound(w, s, e, n);
    };

    /**************************************************************************************************************/

    return UtilityFactory;

});
