define([],
    function () {

        /**************************************************************************************************************/

        var center, cosrad;

        var CircleFinder = function (point) {

            //CircleFinder.prototype.constructor.call(this, point);

            np = point.length;
            //HealpixUtils.check(np >= 3, "too few points");

            center = vec3.add2(point[0], point[1]);
            center = vec3.normalize2(center);
            cosrad = vec3.dot2(point[0], center);
            for (i = 2; i < np; ++i) {
                if (vec3.dot2(point[i], center) < cosrad) {
                    // point outside the current circle
                    this.getCircle(point, i);
                }
            }
        };

        /**************************************************************************************************************/

        CircleFinder.prototype.getCircle = function (point, q1, q2) {
            center = vec3.add2(point[q1], point[q2]);
            center = vec3.normalize2(center);
            cosrad = vec3.dot2(point[q1],center);
            for (i = 0; i < q1; ++i) {
                if (vec3.dot2(point[i], center) < cosrad) // point outside the current circle
                {
                    var subPoint = vec3.subtract2(point[q1], point[i]);
                    var subPoint2 = vec3.subtract2(point[q2], point[i]);
                    center = vec3.cross2(subPoint, subPoint2);
                    center = vec3.normalize2(center);
                    cosrad = vec3.dot2(point[q1],center);
                    if (cosrad < 0) {
                        center = vec3.flip(center);
                        cosrad = -cosrad;
                    }
                }
            }
        };

        /**************************************************************************************************************/

        CircleFinder.prototype.getCircle = function (point, q) {
            center = vec3.add2(point[0], point[q]);
            center = vec3.normalize2(center);
            cosrad = vec3.dot2(point[0], center);
            for (i = 1; i < q; ++i) {
                if (vec3.dot2(point[i], center) < cosrad) {
                    // point outside the current circle
                    this.getCircle(point, i, q);
                }
            }
        };

        /**************************************************************************************************************/

        CircleFinder.prototype.getCenter = function () {
            return center;
        };

        CircleFinder.prototype.getCosRad = function () {
            return cosrad;
        };

        return CircleFinder;

    });
