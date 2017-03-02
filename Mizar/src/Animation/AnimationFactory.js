define([ "../Utils/Constants","./SegmentedAnimation","./PathAnimation","./InertiaAnimation","./InterpolatedAnimation"],
    function (Constants,SegmentedAnimation,PathAnimation,InertiaAnimation,InterpolatedAnimation
    ) {


    /**
     @name AnimationFactory
     @class
     Animation Factory
    */
    var AnimationFactory = function () {
    };


    /**
     * Create and get an animation
     * @function create
     * @memberof AnimationFactory.prototype
     *
     * @param {String} type Type of animation to create.Can be :
     * <ul>
     *  <li>Inertia</li>
     *  <li>Interpolated</li>
     *  <li>Path</li>
     *  <li>Segmented</li>
     * </ul>
     * @param options Configuration properties for the context.
     * <ul>
     *  <li> See {@link IntertiaAnimation} for Inertia properties</li>
     *  <li> See {@link InterpolatedAnimation} for Interpolated properties</li>
     *  <li> See {@link PathAnimation} for Path properties</li>
     *  <li> See {@link SegmentedAnimation} for Segmented properties</li>
     * </ul>
     * @return {Animation} Animation Object
     */
    AnimationFactory.prototype.create = function(type,options) {
          switch (type) {
            case Constants.ANIMATION.Intertia :
              return this.createInertia(options);
            case Constants.ANIMATION.Interpolated :
              return this.createInterpolated(options);
            case Constants.ANIMATION.Path :
              return this.createPath(options);
            case Constants.ANIMATION.Segmented :
              return this.createSegmented(options);
          }
          // TODOFL Throw an error
          return null;
    }

    /**
     * Create and get inertia animation
     * @function createIntertia
     * @memberof AnimationFactory.prototype
     * @param options Configuration properties for the Inertia animation. See {@link InertiaAnimation} for properties
     * @return {InertiaAnimation} Inertia Animation Object
     * @private
     */
     AnimationFactory.prototype.createInertia = function (options) {
       var inertia = new InertiaAnimation(options);
       return inertia;
     };

     /**
      * Create and get interpolated animation
      * @function createInterpolated
      * @memberof AnimationFactory.prototype
      * @param options Configuration properties for the Interpolated animation. See {@link InterpolatedAnimation} for properties
      * @return {InterpolatedAnimation} Interpolated Animation Object
      * @private
      */
      AnimationFactory.prototype.createInterpolated = function (options) {
        var interpolated = new InterpolatedAnimation(options);
        return interpolated;
      };

    /**
     * Create and get segmented animation
     * @function createSegmented
     * @memberof AnimationFactory.prototype
     * @param options Configuration properties for the Segmented animation. See {@link SegmentedAnimation} for properties
     * @return {SegmentedAnimation} Segmented Animation Object
     * @private
     */
     AnimationFactory.prototype.createSegmented = function (options) {
       var segmented = new SegmentedAnimation(options);
       return segmented;
     };

     /**
      * Create and get path
      * @function createPath
      * @memberof AnimationFactory.prototype
      * @param options Configuration properties for the path animation. See {@link PathAnimation} for properties
      * @private
      */
      AnimationFactory.prototype.createPath = function (options) {
        var path = new PathAnimation(options);
        return path;
      };

    /**************************************************************************************************************/

    return AnimationFactory;

});
