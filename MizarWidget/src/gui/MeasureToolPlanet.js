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
 * Tool designed to measure the distance between two points in planet mode
 */

define(["jquery", "underscore-min", "./MeasureToolPlanetCore", "gw/Utils/Utils", "jquery.ui"],
    function ($, _, MeasureToolPlanetCore, Utils) {

        var navigation, context,onselect, scale, self;

        /**
         *    @constructor
         *    @param options Configuration options
         *        <ul>
         *            <li>context: context</li>
         *            <li>onselect: On select callback</li>
         *        </ul>
         */
        var MeasureToolPlanet = function (options) {
            // Required options
            context = options.context;
            onselect = options.onselect;

            MeasureToolPlanetCore.init(options);

            this.renderContext = context.planet.renderContext;

            // Measure attributes
            //this.distance;
            //this.pickPoint; // Window pick point
            //this.secondPickPoint; // Window second pick point
            //this.geoDistance;
            //this.geoPickPoint; // Pick point in geographic reference
            //this.secondGeoPickPoint; // Pick point in geographic reference

            self = this;

            var _handleMouseUp = function (event) {

                if (!MeasureToolPlanetCore.activated) {
                    return;
                }
                MeasureToolPlanetCore._handleMouseUp(event);
                $.proxy(self.displayButtonElevation(event), self);

            };

            $('#elevationTrackingBtn').button()
                .click($.proxy(self.displayPopupElevation, this));

            self.renderContext.canvas.addEventListener("contextmenu", function () {
                return false;
            });
            self.renderContext.canvas.addEventListener("mousedown", $.proxy(MeasureToolPlanetCore._handleMouseDown, this));
            self.renderContext.canvas.addEventListener("mouseup", $.proxy(_handleMouseUp, this));
            self.renderContext.canvas.addEventListener("mousemove", $.proxy(MeasureToolPlanetCore._handleMouseMove, this));

            if (options.isMobile) {
                self.renderContext.canvas.addEventListener("touchend", $.proxy(_handleMouseUp, this));
                self.renderContext.canvas.addEventListener("touchmove", $.proxy(MeasureToolPlanetCore._handleMouseMove, this));
                self.renderContext.canvas.addEventListener("touchstart", $.proxy(MeasureToolPlanetCore._handleMouseDown, this));
            }

            $('#measurePlanetInvoker').on('click', function () {
                self.toggle();
            }).hover(function () {
                $(this).animate({left: '-10px'}, 100);
            }, function () {
                $(this).animate({left: '-20px'}, 100);
            });
        };

        MeasureToolPlanet.prototype.updateContext = function (pContext) {
          MeasureToolPlanetCore.updateContext(pContext);
        };
        /**
         *    Enable/disable the tool
         */
        MeasureToolPlanet.prototype.toggle = function () {
            MeasureToolPlanetCore.activated = !MeasureToolPlanetCore.activated;
            if (MeasureToolPlanetCore.activated) {
                $(self.renderContext.canvas).css('cursor', 'url(css/images/selectionCursor.png)');
            }
            else {
                $(self.renderContext.canvas).css('cursor', 'default');
                $('#elevationTrackingBtn').hide();
                try {
                    $('#popupElevation').dialog('close');
                } catch (e) {
                }

                MeasureToolPlanetCore.clear();
            }
            $('#measurePlanetInvoker').toggleClass('selected');
        };

        /**************************************************************************************************************/

        /**
         * Display a popup proposing to display elevation tracking
         */
        MeasureToolPlanet.prototype.displayButtonElevation = function (event) {

            $('#elevationTrackingBtn').button()
                .show()
                .position({
                    my: "left+3 bottom-3",
                    of: event,
                    collision: "fit"
                });

        };

        /**************************************************************************************************************/

        /**
         * Display a popup proposing to display elevation tracking
         */
        MeasureToolPlanet.prototype.displayPopupElevation = function (event) {

            var options = {};
            var intermediatePoints = MeasureToolPlanetCore.calculateIntermediateElevationPoint(options, MeasureToolPlanetCore.geoPickPoint, MeasureToolPlanetCore.secondGeoPickPoint);

            MeasureToolPlanetCore.storeDistanceAndElevation(intermediatePoints[0], intermediatePoints[0]);
            for (var i = 0; i < intermediatePoints.length; i++) {
                MeasureToolPlanetCore.storeDistanceAndElevation(intermediatePoints[0], intermediatePoints[i]);
            }

            $("#popupElevation").dialog({
                width: 500,
                height: 400,
                position: {
                    my: "right top",
                    at: "right top",
                    of: window
                }
            });

            $.plot("#popupElevation", [{
                data: MeasureToolPlanetCore.elevations, label: "elevation (m)"
            }], {
                series: {
                    color: "#F68D12",
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                grid: {
                    hoverable: true
                },
                tooltip: {
                    show: true,
                    content: "Distance: %x | Elevation: %y",
                    cssClass: "flotTip",
                    shifts: {
                        x: -25,
                        y: -60
                    }
                },
                xaxis: {
                    axisLabel: 'Distance (km)',
                    axisLabelUseCanvas: false,
                    axisLabelFontSizePixels: 20
                },
                yaxis: {
                    axisLabel: 'Elevation (m)',
                    axisLabelUseCanvas: false,
                    axisLabelFontSizePixels: 20
                },
                zoom: {
                    interactive: true
                },
                pan: {
                    interactive: true
                }
            });
        };

        return MeasureToolPlanet;

    });
