/*******************************************************************************
 * Copyright 2012-2015 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
 *
 * This file is part of SITools2.
 *
 * SITools2 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * SITools2 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/*global define: false */

/**
 * Position tracker : show mouse position formated in default coordinate system
 */
define(["jquery", "./AbstractTracker", "Utils"],
    function ($, AbstractTracker, Utils) {

        var globe;
        var element;
        var self;

        /**
         * ElevationTracker context constructor
         * @param options
         *          <ul>
         *              <li>globe : the globe</li>
         *              <li>element : tracker div element</li>
         *              <li>positionTracker : if a tracker is already defined</li>
         *              <li>isMobile : mobile mode or not</li>
         * @constructor
         */
        var PositionTracker = function (options) {
            AbstractTracker.prototype.constructor.call(this, options);

            self = this;
            globe = options.globe;
            element = options.element;
            if (options.positionTracker.position) {
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
                document.getElementById(element).innerHTML = astro[0] + " x " + astro[1];
            } else {
                document.getElementById(element).innerHTML = "";
            }
        };

        /**************************************************************************************************************/

        /**
         * Compute position from a specific point
         * @param geoPosition
         * @returns {number} elevation
         */
        PositionTracker.prototype.compute = function (geoPosition) {
            return Utils.formatCoordinates([geoPosition[0], geoPosition[1]]);
        };

        /**************************************************************************************************************/

        return PositionTracker;

    });
