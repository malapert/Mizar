define(["../Utils/Event", "../Utils/Utils"], function (Event, Utils) {
    /**
     @name BaseLayer
     @class
         Base class for layer.
     @param options Configuration properties for a BaseLayer:
     <ul>
     <li>name : the layer name</li>
     <li>description :  its description</li>
     <li>attribution : its attribution</li>
     <li>icon : an icon to represent the layer</li>
     <li>visible : a boolean flag to set the layer visible, default is true </li>
     <li>opacity : an opacity value, default is 1.0</li>
     </ul>
     */
    var BaseLayer = function (options) {
        Event.prototype.constructor.call(this, options);

        this.planet = null;
        this.name = options && options.hasOwnProperty('name') ? options.name : "";
        this.attribution = options && options.hasOwnProperty('attribution') ? options.attribution : " ";
        this.copyrightUrl = options && options.hasOwnProperty('copyrightUrl') ? options.copyrightUrl : "";
        this.ack = options && options.hasOwnProperty('ack') ? options.ack : "";
        this.icon = options && options.hasOwnProperty('icon') ? options.icon : "";
        this.description = options && options.hasOwnProperty('description') ? options.description : "";
        this._visible = options && options.hasOwnProperty('visible') ? options.visible : true;
        this._opacity = options && options.hasOwnProperty('opacity') ? options.opacity : 1.0;
        this.properties = options && options.hasOwnProperty('properties') ? options.properties : {};
        this.type = "Base";
    };

    /**************************************************************************************************************/

    Utils.inherits(Event, BaseLayer);

    /**************************************************************************************************************/

    /**
     * Attach the raster layer to the planet
     * @function _attach
     * @memberof AtmosphereLayer.prototype
     * @param {Planet} g Planet
     * @private
     */
    BaseLayer.prototype._attach = function (g) {
        this.planet = g;
        if (this.attribution && this.planet.attributionHandler && this._visible) {
          this.planet.attributionHandler.addAttribution(this);
        }
    };

    /**************************************************************************************************************/

    /**
     * Detach the vector layer from the planet
     * @function _detach
     * @memberof AtmosphereLayer.prototype
     * @private
     */
    BaseLayer.prototype._detach = function () {
        if (this.attribution && this.planet.attributionHandler) {
            this.planet.attributionHandler.removeAttribution(this);
        }

        this.planet = null;
    };

    /**************************************************************************************************************/

    /**
     * Set visible
     * @function setVisible
     * @memberof BaseLayer.prototype
     * @param {Boolean} arg Visible active or not
     */
    BaseLayer.prototype.setVisible = function (arg) {
        if (typeof arg === "boolean") {
            if (this._visible !== arg && this.planet.attributionHandler) {
                this.planet.attributionHandler.toggleAttribution(this);
            }
            this._visible = arg;
            if (this.planet) {
              this.planet.renderContext.requestFrame();
            }
            this.publish("visibility:changed", this);
        }
    };

    /**
     * Get visible
     * @function getVisible
     * @memberof BaseLayer.prototype
     * @return {Boolean} Visible active or not
     */
    BaseLayer.prototype.getVisible = function () {
      return this._visible;
    };


    /**************************************************************************************************************/

     /**
      * Set opacity
      * @function setOpacity
      * @memberof BaseLayer.prototype
      * @param {Float} arg Opacity
      */
    BaseLayer.prototype.setOpacity = function (arg) {
        if (typeof arg === "number") {
            this._opacity = arg;
            if (this.planet) {
              this.planet.renderContext.requestFrame();
            }
            this.publish("opacity:changed");
        }
    };
    /**
     * Get opacity
     * @function getOpacity
     * @memberof BaseLayer.prototype
     * @return {Float} Opacity
     */
   BaseLayer.prototype.getOpacity = function () {
     return this._opacity;
   };

   /**
    * Get type
    * @function getType
    * @memberof BaseLayer.prototype
    * @return {String} Type
    */
  BaseLayer.prototype.getType = function () {
    return this.typeLayer;
  };

  /**
   * Is type
   * @function isType
   * @memberof BaseLayer.prototype
   * @param {String} type Type to check
   * @return {Boolean} Result
   */
 BaseLayer.prototype.isType = function (type) {
   return this.type === type;
 };

    return BaseLayer;

});
