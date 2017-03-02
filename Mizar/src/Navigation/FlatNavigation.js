define(['../Utils/Utils', '../Utils/Constants', './BaseNavigation', '../Animation/SegmentedAnimation', '../Utils/Numeric', '../Renderer/Ray', '../Renderer/glMatrix'],
    function (Utils, Constants,BaseNavigation, SegmentedAnimation, Numeric, Ray) {
        /**
         @name FlatNavigation
         @class
             Manages the navigation in the planet in flat mode.
         @augments BaseNavigation

         @param {Planet} planet Planet
         @param {JSON} options Configuration properties for the FlatNavigation :
         <ul>
         <li>minDistance : The minimum distance</li>
         <li>maxDistance : The maximum distance</li>
         </ul>
         */
        var FlatNavigation = function (planet, options) {

            BaseNavigation.prototype.constructor.call(this, planet.renderContext, options);

            this.type = "FlatNavigation";
            this.planet = planet;

            // Default values for min and max distance (in meter)
            this.minDistance = (options && options.minDistance) || 0.01;
            this.maxDistance = (options && options.maxDistance) || 7.0;

            // Initialize the navigation
            this.center = [0.0, 0.0, 0.0];
            this.distance = 7.0 * this.planet.coordinateSystem.geoide.radius;
            this.up = [0.0, 1.0, 0.0];

            this.computeViewMatrix();

        };

        /**************************************************************************************************************/

        Utils.inherits(BaseNavigation, FlatNavigation);

        /**************************************************************************************************************/

         /**
          * Save the current navigation state.
          * @function save
          * @memberof FlatNavigation.prototype
          * @return {JSON} a JS object containing the navigation state
          */
        FlatNavigation.prototype.save = function () {
            return {
                center: this.center,
                distance: this.distance,
                up: this.up
            };
        };

        /**************************************************************************************************************/

        /**
         * Restore the navigation state.
         * @function save
         * @memberof FlatNavigation.prototype
         * @param {JSON} state a JS object containing the navigation state
         */
         FlatNavigation.prototype.restore = function (state) {
            this.center = state.center;
            this.distance = state.distance;
            this.up = state.up;
            this.computeViewMatrix();
        };

        /**************************************************************************************************************/

        /**
         * Compute the view matrix
         * @function computeViewMatrix
         * @memberof FlatNavigation.prototype
         */
         FlatNavigation.prototype.computeViewMatrix = function () {
            var eye = [];
            //vec3.normalize(this.geoCenter);
            var vm = this.renderContext.viewMatrix;

			      eye = [this.center[0], this.center[1], this.distance];

            mat4.lookAt(eye, this.center, this.up, vm);
            this.up = [vm[1], vm[5], vm[9]];
            this.publish("modified");
            this.renderContext.requestFrame();
        };

        /**************************************************************************************************************/

		 /**
		  * Zoom to a geographic position
		  * @function zoomTo
		  * @memberof FlatNavigation.prototype
		  * @param {Float[]} geoPos Array of two floats corresponding to final Longitude and Latitude(in this order) to zoom
		  * @param {Int} distance Final zooming distance in meters
		  * @param {Int} duration Duration of animation in milliseconds
		  * @param {Function} callback Callback on the end of animation
		  */
        FlatNavigation.prototype.zoomTo = function (geoPos, distance, duration, callback) {
		   var navigation = this;

			var destDistance = distance || this.distance / (4.0 * this.planet.coordinateSystem.geoide.heightScale);
			duration = duration || 5000;

			var pos = this.planet.coordinateSystem.fromGeoTo3D(geoPos);

			// Create a single animation to animate geoCenter, distance and tilt
			var startValue = [this.center[0], this.center[1], this.distance];
			var endValue = [pos[0], pos[1], destDistance * this.planet.coordinateSystem.geoide.heightScale];
			this.zoomToAnimation = new SegmentedAnimation(
        {
         "duration":duration,
         "valueSetter":
         				function (value) {
        					navigation.center[0] = value[0];
        					navigation.center[1] = value[1];
        					navigation.distance = value[2];
        					navigation.computeViewMatrix();
        				}
        });

			// Compute a max altitude for the animation
			var worldStart = this.center;
			var worldEnd = pos;
			var vec = vec3.subtract(worldStart, worldEnd);
			var len = vec3.length(vec);
			var canvas = this.planet.renderContext.canvas;
			var minFov = Math.min(Numeric.toRadian(45.0), Numeric.toRadian(45.0 * canvas.width / canvas.height));
			var maxAltitude = 1.1 * ((len / 2.0) / Math.tan(minFov / 2.0));
			if (maxAltitude > this.distance) {
				// Compute the middle value
				var midValue = [startValue[0] * 0.5 + endValue[0] * 0.5,
					startValue[1] * 0.5 + endValue[1] * 0.5,
					maxAltitude];

				// Add two segments
				this.zoomToAnimation.addSegment(
					0.0, startValue,
					0.5, midValue,
					function (t, a, b) {
						var pt = Numeric.easeInQuad(t);
						var dt = Numeric.easeOutQuad(t);
						return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
							Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
							Numeric.lerp(dt, a[2], b[2])]; // distance
					});

				this.zoomToAnimation.addSegment(
					0.5, midValue,
					1.0, endValue,
					function (t, a, b) {
						var pt = Numeric.easeOutQuad(t);
						var dt = Numeric.easeInQuad(t);
						return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
							Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
							Numeric.lerp(dt, a[2], b[2])]; // distance
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
							Numeric.lerp(dt, a[2], b[2])];  // distance
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
          * Zoom to the current observed location
          * @function zoom
          * @memberof FlatNavigation.prototype
          * @param {Float} delta Delta zoom
          * @param {Float} scale Scale
          */
        FlatNavigation.prototype.zoom = function (delta, scale) {
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
        };

        /**************************************************************************************************************/
        /**
         * Pan the navigation
         * @function pan
         * @memberof FlatNavigation.prototype
         * @param {Int} dx Window delta x
         * @param {Int} dy Window delta y
         */
        FlatNavigation.prototype.pan = function (dx, dy) {
            var x = this.renderContext.canvas.width / 2.0;
            var y = this.renderContext.canvas.height / 2.0;

            // Get the most-left point
            var ptLeft = this.planet.getLonLatFromPixel(0,y);
            if ((ptLeft === null) && (dx>0)) {
              dx = 0;
            }

            // Get the most-right point
            var ptRight = this.planet.getLonLatFromPixel(this.renderContext.canvas.width,y);
            if ((ptRight === null) && (dx<0)) {
              dx = 0;
            }

            // Get the most-top point
            var ptTop = this.planet.getLonLatFromPixel(x,0);
            if ((ptTop === null) && (dy>0)) {
              dy = 0;
            }

            // Get the most-bottom point
            var ptBottom = this.planet.getLonLatFromPixel(x,this.renderContext.canvas.height);
            if ((ptBottom === null) && (dy<0)) {
              dy = 0;
            }

            if ( (dx === 0) && (dy === 0) ) {
              return;
            }

            var ray = Ray.createFromPixel(this.renderContext, x - dx, y - dy);

            this.center = ray.computePoint(ray.planeIntersect([0, 0, 0], [0, 0, 1]));

            this.computeViewMatrix();
        };

        /**************************************************************************************************************/
        /**
         * Rotate the navigation
         * @function rotate
         * @memberof FlatNavigation.prototype
         * @param {Int} dx Window delta x
         * @param {Int} dy Window delta y
         */
        FlatNavigation.prototype.rotate = function (dx, dy) {
            // Constant tiny angle
            var angle = -dx * 0.1 * Math.PI / 180.0;

            var rot = quat4.fromAngleAxis(angle, [0,0,1]);
            quat4.multiplyVec3(rot, this.up);

            this.computeViewMatrix();
        };

        /**************************************************************************************************************/

        return FlatNavigation;

    });
