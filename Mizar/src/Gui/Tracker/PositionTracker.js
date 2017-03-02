/**
 * Position tracker : show mouse position formated in default coordinate system
 */
define(["jquery", "./AbstractTracker", "../../Utils/Utils"],
    function ($, AbstractTracker, Utils) {

        var globe;
        var element;
        var self;

        /**
         * @name PositionTracker
         * @class
         *    PositionTracker context constructor
         * @augments AbstractTracker
         * @param options
         *          <ul>
         *              <li>globe : the globe</li>
         *              <li>element : tracker div element</li>
         *              <li>positionTracker : if a tracker is already defined</li>
         *              <li>isMobile : mobile mode or not</li>
         * @constructor
         */
        var PositionTracker = function (parentElement,options) {
            AbstractTracker.prototype.constructor.call(this, options);

            this.parentElement = parentElement;

            self = this;
            globe = options.globe;
            element = options.element;
            if ((options.positionTracker) && (options.positionTracker.position)) {
                $("#" + element).css(options.positionTracker.position, "2px");
            }

            globe.renderContext.canvas.addEventListener('mousemove', self.update);
            if (options.isMobile) {
                globe.renderContext.canvas.addEventListener('touchmove', self.update);
            }
        };
        /**************************************************************************************************************/

        Utils.inherits(AbstractTracker, PositionTracker);

        /**************************************************************************************************************/

        /**
         * Update the tracker
         * @function update
         * @memberof AbstractTracker.prototype
         * @param {object} event
         */
        PositionTracker.prototype.update = function (event) {
            if (event.type.search("touch") >= 0) {
                event.clientX = event.changedTouches[0].clientX;
                event.clientY = event.changedTouches[0].clientY;
            }

            var geoPos = globe.getLonLatFromPixel(event.clientX, event.clientY);
            if (geoPos) {
                var astro = self.compute([geoPos[0], geoPos[1]]);
                if (document.getElementById(element)) {
                  document.getElementById(element).innerHTML = astro[0] + " x " + astro[1];
                }
            } else {
                if (document.getElementById(element)) {
                  document.getElementById(element).innerHTML = "";
                }
            }
        };

        /**************************************************************************************************************/

        /**
         * Compute position from a specific point
         * @function compute
         * @memberof AbstractTracker.prototype
         * @param geoPosition
         * @returns {number} elevation
         */
        PositionTracker.prototype.compute = function (geoPosition) {
            return this.parentElement.parentElement.ToolBox.formatCoordinates([geoPosition[0], geoPosition[1]]);
        };

        /**************************************************************************************************************/

        return PositionTracker;

    });
