define(['../Utils/Utils', './BaseNavigation', '../Animation/SegmentedAnimation', '../Utils/Numeric', '../Renderer/glMatrix'], function (Utils, BaseNavigation, SegmentedAnimation, Numeric) {
  /**
   @name Navigation
   @augments BaseNavigation
   @class
        Manages the navigation in the Planet.
        @param {Planet} planet Planet
        @param {JSON} options Configuration properties for the Navigation :
        <ul>
        <li>minDistance : The minimum distance</li>
        <li>maxDistance : The maximum distance</li>
        <li>updateViewMatrix : Boolean indicating if view matrix must be updated on initialization</li>
        </ul>
   */
    var Navigation = function (planet, options) {
        BaseNavigation.prototype.constructor.call(this, planet.renderContext, options);

        this.type = "PlanetNavigation";
        this.planet = planet;

        // Default values for min and max distance (in meter)
        this.minDistance = (options && options.minDistance) || 1.0;
        this.maxDistance = (options && options.maxDistance) || 3.0 * this.planet.coordinateSystem.geoide.realPlanetRadius;

        // Initialize the navigation
        this.geoCenter = [0.0, 0.0, 0.0];
        this.heading = 0.0;
        this.tilt = 90.0;
        this.distance = 3.0 * this.planet.coordinateSystem.geoide.radius;

        // Scale min and max distance from meter to internal ratio
        this.minDistance *= this.planet.coordinateSystem.geoide.heightScale;
        this.maxDistance *= this.planet.coordinateSystem.geoide.heightScale;

        this.inverseViewMatrix = mat4.create();

        var updateViewMatrix = (options && options.hasOwnProperty('updateViewMatrix') ? options.updateViewMatrix : true);
        // Update the view matrix if needed(true by default)
        if (updateViewMatrix) {
            this.computeViewMatrix();
        }
    };

    /**************************************************************************************************************/

    Utils.inherits(BaseNavigation, Navigation);

    /**************************************************************************************************************/

     /**
      * Save the current navigation state.
      * @function save
      * @memberof Navigation.prototype
      * @return {JSON} a JS object containing the navigation state
      */
    Navigation.prototype.save = function () {
        return {
            geoCenter: this.geoCenter,
            heading: this.heading,
            tilt: this.tilt,
            distance: this.distance
        };
    };

    /**************************************************************************************************************/

     /**
      * Restore the navigation state.
      * @function save
      * @memberof Navigation.prototype
      * @param {JSON} state a JS object containing the navigation state
      */
    Navigation.prototype.restore = function (state) {
        this.geoCenter = state.geoCenter;
        this.heading = state.heading;
        this.tilt = state.tilt;
        this.distance = state.distance;
        this.computeViewMatrix();
    };

    /**************************************************************************************************************/
    /**
     * Zoom to a geographic position
     * @function zoomTo
     * @memberof Navigation.prototype
     * @param {Float[]} geoPos Array of two floats corresponding to final Longitude and Latitude(in this order) to zoom
     * @param {Int} distance Final zooming distance in meters
     * @param {Int} duration Duration of animation in milliseconds
     * @param {Int} tilt Defines the tilt in the end of animation
     * @param {Function} callback Callback on the end of animation
     */
    Navigation.prototype.zoomTo = function (geoPos, distance, duration, tilt, callback) {
        var navigation = this;

        var destDistance = distance || this.distance / (4.0 * this.planet.coordinateSystem.geoide.heightScale);
        duration = duration || 5000;
        var destTilt = tilt || 90;

        // Create a single animation to animate geoCenter, distance and tilt
        var startValue = [this.geoCenter[0], this.geoCenter[1], this.distance, this.tilt];
        var endValue = [geoPos[0], geoPos[1], destDistance * this.planet.coordinateSystem.geoide.heightScale, destTilt];
        this.zoomToAnimation = new SegmentedAnimation(
          {
           "duration":duration,
           "valueSetter":
                function (value) {
                    navigation.geoCenter[0] = value[0];
                    navigation.geoCenter[1] = value[1];
                    navigation.distance = value[2];
                    navigation.tilt = value[3];
                    navigation.computeViewMatrix();
                }
          });

        // Compute a max altitude for the animation
        var worldStart = this.planet.coordinateSystem.fromGeoTo3D(this.geoCenter);
        var worldEnd = this.planet.coordinateSystem.fromGeoTo3D(geoPos);
        var vec = vec3.subtract(worldStart, worldEnd);
        var len = vec3.length(vec);
        var canvas = this.planet.renderContext.canvas;
        var minFov = Math.min(Numeric.toRadian(45.0),
            Numeric.toRadian(45.0 * canvas.width / canvas.height));
        var maxAltitude = 1.1 * ((len / 2.0) / Math.tan(minFov / 2.0));
        if (maxAltitude > this.distance) {
            // Compute the middle value
            var midValue = [startValue[0] * 0.5 + endValue[0] * 0.5,
                startValue[1] * 0.5 + endValue[1] * 0.5,
                maxAltitude, destTilt];

            // Add two segments
            this.zoomToAnimation.addSegment(
                0.0, startValue,
                0.5, midValue,
                function (t, a, b) {
                    var pt = Numeric.easeInQuad(t);
                    var dt = Numeric.easeOutQuad(t);
                    return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                        Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                        Numeric.lerp(dt, a[2], b[2]), // distance
                        Numeric.lerp(t, a[3], b[3])]; // tilt
                });

            this.zoomToAnimation.addSegment(
                0.5, midValue,
                1.0, endValue,
                function (t, a, b) {
                    var pt = Numeric.easeOutQuad(t);
                    var dt = Numeric.easeInQuad(t);
                    return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                        Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                        Numeric.lerp(dt, a[2], b[2]), // distance
                        Numeric.lerp(t, a[3], b[3])]; // tilt
                });
        }
        else {
            // Add only one segments
            this.zoomToAnimation.addSegment(
                0.0, startValue,
                1.0, endValue,
                function (t, a, b) {
                    var pt = Numeric.easeOutQuad(t);
                    var dt = Numeric.easeInQuad(t);
                    return [Numeric.lerp(pt, a[0], b[0]),  // geoPos.long
                        Numeric.lerp(pt, a[1], b[1]),  // geoPos.lat
                        Numeric.lerp(dt, a[2], b[2]),  // distance
                        Numeric.lerp(t, a[3], b[3])]; // tilt
                });
        }

        var self = this;
        this.zoomToAnimation.onstop = function () {
            if (callback) {
                callback();
            }
            self.zoomToAnimation = null;
        };

        this.planet.addAnimation(this.zoomToAnimation);
        this.zoomToAnimation.start();
    };

    /**************************************************************************************************************/

     /**
      * Compute the inverse view matrix
      * @function applyLocalRotation
      * @memberof Navigation.prototype
      */
    Navigation.prototype.applyLocalRotation = function (matrix) {
        mat4.rotate(matrix, (this.heading) * Math.PI / 180.0, [0.0, 0.0, 1.0]);
        mat4.rotate(matrix, (90 - this.tilt) * Math.PI / 180.0, [1.0, 0.0, 0.0]);
    };

    /**************************************************************************************************************/

    /**
     * Compute the view matrix
     * @function computeViewMatrix
     * @memberof Navigation.prototype
     */
    Navigation.prototype.computeViewMatrix = function () {
        this.computeInverseViewMatrix();
        mat4.inverse(this.inverseViewMatrix, this.renderContext.viewMatrix);
        this.publish("modified");
        this.renderContext.requestFrame();
    };

    /**************************************************************************************************************/

     /**
      * Compute the inverse view matrix
      * @function computeInverseViewMatrix
      * @memberof Navigation.prototype
      */
    Navigation.prototype.computeInverseViewMatrix = function () {
        this.planet.coordinateSystem.getLHVTransform(this.geoCenter, this.inverseViewMatrix);
        this.applyLocalRotation(this.inverseViewMatrix);
        mat4.translate(this.inverseViewMatrix, [0.0, 0.0, this.distance]);
    };

    /**************************************************************************************************************/

     /**
      * Zoom to the current observed location
      * @function zoom
      * @memberof Navigation.prototype
      * @param {Float} delta Delta zoom
      * @param {Float} scale Scale
      */
    Navigation.prototype.zoom = function (delta, scale) {
        var previousDistance = this.distance;

        // TODO : improve zoom, using scale or delta ? We should use scale always
        if (scale) {
            this.distance *= scale;
        } else {
            this.distance *= (1 + delta * 0.1);
        }

        if (this.distance > this.maxDistance) {
            this.distance = this.maxDistance;
        }
        if (this.distance < this.minDistance) {
            this.distance = this.minDistance;
        }

        this.computeViewMatrix();

        if (this.hasCollision()) {
            this.distance = previousDistance;
            this.computeViewMatrix();
        }
    };

    /**************************************************************************************************************/

     /**
      * Check for collision
      * @function hasCollision
      * @memberof Navigation.prototype
      * @return {Boolean} collision detected ?
      */
    Navigation.prototype.hasCollision = function () {
        var eye = [this.inverseViewMatrix[12], this.inverseViewMatrix[13], this.inverseViewMatrix[14]];
        var geoEye = vec3.create();
        this.planet.coordinateSystem.from3DToGeo(eye, geoEye);
        var elevation = this.planet.getElevation(geoEye[0], geoEye[1]);

        return geoEye[2] < elevation + 50;
    };

    /**************************************************************************************************************/
    /**
     * Pan the navigation
     * @function pan
     * @memberof Navigation.prototype
     * @param {Int} dx Window delta x
     * @param {Int} dy Window delta y
     */
    Navigation.prototype.pan = function (dx, dy) {
        var previousGeoCenter = vec3.create();
        vec3.set(this.geoCenter, previousGeoCenter);

        // Get geographic frame
        var local2World = mat4.create();
        var coordinateSystem = this.planet.coordinateSystem;
        coordinateSystem.getLocalTransform(this.geoCenter, local2World);
        // Then corresponding vertical axis and north
        var z = vec3.create();
        var previousNorth = vec3.create([0.0, 1.0, 0.0]);
        coordinateSystem.getUpVector(local2World, z);
        //coordinateSystem.getFrontVector( local2World, previousNorth );
        mat4.multiplyVec3(local2World, previousNorth, previousNorth);

        // Then apply local transform
        this.applyLocalRotation(local2World);
        // Retrieve corresponding axes
        var x = vec3.create();
        var y = vec3.create();
        coordinateSystem.getSideVector(local2World, x);
        coordinateSystem.getFrontVector(local2World, y);
        // According to our local configuration, up is y and side is x

        // Compute direction axes
        vec3.cross(z, x, y);
        vec3.cross(y, z, x);
        vec3.normalize(x, x);
        vec3.normalize(y, y);

        //Normalize dx and dy
        dx = dx / this.renderContext.canvas.width;
        dy = dy / this.renderContext.canvas.height;

        // Move accordingly
        var position = vec3.create();
        coordinateSystem.fromGeoTo3D(this.geoCenter, position);
        vec3.scale(x, dx * this.distance, x);
        vec3.scale(y, dy * this.distance, y);
        vec3.subtract(position, x, position);
        vec3.add(position, y, position);

        // Clamp onto sphere
        vec3.normalize(position);
        vec3.scale(position, coordinateSystem.geoide.radius);

        // Update geographic center
        coordinateSystem.from3DToGeo(position, this.geoCenter);

        // Compute new north axis
        var newNorth = vec3.create([0.0, 1.0, 0.0]);
        coordinateSystem.getLocalTransform(this.geoCenter, local2World);
        mat4.multiplyVec3(local2World, newNorth, newNorth);

        // Take care if we traverse the pole, ie the north is inverted
        if (vec3.dot(previousNorth, newNorth) < 0) {
            this.heading = (this.heading + 180.0) % 360.0;
        }

        // Check for collision with terrain
        this.computeViewMatrix();

        if (this.hasCollision()) {
            this.geoCenter = previousGeoCenter;
            this.computeViewMatrix();
        }
    };

    /**************************************************************************************************************/

    /**
     * Rotate the navigation
     * @function rotate
     * @memberof Navigation.prototype
     * @param {Int} dx Window delta x
     * @param {Int} dy Window delta y
     */
    Navigation.prototype.rotate = function (dx, dy) {
        var previousHeading = this.heading;
        var previousTilt = this.tilt;

        this.heading += dx * 0.1;
        this.tilt += dy * 0.1;

        this.computeViewMatrix();

        if (this.hasCollision()) {
            this.heading = previousHeading;
            this.tilt = previousTilt;
            this.computeViewMatrix();
        }
    };

    /**************************************************************************************************************/

    return Navigation;

});
