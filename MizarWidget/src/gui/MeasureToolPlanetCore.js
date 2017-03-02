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

define(["jquery", "underscore-min", "gw/Utils/UtilsCore", "gw/Layer/VectorLayer", "gw/Renderer/Ray", "gw/Utils/Numeric", "gw/Renderer/FeatureStyle", "gw/Renderer/glMatrix"],
    function ($, _, UtilsCore, VectorLayer, Ray, Numeric, FeatureStyle) {

        var navigation, context, onselect, scale, measureLayer, self, dragging;

        /**********************************************************************************************/

        /**
         * Get first Geo pick point in terms of cursor position
         * @param event
         * @returns {Array} geoPickPoint geo position on the planet
         */
        function _handleMouseDown(event) {
            event.preventDefault();
            if (!self.activated) {
                return;
            }

            context.navigation.stop();

            dragging = true;
            self.elevations = [];

            if (event.type.search("touch") >= 0) {
                self.pickPoint = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
            }
            else {
                self.pickPoint = [event.layerX, event.layerY];
            }
            var geo = context.planet.getLonLatFromPixel(self.pickPoint[0], self.pickPoint[1]);
            if (geo !== null) {
              self.geoPickPoint = context.planet.getLonLatFromPixel(self.pickPoint[0], self.pickPoint[1]);
            } else {
              return null;
            }
            return self.geoPickPoint;
        }

        /**
         * Close the measure with the last point
         * @param event
         */
        function _handleMouseUp(event) {
            event.preventDefault();

            // Compute geo radius
            var stopPickPoint;
            if (event.type.search("touch") >= 0) {
                stopPickPoint = context.planet.getLonLatFromPixel(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
            }
            else {

                stopPickPoint = context.planet.getLonLatFromPixel(event.layerX, event.layerY);
            }

            // No point found, picking was not on planet but sky
            if (!_.isEmpty(stopPickPoint)) {
                // Find angle between start and stop vectors which is in fact the radius
                var dotProduct = vec3.dot(vec3.normalize(context.planet.coordinateSystem.fromGeoTo3D(stopPickPoint)), vec3.normalize(context.planet.coordinateSystem.fromGeoTo3D(self.geoPickPoint)));
                var theta = Math.acos(dotProduct);
                self.geoDistance = Numeric.toDegree(theta);

                if (onselect) {
                    onselect();
                }
            }

            context.navigation.start();

            dragging = false;
        }

        /**
         * Update drawing and label in terms of current point
         * @param event
         */
        function _handleMouseMove(event) {
            event.preventDefault();
            if (!self.activated || !dragging) {
                return;
            }
            if (event.type.search("touch") >= 0) {
                self.secondPickPoint = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
            }
            else {
                self.secondPickPoint = [event.layerX, event.layerY];
            }

            var geo = context.planet.getLonLatFromPixel(self.secondPickPoint[0], self.secondPickPoint[1]);
            if (geo !== null) {
              self.secondGeoPickPoint = context.planet.getLonLatFromPixel(self.secondPickPoint[0], self.secondPickPoint[1]);
            } else {
              return;
            }
            //self.storeDistanceAndElevation(self.geoPickPoint, self.secondGeoPickPoint);

            // Update radius
            self.distance = Math.sqrt(Math.pow(self.secondPickPoint[0] - self.pickPoint[0], 2) + Math.pow(self.secondPickPoint[1] - self.pickPoint[1], 2));
            var dotProduct;
            if (self.secondGeoPickPoint === undefined) {
                dotProduct = vec3.dot(vec3.normalize(context.planet.coordinateSystem.fromGeoTo3D(self.secondPickPoint)), vec3.normalize(context.planet.coordinateSystem.fromGeoTo3D(self.geoPickPoint)));
            }
            else {
                dotProduct = vec3.dot(vec3.normalize(context.planet.coordinateSystem.fromGeoTo3D(self.secondGeoPickPoint)), vec3.normalize(context.planet.coordinateSystem.fromGeoTo3D(self.geoPickPoint)));
            }
            var theta = Math.acos(dotProduct);
            self.geoDistance = Numeric.toDegree(theta);

            updateMeasure();
        }

        /**************************************************************************************************************/

        /**
         * Transform coordinates to the right world space dimension
         * @param points
         * @returns {Array} points  points transformed
         */
        function computeIntersection(points) {
            var rc = self.renderContext;
            var tmpMat = mat4.create();

            // Computes eye in world space
            mat4.inverse(rc.viewMatrix, tmpMat);
            var eye = [tmpMat[12], tmpMat[13], tmpMat[14]];

            // Computes the inverse of view/proj matrix
            mat4.multiply(rc.projectionMatrix, rc.viewMatrix, tmpMat);
            mat4.inverse(tmpMat);

            // Transforms the four corners of measured shape into world space
            // and then for each corner computes the intersection of ray starting from the eye to the sphere
            var worldCenter = [0, 0, 0];
            for (var i = 0; i < points.length; i++) {
                mat4.multiplyVec4(tmpMat, points[i]);
                vec3.scale(points[i], 1.0 / points[i][3]);
                vec3.subtract(points[i], eye, points[i]);
                vec3.normalize(points[i]);

                var ray = new Ray(eye, points[i]);
                var pos3d = ray.computePoint(ray.sphereIntersect(worldCenter, context.planet.coordinateSystem.geoide.radius));
                //var pos3d = ray.computePoint(ray.sphereIntersect(worldCenter, 1));
                points[i] = context.planet.coordinateSystem.from3DToGeo(pos3d);
            }

            return points;
        }

        /**********************************************************************************************/

        function rotateVector2D(vec, theta) {
            theta = theta * Math.PI / 180;
            var cs = Math.cos(theta);
            var sn = Math.sin(theta);

            return [vec[0] * cs - vec[1] * sn, vec[0] * sn + vec[1] * cs];
        }

        function normalize2D(vec, dest) {
            if (!dest) {
                dest = vec;
            }

            var length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
            dest[0] = vec[0] / length;
            dest[1] = vec[1] / length;
            return dest;
        }

        /**********************************************************************************************/

        /**
         * Computes the measure for the given pick point depending on the second point (used to draw)
         * @returns {Array} points to draw
         */
        function computeMeasure() {

          var rc = self.renderContext;

          var widthScale = 2 / rc.canvas.width;
          var heightScale = 2 / rc.canvas.height;

          var points;
          if (context.navigation.type === "FlatNavigation") {
            points = [
                [self.geoPickPoint[0],self.geoPickPoint[1],1],
                [self.secondGeoPickPoint[0],self.secondGeoPickPoint[1],1]
            ];
            return points;
          }

            var diff = [self.secondPickPoint[0] - self.pickPoint[0], self.secondPickPoint[1] - self.pickPoint[1]];
            normalize2D(diff);

            // First arrow
            var arrow = rotateVector2D(diff, 30);
            var arrow2 = rotateVector2D(diff, -30);
            arrow = [self.pickPoint[0] + 10 * arrow[0], self.pickPoint[1] + 10 * arrow[1]];
            arrow2 = [self.pickPoint[0] + 10 * arrow2[0], self.pickPoint[1] + 10 * arrow2[1]];

            var diff2 = [-diff[0], -diff[1]];
            var arrow3 = rotateVector2D(diff2, 30);
            var arrow4 = rotateVector2D(diff2, -30);
            arrow3 = [self.secondPickPoint[0] + 10 * arrow3[0], self.secondPickPoint[1] + 10 * arrow3[1]];
            arrow4 = [self.secondPickPoint[0] + 10 * arrow4[0], self.secondPickPoint[1] + 10 * arrow4[1]];

            points = [
                [arrow[0] * widthScale - 1, (rc.canvas.height - arrow[1]) * heightScale - 1, 1, 1],
                [self.pickPoint[0] * widthScale - 1, (rc.canvas.height - self.pickPoint[1]) * heightScale - 1, 1, 1],
                [arrow2[0] * widthScale - 1, (rc.canvas.height - arrow2[1]) * heightScale - 1, 1, 1],
                [self.pickPoint[0] * widthScale - 1, (rc.canvas.height - self.pickPoint[1]) * heightScale - 1, 1, 1]
            ];

            ////calcul des points intermédiaires
            //var distance = 1;
            //var x = this.pickPoint[0], y = this.pickPoint[1];
            //while (x < this.secondPickPoint[0] && y < this.secondPickPoint[1]) {
            //    x += distance * diff[0];
            //    y += distance * diff[1];
            //    points.push([x * widthScale - 1, (rc.canvas.height - y) * heightScale - 1, 1, 1]);
            //}

            //ajout du dernier point
            points.push(
                [self.secondPickPoint[0] * widthScale - 1, (rc.canvas.height - self.secondPickPoint[1]) * heightScale - 1, 1, 1],
                [arrow3[0] * widthScale - 1, (rc.canvas.height - arrow3[1]) * heightScale - 1, 1, 1],
                [self.secondPickPoint[0] * widthScale - 1, (rc.canvas.height - self.secondPickPoint[1]) * heightScale - 1, 1, 1],
                [arrow4[0] * widthScale - 1, (rc.canvas.height - arrow4[1]) * heightScale - 1, 1, 1]
            );
            self.computeIntersection(points);
            return points;
        }

        /**********************************************************************************************/

        /**
         *    Updates measure coordinates
         */
        function updateMeasure() {
            self.clear();

            var coordinates = self.computeMeasure();


            self.measureFeature = {
                "geometry": {
                    "gid": "measureShape",
                    "coordinates": coordinates,
                    "type": "LineString"
                },
                "properties": {
                    "style": new FeatureStyle({
                        //zIndex: 2,
                        fillColor: [1, 0, 0, 1]
                    })
                },
                "type": "Feature"
            };

            var center = [(self.secondPickPoint[0] + self.pickPoint[0]) / 2, (self.secondPickPoint[1] + self.pickPoint[1]) / 2];
            var ray = Ray.createFromPixel(self.renderContext, center[0], center[1]);
            var center3d = ray.computePoint(ray.sphereIntersect([0, 0, 0], context.planet.coordinateSystem.geoide.radius));

            var geoCenter = context.planet.coordinateSystem.from3DToGeo(center3d);

            var distance = self.calculateDistanceElevation(self.geoPickPoint, self.secondGeoPickPoint);
            distance = UtilsCore.roundNumber(distance.toFixed(3), 2);

            self.measureLabel = {
                geometry: {
                    type: "Point",
                    gid: "measureShape",
                    coordinates: geoCenter
                },
                properties: {
                    style: new FeatureStyle({
                        //label: context.planet.coordinateSystem.fromDegreesToDMS(self.geoDistance),
                        //label: context.planet.coordinateSystem.from3DToGeo(geoCenter),
                        label: distance + " km",
                        fillColor: [1, 1, 1, 1],
                        //zIndex: 10000,
                        extrusionScale: -1000
                    })
                }
            };

            measureLayer.addFeature(self.measureFeature);
            measureLayer.addFeature(self.measureLabel);
        }

        /**************************************************************************************************************/

        /**
         *    Clear measureFeature and measureLabel
         */
        function clear() {
            if (self.measureFeature) {
                measureLayer.removeFeature(self.measureFeature);
            }
            if (self.measureLabel) {
                measureLayer.removeFeature(self.measureLabel);
            }
        }

        /**************************************************************************************************************/

        /**
         * Calculate intermediaries elevation points to increase drawing precision
         *
         * @param {Object} options
         *              <ul>
         *                  <li>scale : number of intermediary points to compute</li>
         *              </ul>
         * @param {Array} firstPoint
         * @param {Array} secondPoint
         * @return {Array} intermediatePoints
         */
        function calculateIntermediateElevationPoint(options, firstPoint, secondPoint) {
            console.log("calculateIntermediateElevationPoint");
            var scale = options.scale | 50;
            var intervalX = (firstPoint[0] - secondPoint[0]) / scale;
            var intervalY = (firstPoint[1] - secondPoint[1]) / scale;

            var intermediatePoints = [];
            intermediatePoints[0] = firstPoint;
            for (var i = 1; i < scale; i++) {

                var x = (intermediatePoints[i - 1][0] - intervalX);
                var y = (intermediatePoints[i - 1][1] - intervalY);
                intermediatePoints[i] = [x, y];
            }
            intermediatePoints[scale] = secondPoint;
            return intermediatePoints;
        }

        /**
         * Calculate distance elevation from a point
         *
         * url calcul distance : http://www.movable-type.co.uk/scripts/latlong.html
         *
         * @param {Array} firstPoint
         * @param {Array} secondPoint
         * @returns {number} distance elevation in meters
         */
        function calculateDistanceElevation(firstPoint, secondPoint) {
            console.log("calculateDistanceElevation");
            var R = 3390000; // metres TODO Utiliser le système de ref de JC
            var φ1 = Numeric.toRadian(firstPoint[1]);
            var φ2 = Numeric.toRadian(secondPoint[1]);
            var Δφ = Numeric.toRadian(secondPoint[1] - firstPoint[1]);
            var Δλ = Numeric.toRadian(secondPoint[0] - firstPoint[0]);

            var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            var distance = R * c;

            return distance / 1000;

        }

        /**
         * Calculate distance and elevation for a given point and store it
         * @param {Array} firstPoint
         * @param {Array} secondPoint
         */
        function storeDistanceAndElevation(firstPoint, secondPoint) {
            var distance = self.calculateDistanceElevation(firstPoint, secondPoint);
            distance = UtilsCore.roundNumber(distance.toFixed(3), 2);

            var elevation = context.planet.getElevation(secondPoint[0], secondPoint[1]);
            elevation = UtilsCore.roundNumber(elevation / scale, 0)
            var pointElevation = [distance, elevation];

            self.elevations.push(pointElevation);
        }

        function updateContext(pContext) {
          context = pContext;
          scale = context.planetLayer.elevationLayer.scale;
          dragging = false;

          // Layer containing measure feature
          if (!measureLayer) {
            measureLayer = new VectorLayer();
          }
          context.planet.addLayer(measureLayer, context.planetLayer);

          this.activated = false;
          this.renderContext = context.planet.renderContext;

          //this.elevations = [];
          this.measureFeature = null;

        }

        return {
            init: function (options) {
                context = options.context;
                onselect = options.onselect;
                scale = context.planetLayer.elevationLayer.scale;
                self = this;
                dragging = false;

                // Layer containing measure feature
                measureLayer = new VectorLayer();
                context.planet.addLayer(measureLayer, context.planetLayer);

                this.activated = false;
                this.renderContext = context.planet.renderContext;

                this.mode = options.mode;

                // Measure attributes
                /*this.pickPoint; // Window pick point
                this.secondPickPoint; // Window second pick point
                this.geoPickPoint; // Pick point in geographic reference
                this.secondGeoPickPoint; // Pick point in geographic reference
                this.measureLabel;
                */
                this.elevations = [];
                this.measureFeature = null;
            },
            _handleMouseDown: _handleMouseDown,
            _handleMouseUp: _handleMouseUp,
            _handleMouseMove: _handleMouseMove,
            clear: clear,
            updateContext: updateContext,
            calculateIntermediateElevationPoint: calculateIntermediateElevationPoint,
            calculateDistanceElevation: calculateDistanceElevation,
            computeMeasure: computeMeasure,
            computeIntersection: computeIntersection,
            storeDistanceAndElevation : storeDistanceAndElevation
        };

    });
