define(['../Utils/Utils', './Animation', '../Utils/Numeric'], function (Utils, Animation, Numeric) {
  /**
   *    @name SegmentedAnimation
   *    @class
   *      SegmentedAnimation is an animation defined with segments.
   *      Each segment has a [start,end] pair of 't' value and a [start,end] pair of
   *      values that will be interpolated with the interpolator set on the segment.
   *      When the animation runs, a t parameter is mapped to [0,1] according to
   *      current time and animation duration.
   *      The current segment is then looked up with that 't' value and used to interpolate
   *      the animation's current value.
   *    @augments Animation
   *    @param options Configuration of the animation
   *            <ul>
   *                <li>duration : duration of the animation</li>
   *                <li>valueSetter : the function used to set the value</li>
   *            </ul>
   *    @constructor
   */
    var SegmentedAnimation = function (options) {
        // Call ancestor constructor
        Animation.prototype.constructor.call(this);

        this.segments = [];
        this.duration = options.duration;
        this.valueSetter = options.valueSetter;
    };

    /**************************************************************************************************************/

    Utils.inherits(Animation, SegmentedAnimation);

    /**
     *    @name Segment
     *    @class
     *      Segment
     *    @param {?} start t value at which the segment will be the current segment
     *    @param {?} startValue value at t=start
     *    @param {?} end value at which the segment will be the current segment
     *    @param {?} endValue value at t=end
     *    @param {?} interpolator
     *    @constructor
     */
    var Segment = function (start, startValue, end, endValue, interpolator) {
        this.start = start;
        this.startValue = startValue;
        this.end = end;
        this.endValue = endValue;
        this.interpolator = interpolator;
    };

    /**************************************************************************************************************/

    /**
    Adds a new segment to the animation.
    start, end are 't' values at which the segment will be the current segment
    startValue, endValue are animation values at 't'=start and 't'=end
    interpolator is the function that will be called to interpolate bewteen startValue and endValue.
     @function addSegment
     @param {?} start t value at which the segment will be the current segment
     @param {?} startValue value at t=start
     @param {?} end value at which the segment will be the current segment
     @param {?} endValue value at t=end
     @param {?} interpolator
     @memberof SegmentedAnimation.prototype
    */
    SegmentedAnimation.prototype.addSegment = function (start, startValue, end, endValue, interpolator) {
        var count = this.segments.length;
        var index = 0;
        while (index < count && this.segments[index].end <= start) {
          index++;
        }
        // Insert new segment at position 'index'
        this.segments.splice(index, 0, new Segment(start, startValue, end, endValue, interpolator));
    };

    /**************************************************************************************************************/
     /**
      Animation update method
      @function update
      @memberof SegmentedAnimation.prototype
      @param {?} now Now
     */
    SegmentedAnimation.prototype.update = function (now) {
        var t = Numeric.map01(now, this.startTime, this.startTime + this.duration);
        if (t >= 1) {
            // Set last value
            var lastIndex = this.segments.length - 1;
            this.valueSetter(this.segments[lastIndex].endValue);
            this.stop();
        }
        else {
            // Find current segment
            var count = this.segments.length;
            var index = 0;
            while (index < count && this.segments[index].end < t) {
              index++;
            }
            index = Math.min(index, count - 1);

            // Remap t between segment bounds
            t = Numeric.map01(t, this.segments[index].start, this.segments[index].end);
            // Interpolate value
            var value = this.segments[index].interpolator(t, this.segments[index].startValue, this.segments[index].endValue);
            // Use value
            this.valueSetter(value);
        }
    };

    /**************************************************************************************************************/

    return SegmentedAnimation;

});
