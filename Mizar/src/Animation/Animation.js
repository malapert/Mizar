define(function () {
  /**
   @name Animation
   @class
    Base animation class.
   @constructor
   */
    var Animation = function () {
        this.startTime = -1;
        this.pauseTime = -1;
        this.renderContext = null;
    };

    /**
     * Get render context
     * @function getRenderContext
     * @memberof Animation.prototype
     *
     * @return {RenderContext} Render context
     */
     Animation.prototype.getRenderContext = function () {
       return this.renderContext;
     }

     /**
      * Set render context
      * @function setRenderContext
      * @memberof Animation.prototype
      *
      * @param {RenderContext} context Render context
      */
      Animation.prototype.setRenderContext = function (context) {
        this.renderContext = context;
      }
    /**************************************************************************************************************/
    /**
      Unregister as active animation
      @function _unregisterActive
      @memberof Animation.prototype
      @private
    */
    Animation.prototype._unregisterActive = function () {
        var index = this.renderContext.activeAnimations.indexOf(this);
        if (index >= 0) {
            this.renderContext.activeAnimations.splice(index, 1);
        }
    };

    /**************************************************************************************************************/
     /**
       Get animation status
       @function getStatus
       @memberof Animation.prototype
       @return {String} Status of animation : STOPPED, RUNNING or PAUSED
     */
    Animation.prototype.getStatus = function () {
        if (this.startTime === -1) {
            return "STOPPED";
        } else {
            return this.pauseTime === -1 ? "RUNNING" : "PAUSED";
        }
    };

    /**************************************************************************************************************/
     /**
      Start the animation, record the start time in startTime member
      and register the animation in the Mizar object.
      @function start
      @memberof Animation.prototype
     */
     Animation.prototype.start = function () {
        if (!this.renderContext) {
            return;
        }

        if (this.startTime === -1 || this.pauseTime !== -1) {
            var now = Date.now();
            if (this.startTime === -1) {
                this.startTime = now;
            }
            else {
                // resume after pause
                this.startTime += now - this.pauseTime;
                this.pauseTime = -1;
            }

            // Register animation as active
            this.renderContext.activeAnimations.push(this);
            this.renderContext.requestFrame();
        }
    };

    /**************************************************************************************************************/
     /**
      Pause the animation
      @function pause
      @memberof Animation.prototype
     */
    Animation.prototype.pause = function () {
        if (!this.renderContext) {
            return;
        }

        if (this.startTime !== -1 && this.pauseTime === -1) {
            this.pauseTime = Date.now();
            this._unregisterActive(this);
        }
    };

    /**************************************************************************************************************/
     /**
      Stop the animation, removes the animation from the Mizar object
      @function stop
      @memberof Animation.prototype
     */
    Animation.prototype.stop = function () {
        this.startTime = -1;
        this.pauseTime = -1;

        if (this.onstop) {
            this.onstop();
        }

        // Unregister animation
        this._unregisterActive(this);
    };

    /**************************************************************************************************************/

    return Animation;

});
