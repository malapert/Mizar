define([], function () {
  /**
   @name Geoide
   @class
      Geoide
   @param {JSON} options Options for Geoide
   <ul>
    <li>radius : radius (1 by default)</li>
    <li>realPlanetRadius : real planet radius (6356752.3142 by default, Earth value)</li>
   </ul>
   @constructor
   */
    var Geoide = function (options) {
        this.radius = options && options.hasOwnProperty('radius') ? options.radius : 1.0;
        this.realPlanetRadius = options && options.hasOwnProperty('realPlanetRadius') ? options.realPlanetRadius : 6356752.3142;
        this.heightScale = 1.0 / this.realPlanetRadius;
    };


    /**************************************************************************************************************/
    /**
     * Get real planet radius
     * @function getRealPlanetRadius
     * @memberof Geoide.prototype
     *
     * @return {Float} Real planet radius
     */
     Geoide.prototype.getRealPlanetRadius = function () {
       return this.realPlanetRadius;
     }

     /**
      * Set real planet radius
      * @function setRealPlanetRadius
      * @memberof Geoide.prototype
      *
      * @param {Float} radius Real planet radius
      */
      Geoide.prototype.setRealPlanetRadius = function (radius) {
        this.realPlanetRadius = radius;
      }

      /**
       * Get radius
       * @function getRadius
       * @memberof Geoide.prototype
       *
       * @return {Float} Radius
       */
       Geoide.prototype.getRadius = function () {
         return this.radius;
       }

       /**
        * Set radius
        * @function setRadius
        * @memberof Geoide.prototype
        *
        * @param {Float} radius radius
        */
        Geoide.prototype.setRadius = function (radius) {
          this.radius = radius;
        }

        /**
         * Get height scale
         * @function getHeightScale
         * @memberof Geoide.prototype
         *
         * @return {Float} Height scale
         */
         Geoide.prototype.getHeightScale = function () {
           return this.heightScale;
         }
      /**************************************************************************************************************/

    return Geoide;

});
