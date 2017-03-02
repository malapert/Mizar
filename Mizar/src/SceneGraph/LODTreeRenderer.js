define(['../Utils/Utils', './Renderer', './ColladaParser'], function (Utils, Renderer, ColladaParser) {

    /**************************************************************************************************************/

    /**
     *    @constructor SceneGraph Renderer
     */
    var LODTreeRenderer = function (renderContext, node) {
        Renderer.prototype.constructor.call(this, renderContext, node);

        this.freeRequests = [new XMLHttpRequest(), new XMLHttpRequest()];
        this.nodesToLoad = [];
        this.numRendered = 0;
    };

    /**************************************************************************************************************/

    Utils.inherits(Renderer, LODTreeRenderer);

    /**************************************************************************************************************/

    /**
     *    Main render
     */
    LODTreeRenderer.prototype.render = function () {
        this.numRendered = 0;

        Renderer.prototype.render.call(this);

        // Load the needed nodes
        this.nodesToLoad.sort(function (a, b) {
            return b.pixelSize - a.pixelSize;
        });
        for (var i = 0; i < this.nodesToLoad.length && this.freeRequests.length > 0; i++) {
            this.load(this.nodesToLoad[i].node);
        }
        this.nodesToLoad.length = 0;
    };

    /**************************************************************************************************************/

// Function to collect geometries from the COLLADA nodes
    var findGeometry = function (geometries, node) {
        var i;
        for (i = 0; i < node.geometries.length; i++) {
            geometries.push(node.geometries[i]);
        }

        for (i = 0; i < node.children.length; i++) {
            findGeometry(geometries, node.children[i]);
        }
    };

    /**************************************************************************************************************/

    /**
     * Internal function call when an image is loaded
     */
    var onImageLoad = function (node) {
        node.imagesToLoad--;
        if (node.imagesToLoad === 0) {
            node.loading = false;
            node.loaded = true;
        }
    };


    /**************************************************************************************************************/

    /**
     * Load the images of a node.
     * A node is considered as loaded when all its images are loaded to avoid flickering
     */
    LODTreeRenderer.prototype.loadImages = function (node) {
        node.imagesToLoad = node.geometries.length;
        for (var i = 0; i < node.geometries.length; i++) {
            var image = node.geometries[i].material.texture.image;
            if (image.complete) {
                onImageLoad(node);
            }
            else {
                image.onload = function () {
                    onImageLoad(node);
                };
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Internal function to merge geometries with the same texture
     */
    var optimizeGeometries = function (geoms) {
        for (var i = 0; i < geoms.length; i++) {
            var mat = geoms[i].material;
            var mesh = geoms[i].mesh;

            var j = i + 1;
            while (j < geoms.length) {
                if (geoms[j].material === mat) {
                    mesh.merge(geoms[j].mesh);
                    geoms.splice(j, 1);
                }
                else {
                    j++;
                }
            }
        }
    };


    /**************************************************************************************************************/

    /**
     * Load a LOD node
     */
    LODTreeRenderer.prototype.load = function (node) {
        if (node.loading || node.loaded) {
            return;
        }

        var self = this;
        var xhr = this.freeRequests.pop();
        if (xhr) {
            xhr.onreadystatechange = function (e) {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    //console.log("Load " + node.modelPath);
                    var root = ColladaParser.parse(xhr.responseXML);

                    findGeometry(node.geometries, root);

                    optimizeGeometries(node.geometries);

                    self.loadImages(node);

                    self.freeRequests.push(xhr);
                }
            };

            node.loading = true;
            xhr.open("GET", node.modelPath);
            xhr.overrideMimeType('text/xml');
            xhr.send();
        }
    };

    /**************************************************************************************************************/

    /**
     Display some render statistics
     @private
     */
    LODTreeRenderer.prototype.getRenderStats = function () {
        return "# rendered nodes : " + this.numRendered;
    };

    /**************************************************************************************************************/

    return LODTreeRenderer;

});
