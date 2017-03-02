define(['../Utils/Utils', './BaseLayer', '../Renderer/Program', '../Tiling/Tile'],
    function (Utils, BaseLayer, Program, Tile) {

      /**
        @name TileWireframeLayer
        @class
        This layer draws an TileWireframe  layer
        @augments BaseLayer
        */
        var TileWireframeLayer = function (options) {
            BaseLayer.prototype.constructor.call(this, options);
            this.outline = (options && options.outline) ? options.outline : false;
            this.color = (options && options.color) ? options.color : [1.0, 1.0, 1.0];
            this.planet = null;
            this.program = null;
            this.indexBuffer = null;
            this.subIndexBuffer = [null, null, null, null];
            this.zIndex = -1;
        };

        /**************************************************************************************************************/

        Utils.inherits(BaseLayer, TileWireframeLayer);

        /**************************************************************************************************************/

        /**
         * Build the index buffer
         * @function buildIndexBuffer
         * @memberof TileWireframeLayer.prototype
         */
        TileWireframeLayer.prototype.buildIndexBuffer = function () {
            var gl = this.planet.renderContext.gl;
            var size = this.planet.tileManager.tileConfig.tesselation;
            var indices = [];
            var i,j,ii,n,k;
            var step = this.outline ? size - 1 : 1;
            var ib;

            // Build horizontal lines
            for (j = 0; j < size; j += step) {
                for (i = 0; i < size - 1; i++) {
                    indices.push(j * size + i);
                    indices.push(j * size + i + 1);
                }
            }

            // Build vertical lines
            for (j = 0; j < size; j += step) {
                for (i = 0; i < size - 1; i++) {
                    indices.push(i * size + j);
                    indices.push((i + 1) * size + j);
                }
            }


            ib = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

            ib.numIndices = indices.length;
            this.indexBuffer = ib;

            var halfTesselation = (size - 1) / 2;
            step = this.outline ? halfTesselation : 1;
            for (ii = 0; ii < 4; ii++) {
                i = ii % 2;
                j = Math.floor(ii / 2);

                // Build the sub grid for 'inside' tile
                indices = [];
                for (n = halfTesselation * j; n < halfTesselation * (j + 1) + 1; n += step) {
                    for (k = halfTesselation * i; k < halfTesselation * (i + 1); k++) {
                        indices.push(n * size + k);
                        indices.push(n * size + k + 1);
                    }
                }
                for (n = halfTesselation * i; n < halfTesselation * (i + 1) + 1; n += step) {
                    for (k = halfTesselation * j; k < halfTesselation * (j + 1); k++) {
                        indices.push(k * size + n);
                        indices.push((k + 1) * size + n);
                    }
                }

                ib = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
                ib.numIndices = indices.length;
                this.subIndexBuffer[ii] = ib;
            }
        };

        /**************************************************************************************************************/

        /**
         * Attach the layer to the planet
         * @function _attach
         * @memberof TileWireframeLayer.prototype
         * @param {Planet} g Planet
         * @private
         */
        TileWireframeLayer.prototype._attach = function (g) {
            BaseLayer.prototype._attach.call(this, g);

            if (this._visible) {
                this.planet.tileManager.addPostRenderer(this);
            }

            if (!this.program) {
                var vertexShader = "attribute vec3 vertex;\n";
                vertexShader    += "uniform mat4 modelViewMatrix;\n";
		            vertexShader    += "uniform mat4 projectionMatrix;\n";
		            vertexShader    += "void main(void) \n";
		            vertexShader    += "{\n";
		            vertexShader    += "	gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex, 1.0);\n";
		            vertexShader    += "}\n";

                var fragmentShader = "precision highp float; \n";
                fragmentShader    += "uniform vec3 color; \n";
		            fragmentShader    += "uniform float alpha; \n";
		            fragmentShader    += "void main(void)\n";
		            fragmentShader    += "{\n";
		            fragmentShader    += "	gl_FragColor = vec4(color,alpha);\n";
		            fragmentShader    += "}\n";

                this.program = new Program(this.planet.renderContext);
                this.program.createFromSource(vertexShader, fragmentShader);

                this.buildIndexBuffer();
            }
        };

        /**************************************************************************************************************/

        /**
         * Detach the layer from the planet
         * @function _detach
         * @memberof TileWireframeLayer.prototype
         * @private
         */
        TileWireframeLayer.prototype._detach = function () {
            this.planet.tileManager.removePostRenderer(this);
            BaseLayer.prototype._detach.call(this);
        };

        /**************************************************************************************************************/

        /**
         * Render the tiles outline
         * @function render
         * @memberof TileWireframeLayer.prototype
         * @param {Array} tiles Array of Tile
         */
        TileWireframeLayer.prototype.render = function (tiles) {
            var rc = this.planet.renderContext;
            var gl = rc.gl;

            gl.enable(gl.BLEND);

            // Setup program
            this.program.apply();
            gl.uniformMatrix4fv(this.program.uniforms.projectionMatrix, false, rc.projectionMatrix);

            var vertexAttribute = this.program.attributes.vertex;
            var currentIB = null;

            for (var i = 0; i < tiles.length; i++) {
                var tile = tiles[i];

                var isLoaded = ( tile.state === Tile.State.LOADED );
                var isLevelZero = ( tile.parentIndex === -1 );

                // Update uniforms for modelview matrix
                mat4.multiply(rc.viewMatrix, tile.matrix, rc.modelViewMatrix);
                gl.uniformMatrix4fv(this.program.uniforms.modelViewMatrix, false, rc.modelViewMatrix);
                gl.uniform3f(this.program.uniforms.color, this.color[0], this.color[1], this.color[2]);
                gl.uniform1f(this.program.uniforms.alpha, this.getOpacity());

                // Bind the vertex buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, tile.vertexBuffer);
                gl.vertexAttribPointer(vertexAttribute, 3, gl.FLOAT, false, 4 * tile.config.vertexSize, 0);

                var indexBuffer = ( isLoaded || isLevelZero ) ? this.indexBuffer : this.subIndexBuffer[tile.parentIndex];
                // Bind the index buffer only if different (index buffer is shared between tiles)
                if (currentIB !== indexBuffer) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                    currentIB = indexBuffer;
                }

                // Draw the tiles in wireframe mode
                var numIndices = currentIB.numIndices;
                gl.drawElements(gl.LINES, currentIB.numIndices, gl.UNSIGNED_SHORT, 0);
            }

            gl.disable(gl.BLEND);
        };

        /**************************************************************************************************************/

        /**
         * Get/Set visibility of the layer
         * @function setVisible
         * @memberof TileWireframeLayer.prototype
         * @param {boolean} arg Visiblity
         */
        TileWireframeLayer.prototype.setVisible = function (arg) {
            BaseLayer.prototype.setVisible.call(this, arg);

            if (typeof arg === "boolean") {
                if (this._visible) {
                    this.planet.tileManager.addPostRenderer(this);
                }
                else {
                    this.planet.tileManager.removePostRenderer(this);
                }
            }

            return this._visible;
        };

        return TileWireframeLayer;

    });
