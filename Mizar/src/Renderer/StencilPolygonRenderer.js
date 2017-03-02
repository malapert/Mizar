define( ['../Utils/Utils','./RenderContext','./VectorRenderer','./VectorRendererManager','./FeatureStyle','./Program','./pnltri'],
	function(Utils,RenderContext,VectorRenderer,VectorRendererManager,FeatureStyle,Program,PNLTRI) {

/**************************************************************************************************************/
/**
  @name StencilPolygonRenderer
  @class
	  Basic renderer for polygon
  @param {Planet} planet Planet
  @constructor
  */
var StencilPolygonRenderer = function(planet)
{
	VectorRenderer.prototype.constructor.call( this, planet );
	this.maxTilePerGeometry = 0;

	this.vertexShader = "attribute vec3 vertex;\n";
	this.vertexShader+= "uniform mat4 viewProjectionMatrix;\n";
	this.vertexShader+= "void main(void) \n";
	this.vertexShader+= "{\n";
	this.vertexShader+= "	gl_Position = viewProjectionMatrix * vec4(vertex, 1.0);\n";
	this.vertexShader+= "}\n";

	var fragmentShader = "precision lowp float; \n";
	fragmentShader    += "uniform vec4 u_color;\n";
	fragmentShader    += "void main(void)\n";
	fragmentShader    += "{\n";
	fragmentShader    += "	gl_FragColor = u_color;\n";
	fragmentShader    += "}\n";

	this.program = new Program(planet.renderContext);
	this.program.createFromSource(this.vertexShader, fragmentShader);
};

Utils.inherits(VectorRenderer,StencilPolygonRenderer);

/**************************************************************************************************************/
 /**
   @name PolygonRenderable
   @class
 	  Renderable constructor for Polygon
   @param {Bucket} bucket Bucket
   @constructor
   */
var PolygonRenderable = function(bucket)
{
	this.bucket = bucket;
	this.geometry = null;
	this.vertexBuffer = null;
	this.indexBuffer = null;
};

/**************************************************************************************************************/

/**
 * Add polygon to renderer
 * @function add
 * @memberof PolygonRenderable.prototype
 * @param geometry
 */
PolygonRenderable.prototype.add = function(geometry) {

	this.geometry = geometry;

	var renderer = this.bucket.renderer;
	var gl = renderer.tileManager.renderContext.gl;

	var polygons =  (geometry.type === "MultiPolygon") ? geometry.coordinates : [geometry.coordinates];

	var vertices = [];
	var indices = [];
	var pos3d = [];
  var i,n;
	for ( n = 0; n < polygons.length; n++ )
	{
		// Only contour
		var coords = polygons[n][0];

		var indexOffset = indices.length;
		var vertexOffset = vertices.length / 3;

		var topIndex = vertexOffset;
		var bottomIndex = (vertexOffset + coords.length) * 3;
		for ( i = 0; i < coords.length; i++)
		{

			var coord = [ coords[i][0], coords[i][1], 50000 ];
			renderer.planet.coordinateSystem.fromGeoTo3D(coord, pos3d);
			vertices[topIndex] = pos3d[0];
			vertices[topIndex+1] = pos3d[1];
			vertices[topIndex+2] = pos3d[2];

			coord[2] = -50000;

			renderer.planet.coordinateSystem.fromGeoTo3D(coord, pos3d);
			vertices[bottomIndex] = pos3d[0];
			vertices[bottomIndex+1] = pos3d[1];
			vertices[bottomIndex+2] = pos3d[2];

			topIndex += 3;
			bottomIndex += 3;
		}


		// Build triangle indices for upper polygon
		var triangulator = new PNLTRI.Triangulator();
		var contour = coords.map( function(value) {  return { x: value[0], y: value[1] }; });
		var triangList = triangulator.triangulate_polygon( [ contour ] );
		for ( i=0; i<triangList.length; i++ )
		{
			indices.push(vertexOffset + triangList[i][0], vertexOffset + triangList[i][1], vertexOffset + triangList[i][2] );
		}

		if ( indices === null )
		{
			console.error("Triangulation error ! Check if your GeoJSON geometry is valid");
			return false;
		}


		var numTopIndices = indices.length;

		// Add side
		topIndex = vertexOffset;
		bottomIndex = vertexOffset + coords.length;
		for ( i = 0; i < coords.length - 1; i++ )
		{
			indices.push( topIndex, bottomIndex, topIndex + 1  );
			indices.push( topIndex + 1, bottomIndex, bottomIndex + 1 );
			//indices.push( topIndex, topIndex + 1, bottomIndex  );
			//indices.push( topIndex + 1, bottomIndex + 1, bottomIndex );

			topIndex++;
			bottomIndex++;
		}

		// Add bottom : invert top indices and add offset
		for ( i = 0; i < numTopIndices; i += 3 )
		{
			indices.push( indices[indexOffset + i] + coords.length, indices[indexOffset + i + 2] + coords.length, indices[indexOffset + i + 1] + coords.length );
		}
	}

	this.numTriIndices = indices.length;

	// Create vertex buffer
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW);

	// Create index buffer
	this.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
};

/**************************************************************************************************************/

/**
 * Remove a geometry from the renderable
 * @function remove
 * @memberof PolygonRenderable.prototype
 * @param geometry

 */
PolygonRenderable.prototype.remove = function(geometry)
{
	if ( this.geometry === geometry)
	{
		this.geometry = null;
		// Since there is only one geometry per bucket
		// return 0 to dispose geometry resources
		return 0;
	}
};

/**************************************************************************************************************/

/**
 * Dispose the renderable
 * @function dispose
 * @memberof PolygonRenderable.prototype
 * @param renderContext
 */
PolygonRenderable.prototype.dispose = function(renderContext)
{
	var gl = renderContext.gl;
	if (this.vertexBuffer) {
		gl.deleteBuffer( this.vertexBuffer );
	}
	if (this.indexBuffer) {
		gl.deleteBuffer( this.indexBuffer );
	}
};


/**************************************************************************************************************/
 /**
   @name PolygonBucket
   @class
 	  Bucket constructor for PolygonRenderer
   @param layer
	 @param style
   @constructor
   */
var PolygonBucket = function(layer,style)
{
	this.layer = layer;
	this.style = style;
	this.renderer = null;
};

/**************************************************************************************************************/

/**
 * Create a renderable for this bucket
 * @function createRenderable
 * @memberof PolygonBucket.prototype
 * @return {PolygonRenderable} Renderable
 */
PolygonBucket.prototype.createRenderable = function()
{
	return new PolygonRenderable(this);
};

/**************************************************************************************************************/

/**
 * Check if a bucket is compatible
 * @function isCompatible
 * @memberof PolygonBucket.prototype
 * @param style
 * @return {Boolean} Is compatible ?
 */
PolygonBucket.prototype.isCompatible = function(style)
{
	return false;
};


/**************************************************************************************************************/

/**
 * Render all the polygons
 * @function render
 * @memberof StencilPolygonRenderer.prototype
 * @param renderables
 * @param {Integer} start Start index
 * @param {Integer} end End index
 */
StencilPolygonRenderer.prototype.render = function(renderables, start, end)
{
	var renderContext = this.planet.renderContext;
	var gl = renderContext.gl;

	gl.enable(gl.BLEND);
	gl.blendEquation(gl.FUNC_ADD);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	// Configure stencil
	gl.enable(gl.STENCIL_TEST);
	gl.stencilMask(255);
	gl.depthMask(false);

	this.program.apply();

	// The shader only needs the viewProjection matrix, use GlobWeb.modelViewMatrix as a temporary storage
	mat4.multiply(renderContext.projectionMatrix, renderContext.viewMatrix, renderContext.modelViewMatrix);
	gl.uniformMatrix4fv(this.program.uniforms.viewProjectionMatrix, false, renderContext.modelViewMatrix);


	for ( var n = start; n < end; n++ )
	{
		var renderable = renderables[n];

		var style = renderable.bucket.style;
		gl.uniform4f(this.program.uniforms.u_color, style.fillColor[0], style.fillColor[1], style.fillColor[2],
				style.fillColor[3] * renderable.bucket.layer._opacity);  // use fillColor

		gl.bindBuffer(gl.ARRAY_BUFFER, renderable.vertexBuffer);
		gl.vertexAttribPointer(this.program.attributes.vertex, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderable.indexBuffer);

		//create the mask
		gl.disable( gl.CULL_FACE );
		gl.colorMask( false, false, false, false );
		gl.depthFunc(gl.LESS);
		gl.stencilFunc(gl.ALWAYS, 0, 0);
		gl.disable(gl.CULL_FACE);
		//set the stencil buffer operation
		gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.INCR_WRAP, gl.KEEP);
		gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.DECR_WRAP, gl.KEEP);
		// draw the vector data
		gl.drawElements( gl.TRIANGLES, renderable.numTriIndices, gl.UNSIGNED_SHORT, 0);


		// render the color
		gl.colorMask( true, true, true, true );
		gl.disable(gl.DEPTH_TEST);
		//set the stencil buffer operation
		gl.stencilFunc( gl.NOTEQUAL, 0, 1);
		gl.stencilOp( gl.ZERO, gl.ZERO, gl.ZERO );
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		gl.drawElements( gl.TRIANGLES, renderable.numTriIndices, gl.UNSIGNED_SHORT, 0);
		gl.enable(gl.DEPTH_TEST);
	}

	gl.depthMask(true);
	gl.disable(gl.STENCIL_TEST);
	gl.disable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);
};

/**************************************************************************************************************/

/**
 * Check if renderer is applicable
 * @function canApply
 * @memberof StencilPolygonRenderer.prototype
 * @param type
 * @param style
 * @return {Boolean} Can apply ?
 */
StencilPolygonRenderer.prototype.canApply = function(type,style)
{
	return (type === "Polygon" || type === "MultiPolygon") && style.fill;
};

/**************************************************************************************************************/

/**
 * Create a bucket
 * @function createBucket
 * @memberof StencilPolygonRenderer.prototype
 * @param layer
 * @param style
 * @return {PolygonBucket} Bucket
 */
StencilPolygonRenderer.prototype.createBucket = function(layer,style)
{
	return new PolygonBucket(layer,style);
};

/**************************************************************************************************************/

// Add stencil for default context attributes
RenderContext.contextAttributes.stencil = true;

// Register the renderer
VectorRendererManager.factory.push( function(planet) { return new StencilPolygonRenderer(planet); } );

});
