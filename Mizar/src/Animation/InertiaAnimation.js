define(['../Utils/Utils', './Animation'], function (Utils, Animation) {

    /**************************************************************************************************************/

    var epsilon = 0.1;

    /**
     *    @name InertiaAnimation
     *    @class
     *      Animation simulating inertia for camera navigation
     *    @augments Animation
     *    @param {JSON} options Configuration of InertiaAnimation
     *            <ul>
     *                <li>navigation : Navigation</li>
     *                <li>panFactor : Pan factor</li>
     *                <li>rotateFactor : Rotate factor</li>
     *                <li>zoomFactor : Zoom factor</li>
     *            </ul>
     *    @constructor
     */
    var InertiaAnimation = function (options) {
        Animation.prototype.constructor.call(this);

        if (options) {
            this.panFactor = options.hasOwnProperty('panFactor') ? options.panFactor : 0.95;
            this.rotateFactor = options.hasOwnProperty('rotateFactor') ? options.rotateFactor : 0.95;
            this.zoomFactor = options.hasOwnProperty('zoomFactor') ? options.zoomFactor : 0.95;
        }

        this.type = null;
        this.dx = 0;
        this.dy = 0;
        this.navigation = options.nav;
        this.renderContext = options.nav.renderContext;
    };

    /**************************************************************************************************************/

    Utils.inherits(Animation, InertiaAnimation);

    /**************************************************************************************************************/

     /**
      Update inertia
      @function update
      @memberof InertiaAnimation.prototype
     */
    InertiaAnimation.prototype.update = function (now) {
        var hasToStop = false;

        switch (this.type) {
            case "pan":
                this.navigation.pan(this.dx, this.dy);
                this.dx *= this.panFactor;
                this.dy *= this.panFactor;
                hasToStop = (Math.abs(this.dx) < epsilon && Math.abs(this.dy) < epsilon);
                break;
            case "rotate":
                this.navigation.rotate(this.dx, this.dy);
                this.dx *= this.rotateFactor;
                this.dy *= this.rotateFactor;
                hasToStop = (Math.abs(this.dx) < epsilon && Math.abs(this.dy) < epsilon);
                break;
            case "zoom":
                this.navigation.zoom(this.dx);
                this.dx *= this.zoomFactor;
                hasToStop = (Math.abs(this.dx) < epsilon);
                break;
            default:
        }
        this.navigation.renderContext.requestFrame();

        if (hasToStop) {
            this.stop();
        }
    };

    /**************************************************************************************************************/

     /**
      Launch
      @function launch
      @memberof InertiaAnimation.prototype
      @param {String} type Type of inertia
      <ul>
        <li>pan</li>
        <li>rotate</li>
        <li>zoom</li>
      </ul>
      @param {Int} dx x of inertiaVector Vector of mouvement in window coordinates(for pan and rotate inertias)
      @param {Int} dy x of inertiaVector Vector of mouvement in window coordinates(for pan and rotate inertias)
     */
    InertiaAnimation.prototype.launch = function (type, dx, dy) {
        // Set first value
        this.type = type;
        this.dx = dx;
        this.dy = dy;

        this.start();
    };

    /**************************************************************************************************************/

    return InertiaAnimation;

});
