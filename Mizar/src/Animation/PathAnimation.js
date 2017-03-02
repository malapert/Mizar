define(['../Utils/Utils', './Animation', '../Utils/Numeric'], function (Utils, Animation, Numeric) {
  /**
   *    @name PathAnimation
   *    @class
   *      PathAnimation is an animation defined with a path.
   *    @augments Animation
   *    @param options Configuration of the animation
   *            <ul>
   *                <li>coords : the path coordinates</li>
   *                <li>speed : the speed value </li>
   *                <li>setter : the function used to set the value</li>
   *                <li>planet : the planet to clamp path animations on the terrain</li>
   *            </ul>
   *    @constructor
   */
    var PathAnimation = function (options) {
        var i;
        var vec1,vec2;
        var dx,dy,dz;
        var node;
        var temp;

        // Call ancestor constructor
        Animation.prototype.constructor.call(this);
        this.planet = options.planet;
        this.speed = options.speed * this.planet.coordinateSystem.geoide.heightScale / 1000;
        this.nodes = [];
        for (i = 0; i < options.coords.length; i++) {
            node = {
                position: this.planet.coordinateSystem.fromGeoTo3D(options.coords[i]),
                velocity: null,
                distance: 0.0
            };
            this.nodes.push(node);
            if (i > 0) {
                dx = this.nodes[i].position[0] - this.nodes[i - 1].position[0];
                dy = this.nodes[i].position[1] - this.nodes[i - 1].position[1];
                dz = this.nodes[i].position[2] - this.nodes[i - 1].position[2];
                this.nodes[i - 1].distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            }
        }

        for (i = 1; i < options.coords.length - 1; i++) {
            vec1 = vec3.subtract(this.nodes[i + 1].position, this.nodes[i].position, vec3.create());
            vec2 = vec3.subtract(this.nodes[i - 1].position, this.nodes[i].position, vec3.create());
            vec3.normalize(vec1);
            vec3.normalize(vec2);
            this.nodes[i].velocity = vec3.subtract(vec1, vec2, vec3.create());
            vec3.normalize(this.nodes[i].velocity);
        }

        // Start velocity
        temp = vec3.subtract(this.nodes[1].position, this.nodes[0].position, vec3.create());
        vec3.scale(temp, ( 3 / this.nodes[0].distance ));
        this.nodes[0].velocity = vec3.subtract(temp, this.nodes[1].velocity, vec3.create());
        vec3.scale(this.nodes[0].velocity, 0.5);

        // End velocity
        i = options.coords.length - 1;
        temp = vec3.subtract(this.nodes[i].position, this.nodes[i - 1].position, vec3.create());
        vec3.scale(temp, ( 3 / this.nodes[i - 1].distance ));
        this.nodes[i].velocity = vec3.subtract(temp, this.nodes[i - 1].velocity, vec3.create());
        vec3.scale(this.nodes[i].velocity, 0.5);

        this.index = 0;
        this.currentDistance = 0;
        this.previousTime = -1;
        this.currentDirection = [];
        this.centerOffset = -0.2;
        this.altitudeOffset = 1000;

        var that = this;
        if (options.setter) {
            this.valueSetter = options.setter;
        }
        else {
            this.valueSetter = function (value, direction) {
                var up = vec3.normalize(value, vec3.create());

                var eye;
                if (options.planet) {
                    var geoEye = options.planet.coordinateSystem.from3DToGeo(value);
                    geoEye[2] = options.planet.getElevation(geoEye[0], geoEye[1]) + that.altitudeOffset;
                    eye = options.planet.coordinateSystem.fromGeoTo3D(geoEye);
                }
                else {
                    eye = value;
                    eye[2] += that.altitudeOffset;
                }

                var dirn = vec3.normalize(direction, vec3.create());
                var center = vec3.add(eye, dirn, vec3.create());
                vec3.add(center, vec3.scale(up, that.centerOffset, vec3.create()));
                mat4.lookAt(eye, center, up, that.renderContext.viewMatrix);
            };
        }
    };

    /**************************************************************************************************************/

    Utils.inherits(Animation, PathAnimation);

    /**************************************************************************************************************/

     /**
      Set the speed
      @function setSpeed
      @param {Float} val Speed
      @memberof PathAnimation.prototype
     */
    PathAnimation.prototype.setSpeed = function (val) {
        this.speed = parseFloat(val) * this.planet.coordinateSystem.geoide.heightScale / 1000;
    };

    /**
     Get the speed
     @function getSpeed
     @return {Float} Speed
     @memberof PathAnimation.prototype
    */
   PathAnimation.prototype.getSpeed = function () {
       return this.speed / (this.planet.coordinateSystem.geoide.heightScale / 1000) ;
   };

     /**
      Set the altitude offset
      @function setAltitudeOffset
      @param {Float} val Altitude offset
      @memberof PathAnimation.prototype
     */
    PathAnimation.prototype.setAltitudeOffset = function (val) {
        this.altitudeOffset = parseFloat(val);
    };

    /**
     Get the altitude offset
     @function getAltitudeOffset
     @return {Float} Altitude offset
     @memberof PathAnimation.prototype
    */
    PathAnimation.prototype.getAltitudeOffset = function () {
       return this.altitudeOffset;
     };

     /**
      Set the direction angle
      @function setDirectionAngle
      @param {Float} vertical Direction angle
      @memberof PathAnimation.prototype
     */
    PathAnimation.prototype.setDirectionAngle = function (vertical) {
        this.centerOffset = Math.tan(parseFloat(vertical) * Math.PI / 180.0);
    };

     /**
      Start the animation
      @function start
      @memberof PathAnimation.prototype
     */
    PathAnimation.prototype.start = function () {
        var previousStartTime = -1;
        if (this.pauseTime !== -1) {
            previousStartTime = this.startTime;
        }

        Animation.prototype.start.call(this);

        if (previousStartTime !== -1) {
            this.previousTime += this.startTime - previousStartTime;
        }
        else {
            this.previousTime = -1;
        }
    };

     /**
      Update the animation
      @function update
      @memberof PathAnimation.prototype
     */
    PathAnimation.prototype.update = function (now) {
        if (this.previousTime === -1) {
            this.index = 0;
            this.currentDistance = 0;
        }
        else {
            this.currentDistance += (now - this.previousTime) * this.speed;
        }
        this.previousTime = now;

        while (this.currentDistance >= this.nodes[this.index].distance && this.index < this.nodes.length - 1) {
            this.currentDistance -= this.nodes[this.index].distance;
            this.index = this.index + 1;
        }

        if (this.index < this.nodes.length - 1) {
            var t = this.currentDistance / this.nodes[this.index].distance;
            var startPos = this.nodes[this.index].position;
            var endPos = this.nodes[this.index + 1].position;
            var startVel = vec3.scale(this.nodes[this.index].velocity, this.nodes[this.index].distance, vec3.create());
            var endVel = vec3.scale(this.nodes[this.index + 1].velocity, this.nodes[this.index].distance, vec3.create());
            var position = Numeric.cubicInterpolation(t, startPos, startVel, endPos, endVel);
            var direction = Numeric.cubicInterpolationDerivative(t, startPos, startVel, endPos, endVel);
            this.valueSetter(position, direction);
        }
        else if (this.index === this.nodes.length - 1) {
            this.valueSetter(this.nodes[this.index].position, this.nodes[this.index].velocity);
        }
        else {
            this.stop();
        }
    };

    /**************************************************************************************************************/

    return PathAnimation;

});
