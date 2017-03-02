/**
 *    Abstract class for tracker (position, elevation...)
 *    Implemented by concrete trackers like ElevationTracker and PositionTracker
 */
define(["jquery"],
    function ($) {

        /**************************************************************************************************************/

        /**
         * @name AbstractTracker
         * @class
         *    Abstract class for tracker (position, elevation...)
         * @param {object} options
         * @constructor
         */
        var AbstractTracker = function (options) {
            this.options = options;
        };

        /**************************************************************************************************************/

        /**
         * Update the tracker
         * @function update
         * @memberof AbstractTracker.prototype
         * @param event
         */
        AbstractTracker.prototype.update = function (event) {
        };

        /**************************************************************************************************************/

        /**
         * Compute from geoPosition
         * @function compute
         * @memberof AbstractTracker.prototype
         * @param {Array} geoPosition
         */
        AbstractTracker.prototype.compute = function (geoPosition) {
        };

        /**************************************************************************************************************/

        return AbstractTracker;
    });
