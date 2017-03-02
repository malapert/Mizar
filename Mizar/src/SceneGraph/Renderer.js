define(['../Renderer/Program', 'glMatrix'], function (Program) {

    /**************************************************************************************************************/

    /**
     *    @constructor SceneGraph Renderer
     */
    var SceneGraphRenderer = function (renderContext, node) {
        var vertexShader = "attribute vec3 vertex;\n";
    	  vertexShader    += "attribute vec2 tcoord;\n";
    	  vertexShader    += "uniform mat4 modelViewMatrix;\n";
    	  vertexShader    += "uniform mat4 projectionMatrix;\n";
    	  vertexShader    += "varying vec2 texCoord;\n";
    	  vertexShader    += "\n";
    	  vertexShader    += "void main(void)\n";
    	  vertexShader    += "{\n";
    	  vertexShader    += "	gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex.x, vertex.y, vertex.z, 1.0);\n";
    	  vertexShader    += "	texCoord = tcoord;\n";
    	  vertexShader    += "}\n";

        var fragmentShader = "precision lowp float;\n";
    	  fragmentShader    += "varying vec2 texCoord;\n";
    	  fragmentShader    += "uniform vec4 diffuse;\n";
    	  fragmentShader    += "uniform sampler2D texture;\n";
    	  fragmentShader    += "\n";
    	  fragmentShader    += "void main(void)\n";
    	  fragmentShader    += "{\n";
    	  fragmentShader    += "	gl_FragColor = diffuse * texture2D(texture, texCoord);\n";
    	  fragmentShader    += "}\n";

        var gl = renderContext.gl;
        this.defaultTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture);
        var whitePixel = new Uint8Array([255, 255, 255, 255]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);

        this.renderContext = renderContext;

        this.program = new Program(renderContext);
        this.program.createFromSource(vertexShader, fragmentShader);
        this.nodes = [];
        if (node) {
            this.nodes.push(node);
        }

        this.matrixStack = [];

        renderContext.minNear = 0.1;
        renderContext.far = 5000;
        renderContext.fov = 60;

        renderContext.renderer = this;
        renderContext.requestFrame();
    };

    /**************************************************************************************************************/

    /**
     *    Recursive method to render node
     */
    SceneGraphRenderer.prototype.renderNode = function (node, parent) {
        var rc = this.renderContext;
        var gl = rc.gl;

        if (node.matrix) {
            var mat = mat4.create();
            mat4.set(this.matrixStack[this.matrixStack.length - 1], mat);
            mat4.multiply(mat, node.matrix);
            this.matrixStack.push(mat);
        }

        node.render(this);

        if (node.matrix) {
            this.matrixStack.length = this.matrixStack.length - 1;
        }
    };

    /**************************************************************************************************************/

    /**
     *    Main render
     */
    SceneGraphRenderer.prototype.render = function () {
        var rc = this.renderContext;
        var gl = rc.gl;

        gl.disable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.activeTexture(gl.TEXTURE0);

        // Setup program
        this.program.apply();

        gl.uniformMatrix4fv(this.program.uniforms.projectionMatrix, false, rc.projectionMatrix);
        gl.uniform1i(this.program.uniforms.texture, 0);

        this.matrixStack.length = 0;
        this.matrixStack.push(rc.viewMatrix);

        for (var i = 0; i < this.nodes.length; i++) {
            this.renderNode(this.nodes[i]);
        }
    };

    /**************************************************************************************************************/

    return SceneGraphRenderer;

});
