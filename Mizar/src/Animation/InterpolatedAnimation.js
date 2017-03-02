define(['../Utils/Utils', './Animation'], function (Utils, Animation) {
  /**
   *    @name InterpolatedAnimation
   *    @class
   *      Generic animation to interpolate arbitrary values
   *      The animation will interpolate between startValue and endValue, using the
   *      interpolateFunction(t, startValue, endValue) (t [0,1])
   *      The interpolated value is then given to the setFunction(value)
   *    @augments Animation
   *    @param {JSON} options Configuration of InterpolatedAnimation
   *            <ul>
   *                <li>panFactor : pan factor</li>
   *                <li>startValue : start value of interpolation</li>
   *                <li>endEvalue : end value of interpolation</li>
   *                <li>interpolationFunction : interpolation function</li>
   *                <li>setFunction : function to manage interpolated value</li>
   *            </ul>
   *    @constructor
   */
    var InterpolatedAnimation = function (options) {
        // Call ancestor constructor
        Animation.prototype.constructor.call(this);

        this.values = [[0.0, options.startValue], [1.0, options.endValue]];
        this.duration = options.duration;
        this.interpolationFunction = options.interpolationFunction;
        this.setFunction = options.setFunction;
    };

    /**************************************************************************************************************/

    Utils.inherits(Animation, InterpolatedAnimation);

    /**************************************************************************************************************/

     /**
      Adds a new value to the animation
      @function addValue
      @param {Int} t Value at [0,1]
      @param {Int} value Value to reach
      @memberof InterpolatedAnimation.prototype
     */
    InterpolatedAnimation.prototype.addValue = function (t, value) {
        var count = this.values.length;
        var upper = 0;
        while (upper < count && this.values[upper][0] < t) {
          upper++;
        }
        // Insert new value at position 'upper'
        this.values.splice(upper, 0, [t, value]);
    };

    /**************************************************************************************************************/
    /**
     Start
     @function start
     @memberof InterpolatedAnimation.prototype
    */
    InterpolatedAnimation.prototype.start = function () {
        Animation.prototype.start.call(this);
        this.setFunction(this.startValue);
    };

    /**************************************************************************************************************/

    /**
     Stop
     @function stop
     @memberof InterpolatedAnimation.prototype
    */
    InterpolatedAnimation.prototype.stop = function () {
        Animation.prototype.stop.call(this);
        this.setFunction(this.endValue);
    };

    /**************************************************************************************************************/
     /**
      Animation update method
      @function update
      @memberof InterpolatedAnimation.prototype
      @param {Int} now Now
     */
    InterpolatedAnimation.prototype.update = function (now) {
        var t = Numeric.map01(now, this.startTime, this.startTime + this.duration);
        if (t >= 1) {
            this.stop();
            return;
        }

        // Find upper and lower bounds
        var count = this.values.length;
        var upper = 0;
        while (upper < count && this.values[upper][0] < t) {
          upper++;
        }
        upper = Math.min(upper, count - 1);
        var lower = Math.max(0, upper - 1);

        // Remap t between lower and upper bounds
        t = Numeric.map01(t, this.values[lower][0], this.values[upper][0]);
        // Interpolate value
        var value = this.interpolationFunction(t, this.values[lower][1], this.values[upper][1]);
        // Use interpolated value
        this.setFunction(value);
    };

    /**************************************************************************************************************/

    return InterpolatedAnimation;

});
