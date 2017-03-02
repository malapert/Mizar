define(['../Utils/Utils', '../Utils/Event', '../Navigation/MouseNavigationHandler', '../Navigation/KeyboardNavigationHandler', '../Navigation/TouchNavigationHandler', '../Animation/InertiaAnimation', '../Animation/SegmentedAnimation', '../Utils/Numeric', '../Renderer/glMatrix'],
    function (Utils, Event, MouseNavigationHandler, KeyboardNavigationHandler, TouchNavigationHandler, InertiaAnimation, SegmentedAnimation, Numeric) {
    /**
     @name BaseNavigation
     @class
          Base class for navigation object
     @constructor
     @augments Event
     @param {RenderContext} renderContext Render context
     @param {JSON} options Configuration properties for the Base Navigation :
     <ul>
     <li>handlers : Array of objects defining navigation events for different supports(mouse, keyboard..)</li>
     <li>inertia : Boolean for inertia effect</li>
     <li>panFactor : Pan factor</li>
     <li>rotateFactor : Rotate factor</li>
     <li>zoomFactor : Zoom factor</li>
     <li>isMobile : Boolean indicating if navigation supports touch events</li>
     </ul>
     */
     var BaseNavigation = function (renderContext, options) {
            Event.prototype.constructor.call(this);
            this.renderContext = renderContext;

            // Create default handlers if none are created in options
            if (options && options.handlers) {
                this.handlers = options.handlers;
            }
            else {
                // Use mouse & keyboard as default handlerrs
				          this.handlers = [new MouseNavigationHandler(options ? options.mouse : null), new KeyboardNavigationHandler(options ? options.keyboard : null)];

                if (options && options.isMobile) {
                    this.handlers.push(new TouchNavigationHandler(options ? options.touch : null));
                }

            }

            // Inertia effect
            if (options && options.inertia) {
                options.nav = this;
                this.inertia = new InertiaAnimation(options);
            }
            // ZoomTo animation
            this.zoomToAnimation = null;

            // Automatically start
            this.start();
        };

        /**************************************************************************************************************/

        Utils.inherits(Event, BaseNavigation);

        /**************************************************************************************************************/

         /**
          * Start the navigation
          * @function start
          * @memberof BaseNavigation.prototype
          */
        BaseNavigation.prototype.start = function () {
            // Install handlers
            for (var i = 0; i < this.handlers.length; i++) {
                this.handlers[i].install(this);
            }
        };

        /**************************************************************************************************************/

        /**
         * Stop the navigation
         * @function stop
         * @memberof BaseNavigation.prototype
         */
        BaseNavigation.prototype.stop = function () {
            // Uninstall handlers
            for (var i = 0; i < this.handlers.length; i++) {
                this.handlers[i].uninstall();
            }
        };

        /**************************************************************************************************************/

         /**
          * Stop the animations running on the navigation
          * @function stopAnimations
          * @memberof BaseNavigation.prototype
          */
        BaseNavigation.prototype.stopAnimations = function () {
            if (this.inertia) {
                this.inertia.stop();
            }
            if (this.zoomToAnimation) {
                this.zoomToAnimation.stop();
                this.zoomToAnimation = null;
            }
        };

        /**************************************************************************************************************/
         /**
          * Get the field of view used by the navigation
          * @function getFov
          * @memberof BaseNavigation.prototype
          * @return {Float[]} Fovx and fovy in degrees
          */
        BaseNavigation.prototype.getFov = function () {
            var aspect = this.renderContext.canvas.width / this.renderContext.canvas.height;
            return [aspect * this.renderContext.fov, this.renderContext.fov];
        };

        /**************************************************************************************************************/

         /**
          * Basic animation from current view matrix to the given one
          * @function toViewMatrix
          * @memberof BaseNavigation.prototype
          * @param {Object[]} mat Destination view matrix (array of 16)
          * @param {Int} fov Final zooming fov in degrees
          * @param {Int} duration Duration of animation in milliseconds
          * @param {Function} callback Callback on the end of animation
        */
        BaseNavigation.prototype.toViewMatrix = function (mat, fov, duration, callback) {
            var navigation = this;
            var vm = this.renderContext.viewMatrix;

            var srcViewMatrix = mat4.toMat3(vm);
            var srcQuat = quat4.fromRotationMatrix(srcViewMatrix);
            var destViewMatrix = mat4.toMat3(mat);
            var destQuat = quat4.fromRotationMatrix(destViewMatrix);
            var destFov = fov || 45;
            duration = duration || 1000;

            // Animate rotation matrix(with quaternion support), tranlation and fov
            var startValue = [srcQuat, [vm[12], vm[13], vm[14]], navigation.renderContext.fov];
            var endValue = [destQuat, [mat[12], mat[13], mat[14]], destFov];
            var animation = new SegmentedAnimation(
              {
               "duration":duration,
               "valueSetter":
                  function (value) {
                    // Update rotation matrix
                    var newRotationMatrix = quat4.toMat4(value[0]);
                    // Need to transpose the new rotation matrix due to bug in glMatrix
                    navigation.renderContext.viewMatrix = mat4.transpose(newRotationMatrix);

                    // Update translation
                    navigation.renderContext.viewMatrix[12] = value[1][0];
                    navigation.renderContext.viewMatrix[13] = value[1][1];
                    navigation.renderContext.viewMatrix[14] = value[1][2];

                    // Update fov
                    navigation.renderContext.fov = value[2];

                    navigation.renderContext.requestFrame();
                  }
              });

            // Add segment
            animation.addSegment(
                0.0, startValue,
                1.0, endValue,
                function (t, a, b) {
                    var pt = Numeric.easeOutQuad(t);
                    var resQuat = quat4.create();
                    quat4.slerp(a[0], b[0], pt, resQuat);

                    var resTranslate = vec3.create();
                    vec3.lerp(a[1], b[1], pt, resTranslate);

                    var resFov = Numeric.lerp(pt, a[2], b[2]);
                    return [resQuat,		// quaternions
                        resTranslate,	// translate
                        resFov]; 		// fov
                }
            );

            animation.onstop = function () {
                if (callback) {
                    callback();
                }
            };
            if (this.planet) {
              this.planet.addAnimation(animation);
            } else if (this.sky) {
              this.sky.addAnimation(animation);
            }
            animation.start();
        };

        /**************************************************************************************************************/

        return BaseNavigation;

    });
