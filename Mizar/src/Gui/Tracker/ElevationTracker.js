/**
 * Elevation tracker : show elevation in meters from current mouse position
 */
define(["jquery", "./AbstractTracker", "../../Utils/Utils", "../../Utils/UtilsCore"],
    function ($, AbstractTracker, Utils,UtilsCore) {

        var globe;
        var element;
        var scale;
        var self;

        /**
         * @name ElevationTracker
         * @class
         *   ElevationTracker context constructor
         * @augments AbstractTracker
         * @param options
         *          <ul>
         *              <li>globe : the globe</li>
         *              <li>element : tracker div element</li>
         *              <li>elevationTracker : if a tracker is already defined</li>
         *              <li>elevationLayer : eleveationLayer from planetLayer</li>
         *              <li>isMobile : mobile mode or not</li>
         * @constructor
         */
        var ElevationTracker = function (options) {
            AbstractTracker.prototype.constructor.call(this, options);

            self = this;
            globe = options.globe;
            element = options.element;
            if (options.elevationLayer !== null && options.elevationLayer !== undefined) {
                scale = options.elevationLayer.hasOwnProperty('scale') ? options.elevationLayer.scale : 1;
                if (options.elevationTracker.position) {
                    $("#" + element).css(options.elevationTracker.position, "2px");
                }

                globe.renderContext.canvas.addEventListener('mousemove', self.update);
                if (options.isMobile) {
                    globe.renderContext.canvas.addEventListener('touchmove', self.update);
                }
            }
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractTracker, ElevationTracker);

        /**************************************************************************************************************/

        /**
         * Update the tracker
         * @function update
         * @memberof AbstractTracker.prototype
         * @param {object} event
         */
        ElevationTracker.prototype.update = function (event) {
            if (event.type.search("touch") >= 0) {
                event.clientX = event.changedTouches[0].clientX;
                event.clientY = event.changedTouches[0].clientY;
            }

            var geoPos = globe.getLonLatFromPixel(event.clientX, event.clientY);
            if (geoPos && mizar.mode === "planet") {
                var elevation = self.compute([geoPos[0], geoPos[1]]);
                document.getElementById(element).innerHTML = UtilsCore.roundNumber(elevation / scale, 0) + " meters";
            } else {
                document.getElementById(element).innerHTML = "";
            }
        };

        /**************************************************************************************************************/

        /**
         * Compute elevation from a specific point
         * @function compute
         * @memberof AbstractTracker.prototype
         * @param geoPosition
         * @returns {number} elevation
         */
        ElevationTracker.prototype.compute = function (geoPosition) {
            return globe.getElevation(geoPosition[0], geoPosition[1]);
        };

        /**************************************************************************************************************/

        return ElevationTracker;

    });
