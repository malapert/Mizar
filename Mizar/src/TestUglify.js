define([],
    function () {

    /**
     @name UtilityFactory
     @class
     Utility Factory
    */
    var TestUglify = function () {
    };

    /**
     Create and get a Bounding Box
     @function createBoundingBox
     @memberof UtilityFactory.prototype
     @param {Float[]} min Min corner as 3D point (array of 3 float)
  	 @param {Float[]} max Max corner as 3D point (array of 3 float)
     @return {BoundingBox} BoundingBox Object
    */
    TestUglify.prototype.createBoundingBox = function (min,max) {
        return null;
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
    TestUglify.prototype.createGeoBound = function (w, s, e, n) {
        return new GeoBound(w, s, e, n);
    };

    /**************************************************************************************************************/

    return UtilityFactory;

});
