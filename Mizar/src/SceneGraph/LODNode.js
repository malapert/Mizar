define(['../Renderer/BoundingBox'], function (BoundingBox) {

    /**************************************************************************************************************/

    /**
     *    @constructor LODNode
     */
    var LODNode = function () {
        this.modelPath = "";
        this.center = null;
        this.radius = 0.0;
        this.minRange = 0.0;

        this.geometries = [];
        this.children = [];

        this.loaded = false;
        this.loading = false;
        this.imagesToLoad = 0;
    };


    /**************************************************************************************************************/

    /**
     *    Unload the children.
     * Call by rendering method when there are not needed anymore
     */
    LODNode.prototype.unloadChildren = function (renderContext) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].dispose(renderContext);
        }
    };

    /**************************************************************************************************************/

    /**
     *    Dispose the node ressources
     */
    LODNode.prototype.dispose = function (renderContext) {
        if (this.loaded) {
            // Remove the geometries
            for (var i = 0; i < this.geometries.length; i++) {
                this.geometries[i].dispose(renderContext);
            }
            this.geometries.length = 0;

            // Unload the children
            this.unloadChildren(renderContext);

            this.loaded = false;
            this.imagesToLoad = 0;
        }
    };


    /**************************************************************************************************************/

    /**
     * Compute the BBox of a node
     */
    LODNode.prototype.computeBBox = function () {
        var i;
        this.bbox = new BoundingBox();

        for (i = 0; i < this.geometries.length; i++) {
            var bbox = new BoundingBox();
            bbox.compute(this.geometries[i].mesh.vertices);
            this.bbox.merge(bbox);
        }

        for (i = 0; i < this.children.length; i++) {
            this.bbox.merge(this.children[i].computeBBox());
        }

        if (this.matrix) {
            this.bbox.transform(this.matrix);
        }

        return this.bbox;
    };

    /**************************************************************************************************************/

    /**
     *    Intersect a node with a ray
     */
    LODNode.prototype.intersectWith = function (ray, intersects) {
        return ray.lodNodeIntersect(this, intersects);
    };

    /**************************************************************************************************************/

    /**
     *    Recursive method to render node
     */
    LODNode.prototype.render = function (renderer) {
        var i;
        if (renderer.renderContext.worldFrustum.containsSphere(this.center, this.radius) < 0) {
            // Remove not needed children
            this.unloadChildren(renderer.renderContext);
            return;
        }

        if (!this.loaded) {
            renderer.load(this);
        }
        else {
            var pixelSizeVector = renderer.renderContext.pixelSizeVector;
            var pixelSize = 0.25 * Math.abs(this.radius / ( this.center[0] * pixelSizeVector[0] + this.center[1] * pixelSizeVector[1] +
                    this.center[2] * pixelSizeVector[2] + pixelSizeVector[3] ));

            var allChildrenLoaded = true;
            if (pixelSize > this.minRange && this.children.length !== 0) {
                // Check children all loaded
                // Only render children when everything is loaded
                for (i = 0; i < this.children.length; i++) {
                    var c = this.children[i];
                    allChildrenLoaded &= c.loaded;
                    if (!c.loaded && !c.loading) {
                        renderer.nodesToLoad.push({
                            node: this.children[i],
                            pixelSize: pixelSize
                        });
                    }
                }

                // Ok all children are loaded so render them recursively
                if (allChildrenLoaded) {
                    for (i = 0; i < this.children.length; i++) {
                        renderer.renderNode(this.children[i]);
                    }
                }
            }

            // Remove not needed children
            if (pixelSize < this.minRange) {
                this.unloadChildren(renderer.renderContext);
            }

            if (pixelSize < this.minRange || !allChildrenLoaded || this.children.length === 0) {
                var rc = renderer.renderContext;
                var gl = rc.gl;

                gl.uniformMatrix4fv(renderer.program.uniforms.modelViewMatrix, false, renderer.matrixStack[renderer.matrixStack.length - 1]);

                for (i = 0; i < this.geometries.length; i++) {
                    var geom = this.geometries[i];
                    geom.material.bind(gl, renderer.program);
                    geom.mesh.render(gl, renderer.program);
                }

                renderer.numRendered++;
            }
        }
    };

    /**************************************************************************************************************/

    return LODNode;

});
