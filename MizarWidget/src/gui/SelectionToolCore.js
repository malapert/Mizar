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
 * Tool designed to select areas on planet
 */

define(["jquery", "gw/Layer/VectorLayer", "gw/Renderer/FeatureStyle", "gw/Utils/Numeric", "gw/Renderer/Ray", "gw/Utils/UtilsCore", "gw/Renderer/glMatrix"],
    function ($, VectorLayer, FeatureStyle, Numeric, Ray, UtilsCore) {


        /**
         *    @constructor
         *    @param options Configuration options
         *        <ul>
         *            <li>planet: planet</li>
         *            <li>navigation: Navigation</li>
         *            <li>onselect: On selection callback</li>
         *            <li>style: Selection tool style</li>
         *        </ul>
         */
        var SelectionToolCore = function (options) {
            // Required options
            var planet = options.planet;
            var navigation = options.navigation;
            var onselect = options.onselect;

            this.activated = options.activated || false;
            this.renderContext = planet.renderContext;
            this.coordinateSystem = planet.coordinateSystem;

            // Set style
            var style;
            if (options && options.style) {
                style = options.style;
            }
            else {
                style = new FeatureStyle();
            }
            style.zIndex = 2;

            // Layer containing selection feature
            this.selectionLayer = new VectorLayer({
                style: style
            });
            planet.addLayer(this.selectionLayer);

            this.selectionFeature = null;

            // Selection attributes
            this.radius;	// Window radius
            this.pickPoint; // Window pick point
            this.geoRadius; // Radius in geographic reference
            this.geoPickPoint; // Pick point in geographic reference

            var self = this;
            var dragging = false;
            var state;

            this.renderContext.canvas.addEventListener("mousedown", function (event) {

                var pickPoint = [event.layerX, event.layerY];
                var geoPickPoint = planet.getLonLatFromPixel(event.layerX, event.layerY);

                if (!self.activated && !self.selectionFeature) {
                    return;
                }

                // Dragging : moving/resizing OR drawing selection
                if (self.activated) {
                    // Draw
                    navigation.stop();
                    dragging = true;
                    self.pickPoint = pickPoint;
                    self.geoPickPoint = geoPickPoint;
                    self.radius = 0.0;
                    state = "resize";
                }
                else {
                    var pickIsInside = UtilsCore.pointInRing(geoPickPoint, self.selectionFeature.geometry.coordinates[0]);
                    if (!pickIsInside) {
                        return;
                    }
                    navigation.stop();
                    dragging = true;
                    // Resize/move
                    var inside = false;
                    // Check if user clicked on one of control points
                    for (var i = 0; i < self.selectionFeature.geometry.coordinates[0].length; i++) {
                        var controlPoint = self.selectionFeature.geometry.coordinates[0][i];
                        inside |= UtilsCore.pointInSphere(geoPickPoint, controlPoint, 20);
                    }

                    if (inside) {
                        state = "resize";
                    }
                    else {
                        state = "move";
                    }
                }
            });

            this.renderContext.canvas.addEventListener("mousemove", function (event) {
                if (!dragging) {
                    return;
                }

                var geoPickPoint = planet.getLonLatFromPixel(event.layerX, event.layerY);
                if (state === "resize") {
                    // Update radius
                    self.radius = Math.sqrt(Math.pow(event.layerX - self.pickPoint[0], 2) + Math.pow(event.layerY - self.pickPoint[1], 2));
                    self.computeGeoRadius(geoPickPoint);
                }
                else if (state === "move") {
                    // Update pick point position
                    self.pickPoint = [event.layerX, event.layerY];
                    self.geoPickPoint = planet.getLonLatFromPixel(event.layerX, event.layerY);

                    // TODO: scale radius of selection shape if fov has been changed(or not?)
                }
                self.updateSelection();
            });

            this.renderContext.canvas.addEventListener("mouseup", function (event) {
                if (!dragging) {
                    return;
                }

                // Compute geo radius
                var stopPickPoint = planet.getLonLatFromPixel(event.layerX, event.layerY);

                var coordinates = self.computeSelection();
                if (self.activated && onselect) {
                    onselect(coordinates);
                }

                // Reactivate standard navigation events
                navigation.start();
                dragging = false;
            });
        };

        /**********************************************************************************************/

        /**
         *    Compute selection tool radius between pickPoint and the given point
         *    @param {Array} pt point
         */
        SelectionToolCore.prototype.computeGeoRadius = function (pt) {
            // Find angle between start and stop vectors which is in fact the radius
            var dotProduct = vec3.dot(vec3.normalize(this.coordinateSystem.fromGeoTo3D(pt)), vec3.normalize(this.coordinateSystem.fromGeoTo3D(this.geoPickPoint)));
            var theta = Math.acos(dotProduct);
            this.geoRadius = Numeric.toDegree(theta);
        };

        /**********************************************************************************************/

        /**
         *    Compute selection for the given pick point depending on radius
         *    @return {Array} points
         */
        SelectionToolCore.prototype.computeSelection = function () {
            var rc = this.renderContext;
            var tmpMat = mat4.create();

            // Compute eye in world space
            mat4.inverse(rc.viewMatrix, tmpMat);
            var eye = [tmpMat[12], tmpMat[13], tmpMat[14]];

            // Compute the inverse of view/proj matrix
            mat4.multiply(rc.projectionMatrix, rc.viewMatrix, tmpMat);
            mat4.inverse(tmpMat);

            // Scale to [-1,1]
            var widthScale = 2 / rc.canvas.width;
            var heightScale = 2 / rc.canvas.height;
            var points = [
                [(this.pickPoint[0] - this.radius) * widthScale - 1.0, ((rc.canvas.height - this.pickPoint[1]) - this.radius) * heightScale - 1.0, 1, 1],
                [(this.pickPoint[0] - this.radius) * widthScale - 1.0, ((rc.canvas.height - this.pickPoint[1]) + this.radius) * heightScale - 1.0, 1, 1],
                [(this.pickPoint[0] + this.radius) * widthScale - 1.0, ((rc.canvas.height - this.pickPoint[1]) + this.radius) * heightScale - 1.0, 1, 1],
                [(this.pickPoint[0] + this.radius) * widthScale - 1.0, ((rc.canvas.height - this.pickPoint[1]) - this.radius) * heightScale - 1.0, 1, 1]
            ];

            // Transform the four corners of selection shape into world space
            // and then for each corner compute the intersection of ray starting from the eye with the sphere
            var worldCenter = [0, 0, 0];
            for (var i = 0; i < 4; i++) {
                mat4.multiplyVec4(tmpMat, points[i]);
                vec3.scale(points[i], 1.0 / points[i][3]);
                vec3.subtract(points[i], eye, points[i]);
                vec3.normalize(points[i]);

                var ray = new Ray(eye, points[i]);
                var pos3d = ray.computePoint(ray.sphereIntersect(worldCenter, this.coordinateSystem.geoide.radius));
                points[i] = this.coordinateSystem.from3DToGeo(pos3d);
            }

            return points;
        };

        /**************************************************************************************************************/

        /**
         *    Update selection coordinates
         */
        SelectionToolCore.prototype.updateSelection = function () {
            if (this.selectionFeature) {
                this.selectionLayer.removeFeature(this.selectionFeature);
            }

            var coordinates = this.computeSelection();
            // Close the polygon
            coordinates.push(coordinates[0]);

            this.selectionFeature = {
                "geometry": {
                    "gid": "selectionShape",
                    "coordinates": [coordinates],
                    "type": "Polygon"
                },
                "type": "Feature"
            };

            this.selectionLayer.addFeature(this.selectionFeature);
        };

        /**************************************************************************************************************/

        /**
         *    Activate/desactivate the tool
         */
        SelectionToolCore.prototype.toggle = function () {
            this.activated = !this.activated;
            if (this.activated) {
                // TODO : Find more sexy image for cursor
                $(this.renderContext.canvas).css('cursor', 'url(css/images/selectionCursor.png)');
            }
            else {
                $(this.renderContext.canvas).css('cursor', 'default');
            }
        };

        /**************************************************************************************************************/

        /**
         *    Clear selection
         */
        SelectionToolCore.prototype.clear = function () {
            if (this.selectionFeature) {
                this.selectionLayer.removeFeature(this.selectionFeature);
            }

            this.pickPoint = null;
            this.radius = null;
            this.geoPickPoint = null;
            this.geoRadius = null;
        };

        /**************************************************************************************************************/

        return SelectionToolCore;

    });
