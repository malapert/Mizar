define(['../Utils/Utils', './BaseNavigation', '../Animation/SegmentedAnimation', '../Utils/Numeric', '../Renderer/Ray', '../Renderer/glMatrix'], function (Utils, BaseNavigation, SegmentedAnimation, Numeric, Ray) {
   /**
    @name AstroNavigation
    @augments BaseNavigation
    @class
    AstroNavigation constructor
    @param {Sky} sky Sky
    @param options Configuration properties for the AstroNavigation :
    <ul>
    <li>minFov : The minimum field of view in degrees</li>
    <li>maxFov : The maximum field of view in degrees</li>
    </ul>
    @constructor
   */
    var AstroNavigation = function (sky,options) {
        BaseNavigation.prototype.constructor.call(this, sky.renderContext, options);

        this.sky = sky;

        // Default values for fov (in degrees)
        this.minFov = (options && options.minFov) || 0.001;
        this.maxFov = (options && options.maxFov) || 100;

        // Initialize the navigation
        this.center3d = [1.0, 0.0, 0.0];
        this.up = [0.0, 0.0, 1.0];

        if (options) {
            if (options.initTarget) {
                if ((this.sky) && (this.sky.coordinateSystem)) {
                  this.sky.coordinateSystem.fromGeoTo3D(options.initTarget, this.center3d);
                }
            }

            if (options.initFov) {
                this.renderContext.fov = options.initFov;
                this._clampFov();
            }

            if (options.up) {
                this.up = options.up;
            }
        }

        // Update the view matrix now
        this.computeViewMatrix();
    };

    /**************************************************************************************************************/

    Utils.inherits(BaseNavigation, AstroNavigation);

    /**************************************************************************************************************/

    /**
     * Zoom to a 3d position
     * @function zoomTo
     * @memberof AstroNavigation.prototype
     * @param {Float[]} geoPos Array of two floats corresponding to final Longitude and Latitude(in this order) to zoom
     * @param {Int} fov Final zooming fov in degrees
     * @param {Int} duration Duration of animation in milliseconds
     * @param {Function} callback Callback on the end of animation
     */
    AstroNavigation.prototype.zoomTo = function (geoPos, fov, duration, callback) {
        var navigation = this;

        // default values
        var destFov = fov || 2.0;
        duration = duration || 2000;

        // Create a single animation to animate center3d and fov
        var geoStart = [];
        var middleFov = 25.0;	// arbitrary middle fov value which determines if the animation needs two segments

        this.sky.coordinateSystem.from3DToGeo(this.center3d, geoStart);
        var startValue = [geoStart[0], geoStart[1], this.renderContext.fov];
        var endValue = [geoPos[0], geoPos[1], destFov];

        // Compute the shortest path if needed
        if (Math.abs(geoPos[0] - geoStart[0]) > 180.0) {
            if (geoStart[0] < geoPos[0]) {
                startValue[0] += 360;
            } else {
                endValue[0] += 360;
            }
        }
        var animation = new SegmentedAnimation(
            {
             "duration":duration,
             "valueSetter":
                function (value) {
                    var position3d = navigation.sky.coordinateSystem.fromGeoTo3D([value[0], value[1]]);
                    navigation.center3d[0] = position3d[0];
                    navigation.center3d[1] = position3d[1];
                    navigation.center3d[2] = position3d[2];
                    navigation.sky.renderContext.fov = value[2];
                    navigation.computeViewMatrix();
                  }
            });

        // TODO : maybe improve it ?
        // End point which is out of frustum invokes two steps animation, one step otherwise
        var end3DValue = this.sky.coordinateSystem.fromGeoTo3D(geoPos);
        if (middleFov > this.renderContext.fov && this.renderContext.worldFrustum.containsSphere(end3DValue, 0.005) < 0) {
            // Two steps animation, 'rising' & 'falling'

            // Compute the middle value
            var midValue = [startValue[0] * 0.5 + endValue[0] * 0.5,
                startValue[1] * 0.5 + endValue[1] * 0.5,
                middleFov];

            // Add two segments
            animation.addSegment(
                0.0, startValue,
                0.5, midValue,
                function (t, a, b) {
                    var pt = Numeric.easeInQuad(t);
                    var dt = Numeric.easeOutQuad(t);
                    return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                        Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                        Numeric.lerp(dt, a[2], b[2])]; // fov
                });

            animation.addSegment(
                0.5, midValue,
                1.0, endValue,
                function (t, a, b) {
                    var pt = Numeric.easeOutQuad(t);
                    var dt = Numeric.easeInQuad(t);
                    return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                        Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                        Numeric.lerp(dt, a[2], b[2])]; // fov
                });
        }
        else {
            // One step animation, 'falling' only

            // Add only one segment
            animation.addSegment(
                0.0, startValue,
                1.0, endValue,
                function (t, a, b) {
                    var pt = Numeric.easeOutQuad(t);
                    var dt = Numeric.easeInQuad(t);
                    return [Numeric.lerp(pt, a[0], b[0]),  // geoPos.long
                        Numeric.lerp(pt, a[1], b[1]),  // geoPos.lat
                        Numeric.lerp(dt, a[2], b[2])];  // fov
                });
        }

        animation.onstop = function () {
            if (callback) {
                callback();
            }
            navigation.zoomToAnimation = null;
        };

        this.sky.addAnimation(animation);
        animation.start();
        this.zoomToAnimation = animation;
    };

    /**************************************************************************************************************/

     /**
      * Move to a 3d position
      * @function moveTo
      * @memberof AstroNavigation.prototype
      * @param {Float[]} geoPos Array of two floats corresponding to final Longitude and Latitude(in this order) to zoom
      * @param {Int} duration Duration of animation in milliseconds
      * @param {Function} callback Callback on the end of animation
      */
    AstroNavigation.prototype.moveTo = function (geoPos, duration, callback) {
        var navigation = this;

        duration = duration || 5000;

        // Create a single animation to animate center3d
        var geoStart = [];
        this.sky.coordinateSystem.from3DToGeo(this.center3d, geoStart);

        var startValue = [geoStart[0], geoStart[1]];
        var endValue = [geoPos[0], geoPos[1]];

        // Compute the shortest path if needed
        if (Math.abs(geoPos[0] - geoStart[0]) > 180.0) {
            if (geoStart[0] < geoPos[0]) {
                startValue[0] += 360;
            } else {
                endValue[0] += 360;
            }
        }

        var animation = new SegmentedAnimation(
          {
           "duration":duration,
           "valueSetter":
                    function (value) {
                        var position3d = navigation.sky.coordinateSystem.fromGeoTo3D([value[0], value[1]]);
                        navigation.center3d[0] = position3d[0];
                        navigation.center3d[1] = position3d[1];
                        navigation.center3d[2] = position3d[2];
                        navigation.computeViewMatrix();
                    }
          });

        animation.addSegment(
            0.0, startValue,
            1.0, endValue,
            function (t, a, b) {
                var pt = Numeric.easeOutQuad(t);
                return [Numeric.lerp(pt, a[0], b[0]),  // geoPos.long
                    Numeric.lerp(pt, a[1], b[1])];  // geoPos.lat
            }
        );

        animation.onstop = function () {
            if (callback) {
                callback();
            }
        };

        this.sky.addAnimation(animation);
        animation.start();
    };

    /**************************************************************************************************************/

     /**
      * Move up vector
      * @function moveUpTo
      * @memberof AstroNavigation.prototype
      * @param {Float[]} vec Vector
      * @param {Int} duration Duration of animation in milliseconds
      */
    AstroNavigation.prototype.moveUpTo = function (vec, duration) {
        // Create a single animation to animate up
        var startValue = [];
        var endValue = [];
        this.sky.coordinateSystem.from3DToGeo(this.up, startValue);
        this.sky.coordinateSystem.from3DToGeo(vec, endValue);
        duration = duration || 1000;

        var navigation = this;
        var animation = new SegmentedAnimation(
          {
           "duration":duration,
           "valueSetter":
                       function (value) {
                            var position3d = navigation.sky.coordinateSystem.fromGeoTo3D([value[0], value[1]]);
                            navigation.up[0] = position3d[0];
                            navigation.up[1] = position3d[1];
                            navigation.up[2] = position3d[2];
                            navigation.computeViewMatrix();
                        }
          });

        animation.addSegment(
            0.0, startValue,
            1.0, endValue,
            function (t, a, b) {
                var pt = Numeric.easeOutQuad(t);
                return [Numeric.lerp(pt, a[0], b[0]),  // geoPos.long
                    Numeric.lerp(pt, a[1], b[1])];  // geoPos.lat
            }
        );

        this.sky.addAnimation(animation);
        animation.start();
    };

    /**************************************************************************************************************/
     /**
      * Compute the view matrix
      * @function computeViewMatrix
      * @memberof AstroNavigation.prototype
      */
    AstroNavigation.prototype.computeViewMatrix = function () {
        var eye = [];
        vec3.normalize(this.center3d);

        var vm = this.renderContext.viewMatrix;

        mat4.lookAt([0.0, 0.0, 0.0], this.center3d, this.up, vm);
        // mat4.inverse( vm );
        // mat4.rotate(vm, this.heading * Math.PI/180., [1., 0., 0.])
        // mat4.inverse( vm );

        this.up = [vm[1], vm[5], vm[9]];
        this.publish("modified");
        this.renderContext.requestFrame();
    };

    /**************************************************************************************************************/
    /**
     * Event handler for mouse wheel
     * @function zoom
     * @memberof AstroNavigation.prototype
     * @param {Int} delta Delta zoom
     * @param {Float} scale Scale
     */
    AstroNavigation.prototype.zoom = function (delta, scale) {

        // TODO : improve zoom, using scale or delta ? We should use scale always
        if (scale) {
            this.renderContext.fov *= 1 / scale;
        }
        else {
            // Arbitrary value for smooth zooming
            this.renderContext.fov *= (1 + delta * 0.1);
        }

        this._clampFov();
        this.computeViewMatrix();
    };

    /**************************************************************************************************************/
     /**
      * Pan the navigation by computing the difference between 3D centers
      * @function pan
      * @memberof AstroNavigation.prototype
      * @param {Int} dx Window delta x
      * @param {Int} dy Window delta y
      */
    AstroNavigation.prototype.pan = function (dx, dy) {
        var x = this.renderContext.canvas.width / 2.0;
        var y = this.renderContext.canvas.height / 2.0;
        var ray = Ray.createFromPixel(this.renderContext, x - dx, y - dy);
        this.center3d = ray.computePoint(ray.sphereIntersect([0, 0, 0], this.sky.coordinateSystem.geoide.radius));

        this.computeViewMatrix();
    };

    /**************************************************************************************************************/

     /**
      * Rotate the navigation
      * @function rotate
      * @memberof AstroNavigation.prototype
      * @param {Int} dx Window delta x
      * @param {Int} dy Window delta y
      */
    AstroNavigation.prototype.rotate = function (dx, dy) {
        // constant tiny angle
        var angle = dx * 0.1 * Math.PI / 180.0;

        var rot = quat4.fromAngleAxis(angle, this.center3d);
        quat4.multiplyVec3(rot, this.up);

        this.computeViewMatrix();
    };

    /**************************************************************************************************************/
     /**
      * Clamping of fov
      * @function _clampFov
      * @memberof AstroNavigation.prototype
      */
    AstroNavigation.prototype._clampFov = function () {
        if (this.renderContext.fov > this.maxFov) {
            this.renderContext.fov = this.maxFov;
        }
        if (this.renderContext.fov < this.minFov) {
            this.renderContext.fov = this.minFov;
        }
    };

    /**************************************************************************************************************/

    return AstroNavigation;

});
