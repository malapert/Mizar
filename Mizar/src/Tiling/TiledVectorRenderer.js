define(['../Utils/Utils', '../Renderer/VectorRenderer', '../Renderer/Program'], function (Utils, VectorRenderer, Program) {

    /**************************************************************************************************************/


    /** @constructor
     TiledVectorRenderer constructor
     */
    var TiledVectorRenderer = function (globe) {
        VectorRenderer.prototype.constructor.call(this, globe);

        var vertexShader = "attribute vec3 vertex; \n";
	      vertexShader    += "uniform float zOffset; \n";
	      vertexShader    += "uniform mat4 modelViewMatrix;\n";
	      vertexShader    += "uniform mat4 projectionMatrix;\n";
	      vertexShader    += "\n";
	      vertexShader    += "void main(void)  \n";
	      vertexShader    += "{ \n";
	      vertexShader    += "	gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex.x, vertex.y, vertex.z + zOffset, 1.0); \n";
	      vertexShader    += "} \n";

        var fragmentShader = "#ifdef GL_ES \n";
        fragmentShader    += "precision highp float; \n";
	      fragmentShader    += "#endif \n";
	      fragmentShader    += "uniform vec4 color; \n";
	      fragmentShader    += "\n";
	      fragmentShader    += "void main(void) \n";
	      fragmentShader    += "{ \n";
	      fragmentShader    += "	gl_FragColor = color; \n";
	      fragmentShader    += "} \n";


        this.program = new Program(this.tileManager.renderContext);
        this.program.createFromSource(vertexShader, fragmentShader);
    };

    Utils.inherits(VectorRenderer, TiledVectorRenderer);

    /**************************************************************************************************************/

    /**
     Render all redenrable on the given tiles
     */
    TiledVectorRenderer.prototype.render = function (renderables, start, end) {
        var renderContext = this.tileManager.renderContext;
        var gl = renderContext.gl;

        var modelViewMatrix = mat4.create();

        // Setup program
        this.program.apply();

        gl.depthFunc(gl.LEQUAL);
        // Do not write into z-buffer : the tiled vector are clamped to terrain, so the z of terrain should not change
        gl.depthMask(false);
        gl.uniformMatrix4fv(this.program.uniforms.projectionMatrix, false, renderContext.projectionMatrix);

        var currentStyle = null;

        for (var n = start; n < end; n++) {
            var renderable = renderables[n];
            var tile = renderable.tile;

            mat4.multiply(renderContext.viewMatrix, tile.matrix, modelViewMatrix);
            gl.uniformMatrix4fv(this.program.uniforms.modelViewMatrix, false, modelViewMatrix);
            gl.uniform1f(this.program.uniforms.zOffset, tile.radius * 0.0007);

            currentStyle = renderable.bucket.style;

            renderable.bindBuffers(renderContext);

            gl.vertexAttribPointer(this.program.attributes.vertex, 3, gl.FLOAT, false, 0, 0);

            if (renderable.triIndices.length > 0) {
                gl.uniform4f(this.program.uniforms.color, currentStyle.fillColor[0], currentStyle.fillColor[1], currentStyle.fillColor[2],
                    currentStyle.fillColor[3] * renderable.bucket.layer._opacity);
                gl.drawElements(gl.TRIANGLES, renderable.triIndices.length, renderable.indexType, 0);
            }

            if (renderable.lineIndices.length > 0) {
                gl.lineWidth(currentStyle.strokeWidth);
                gl.uniform4f(this.program.uniforms.color, currentStyle.strokeColor[0], currentStyle.strokeColor[1], currentStyle.strokeColor[2],
                    currentStyle.strokeColor[3] * renderable.bucket.layer._opacity);
                var size = renderable.indexType === gl.UNSIGNED_INT ? 4 : 2;
                gl.drawElements(gl.LINES, renderable.lineIndices.length, renderable.indexType, renderable.triIndices.length * size);
            }
        }

        gl.depthMask(true);
        gl.depthFunc(gl.LESS);
    };

    /**************************************************************************************************************/

    return TiledVectorRenderer;

});
