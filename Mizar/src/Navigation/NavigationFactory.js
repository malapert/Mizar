define([ "./Navigation","./AstroNavigation","./FlatNavigation",
         "./GoogleMouseNavigationHandler","./KeyboardNavigationHandler"
        ],
    function (Navigation,AstroNavigation,FlatNavigation,
              GoogleMouseNavigationHandler,KeyboardNavigationHandler
    ) {

    /**
     @name NavigationFactory
     @class
     Navigation Factory
    */
    var NavigationFactory = function () {
    };

    /**
     Create and get a Planet Navigation
     @function createPlanet
     @memberof NavigationFactory.prototype
     @param {Planet} view
     @param {JSON} options Configuration properties for stats. See {@link Navigation} for properties
     @return {Navigation} Navigation Object
    */
    NavigationFactory.prototype.createPlanete = function (view,options) {
        // Check option HERE
        planetNavigation = new Navigation(view);
        return planetNavigation;
    };

    /**
     Create and get an Astro Navigation
     @function createAstro
     @memberof NavigationFactory.prototype
     @param {Sky} view
     @param {JSON} options Configuration properties for stats. See {@link AstroNavigation} for properties
     @return {AstroNavigation} Astro navigation Object
    */
    NavigationFactory.prototype.createAstro = function (view,options) {
        astroNavigation = new AstroNavigation(view,options);
        return astroNavigation;
    };

    /**
     Create and get a Flat Navigation
     @function createFlat
     @memberof NavigationFactory.prototype
     @param {Planet} view
     @param {JSON} options Configuration properties for stats. See {@link FlatNavigation} for properties
     @return {FlatNavigation} Astro navigation Object
    */
    NavigationFactory.prototype.createFlat = function (view,options) {
        flatNavigation = new FlatNavigation(view,options);
        return flatNavigation;
    };

    /**
     Create and get a Google Mouse Navigation Handler
     @function createGoogleMouseHandler
     @memberof NavigationFactory.prototype
     @return {GoogleMouseNavigationHandler} Google Mouse Navigation Handler Object
    */
    NavigationFactory.prototype.createGoogleMouseHandler = function () {
        handler = new GoogleMouseNavigationHandler();
        return handler;
    };

    /**
     Create and get a Keyboard Navigation Handler
     @function createKeyboardHandler
     @memberof NavigationFactory.prototype
     @return {KeyboardNavigationHandler} Keyboard Navigation Handler Object
    */
    NavigationFactory.prototype.createKeyboardHandler = function () {
      handler = new KeyboardNavigationHandler();
      return handler;
    };

    /**************************************************************************************************************/

    return NavigationFactory;

});
