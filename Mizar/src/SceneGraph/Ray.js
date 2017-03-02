define(['../Renderer/Ray','../Utils/Utils'], function (RayParent,Utils) {

  var Ray = function (orig,dir) {
      RayParent.prototype.constructor.call(this,orig,dir);
  }

  Utils.inherits(RayParent, Ray);


    Ray.prototype.nodeIntersect = function (node, intersects) {
        var i;
        intersects = intersects || [];

        for (i = 0; i < node.children.length; i++) {
            node.children[i].intersectWith(this, intersects);
        }

        for (i = 0; i < node.geometries.length; i++) {
            this.geometryIntersect(node.geometries[i], intersects);
        }

        intersects.sort(function (a, b) {
            return a.t - b.t;
        });
        return intersects;
    };

    Ray.prototype.lodNodeIntersect = function (node, intersects) {
        var i;
        intersects = intersects || [];

        if (this.sphereIntersect(node.center, node.radius) >= 0) {
            if (node.children.length > 0 && node.childToLoad === 0) {
                for (i = 0; i < node.children.length; i++) {
                    this.lodNodeIntersect(node.children[i], intersects);
                }
            }
            else {
                for (i = 0; i < node.geometries.length; i++) {
                    this.geometryIntersect(node.geometries[i], intersects);
                }
            }
        }

        return intersects;
    };

    Ray.prototype.geometryIntersect = function (geometry, intersects) {
        var indices = geometry.mesh.indices;
        for (var i = 0; i < indices.length; i += 3) {
            var intersect = this.triangleIntersectOptimized(geometry.mesh.vertices, geometry.mesh.numElements * indices[i],
                geometry.mesh.numElements * indices[i + 1], geometry.mesh.numElements * indices[i + 2]);

            if (intersect) {
                intersect.geometry = geometry;
                intersects.push(intersect);
            }
        }
    };
    console.log(Ray);


    return Ray;

});
