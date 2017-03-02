define([ "../Utils/Constants","./PlanetContext","./SkyContext" ],
    function (Constants,PlanetContext,SkyContext) {

    /**
     @name ContextFactory
     @class
     Context Factory
    */
    var ContextFactory = function (parentElement) {
      this.parentElement = parentElement;
    };

    /**
     * Create and get a context
     * @function create
     * @memberof ContextFactory.prototype
     *
     * @param {String} type Type of context to create.Can be :
     * <ul>
     *  <li>Planet</li>
     *  <li>Sky</li>
     * </ul>
     * @param options Configuration properties for the context.
     * <ul>
     *  <li> See {@link PlanetContext} for Planet properties</li>
     *  <li> See {@link SkyContext} for Sky properties</li>
     * </ul>
     * @return {BaseContext} Context Object
     */
    ContextFactory.prototype.create = function(type,options) {
          switch (type) {
            case Constants.CONTEXT.Planet :
              return this.createPlanet(options);
            case Constants.CONTEXT.Sky :
              return this.createSky(options);
          }
          // TODOFL Throw an error
          return null;
    }

    /**
     * Create and get a planet context
     * @function createPlanet
     * @memberof ContextFactory.prototype
     *
     * @param options Configuration properties for the planet context. See {@link PlanetContext} for properties
     * @return {PlanetContext} Planet context Object
     * @private
     */
    ContextFactory.prototype.createPlanet = function (options) {
	  var opts = options || {};
	  opts.renderContext = this.parentElement.renderContext;
      var planetContext = new PlanetContext(this.parentElement,opts);
	  this.parentElement.renderContext = planetContext.planet.renderContext;
      return planetContext;
    };

    /**
     * Create and get a sky context
     * @function createSky
     * @memberof ContextFactory.prototype
     *
     * @param parentElement Element where associate this context
     * @param options Configuration properties for the sky context. See {@link SkyContext} for properties
     * @return {SkyContext} Sky context Object
     * @private
     */
    ContextFactory.prototype.createSky = function (options) {
 	  var opts = options || {};
	  opts.renderContext = this.parentElement.renderContext;
     var skyContext = new SkyContext(this.parentElement,opts);
  	  this.parentElement.renderContext = skyContext.sky.renderContext;
	  return skyContext;
    };

    /**************************************************************************************************************/

    return ContextFactory;

});
