define( ['../Utils/Utils','./VectorRenderer','./VectorRendererManager','./FeatureStyle','./Program','./BatchRenderable','./pnltri','./GeoBound'],
	function(Utils,VectorRenderer,VectorRendererManager,FeatureStyle,Program,BatchRenderable,PNLTRI,GeoBound) {

/**************************************************************************************************************/
 /**
	 @name PolygonRenderer
	 @class
	   Basic renderer for polygon
	 @param {Planet} planet Planet
 	 @augments VectorRenderer
	 @constructor
	 */
var PolygonRenderer = function(planet)
{
	VectorRenderer.prototype.constructor.call( this, planet );
	this.maxTilePerGeometry = 2;
	this.renderContext = planet.renderContext;
	this.defaultVertexShader = "attribute vec3 vertex;\n";
	this.defaultVertexShader+= "uniform mat4 mvp;\n";
	this.defaultVertexShader+= "void main(void) \n";
	this.defaultVertexShader+= "{\n";
	this.defaultVertexShader+= "	gl_Position = mvp * vec4(vertex, 1.0);\n";
	this.defaultVertexShader+= "}\n";

	this.extrudeVertexShader = "attribute vec3 vertex;\n";
	this.extrudeVertexShader+= "attribute vec4 normal;\n";
	this.extrudeVertexShader+= "uniform float extrusionScale; \n";
	this.extrudeVertexShader+= "uniform mat4 mvp;\n";
	this.extrudeVertexShader+= "void main(void) \n";
	this.extrudeVertexShader+= "{\n";
	this.extrudeVertexShader+= "	vec3 extrudedVertex = vertex + normal.w * vec3(normal.x, normal.y, normal.z) * extrusionScale;";
	this.extrudeVertexShader+= "	gl_Position = mvp * vec4(extrudedVertex, 1.0);\n";
	this.extrudeVertexShader+= "}\n";

	this.fragmentShader = "precision lowp float; \n";
	this.fragmentShader+= "uniform vec4 u_color;\n";
	this.fragmentShader+= "void main(void)\n";
	this.fragmentShader+= "{\n";
	this.fragmentShader+= "	gl_FragColor = u_color;\n";
	this.fragmentShader+= "	//if (u_color.a == 0.0) discard;\n";
	this.fragmentShader+= "}\n";

	this.program = new Program(planet.renderContext);
	this.program.createFromSource(this.defaultVertexShader, this.fragmentShader);

	this.extrudeProgram = new Program(planet.renderContext);
	this.extrudeProgram.createFromSource(this.extrudeVertexShader, this.fragmentShader );
};

/**************************************************************************************************************/

Utils.inherits(VectorRenderer,PolygonRenderer);

/**************************************************************************************************************/

 /**
	@name PolygonRenderable
	@class
		Renderable constructor for Polygon
	@param {Bucket} bucket Bucket
	@augments BatchRenderable
	@constructor
	*/
var PolygonRenderable = function(bucket)
{
	BatchRenderable.prototype.constructor.call( this, bucket );

	this.origin = null;

	this.vertexSize = bucket.style.extrude ? 7 : 3;
	this.matrix = mat4.create();
};

Utils.inherits(BatchRenderable,PolygonRenderable);

/**************************************************************************************************************/

/**
 * Create an interpolated for polygon clipping
 */
var _createInterpolatedVertex = function( t, p1, p2 )
{
	return [ p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1]) ];
};

/**************************************************************************************************************/

/**
	Clip polygon to a side
 */
var clipPolygonToSide = function( coord, sign, value, polygon )
{
	var clippedPolygon = [];
	var t,newPoint;
	// iterate through vertices
	for ( var i = 0; i < polygon.length; i++ )
	{
		var p1 = polygon[i];
		var p2 = polygon[ (i+1) % polygon.length ];
		var val1 = p1[coord];
		var val2 = p2[coord];

		// test containement
		var firstInside = (val1 - value) * sign >= 0.0;
		var secondInside = (val2 - value) * sign >= 0.0;

		// output vertices for inside polygon
		if ( !firstInside && secondInside )
		{
			t = (value - val1) / (val2- val1);
			newPoint = _createInterpolatedVertex( t, p1, p2 );
			clippedPolygon.push( newPoint );
			clippedPolygon.push( p2 );
		}
		else if ( firstInside && secondInside )
		{
			clippedPolygon.push( p2 );
		}
		else if ( firstInside && !secondInside )
		{
			t = (value - val1) / (val2- val1);
			newPoint = _createInterpolatedVertex( t, p1, p2 );
			clippedPolygon.push( newPoint );
		}
	}

	return clippedPolygon;
};

/**************************************************************************************************************/

/**
	Clip polygon
 */
 var clipPolygon = function( coordinates, bound )
{
	var c;
	c = clipPolygonToSide( 0, 1, bound.west, coordinates );
	c = clipPolygonToSide( 0, -1, bound.east, c );
	c = clipPolygonToSide( 1, 1, bound.south, c );
	c = clipPolygonToSide( 1, -1, bound.north, c );
	return c
};

/**************************************************************************************************************/

/**
  Check if a geometry crosses the date line
*/
var _fixDateLine = function( coords ) {
	//return [coords];
    var crossDateLine = false;
 	for (var i = 1; i < coords.length && !crossDateLine; i++) {
		var deltaLon = Math.abs(coords[i][0] - coords[i-1][0] );
		if (deltaLon > 180 && deltaLon < 360) {
			// DateLine!
			crossDateLine = true;
		}
	}
	var n;
	if (crossDateLine) {

		// Ensure coordinates are always negative
		var negCoords = [];
		for (n = 0; n < coords.length; n++) {
			if (coords[n][0] > 0) {
				negCoords[n] = [coords[n][0] - 360, coords[n][1]];
			} else {
				negCoords[n] = [coords[n][0], coords[n][1]];
			}
		}
	
		var posCoords = [];
		// Ensure coordinates are always positive
		for (n = 0; n < coords.length; n++) {
			if (coords[n][0] < 0) {
				posCoords[n] = [coords[n][0] + 360, coords[n][1]];
			} else {
				posCoords[n] = [coords[n][0], coords[n][1]];
			}
		}


		return [posCoords,negCoords];
	}
	else {
		return [coords];
	}
};


/**************************************************************************************************************/


/**
 * Add a geometry to the renderbale
 * Vertex buffer : geometry|extrude
 * Index buffer : geometry triangles|extrude triangles|lines
 * Normal buffer : normals.xyz, extrude value as w
 * @function build
 * @memberof PolygonRenderable.prototype
 * @param geometry
 */
PolygonRenderable.prototype.build = function(geometry)
{

	var renderer = this.bucket.renderer;
	var style = this.bucket.style;
	var coordinateSystem = renderer.planet.coordinateSystem;

	var polygons =  (geometry.type === "MultiPolygon") ? geometry.coordinates : [geometry.coordinates];

	var geometryBound = new GeoBound();
	var csBound = new GeoBound(coordinateSystem.geoBound[0],coordinateSystem.geoBound[1],coordinateSystem.geoBound[2],coordinateSystem.geoBound[3]);
	geometryBound.computeFromCoordinates(polygons[0][0]);
	if
		(!geometryBound.intersects(csBound))
	{
		return;
	}


	var pos3d = vec3.create();
	var i,n;
	if (!this.origin)
	{
		this.origin = vec3.create();
		coordinateSystem.fromGeoTo3D(polygons[0][0][0], this.origin);

		mat4.identity(this.matrix);
		mat4.translate(this.matrix,this.origin);
	}

	var lastIndex = this.vertices.length / this.vertexSize;
	var offset = this.vertices.length;
	var upOffset,lowOffset;

	var contours = [];
	for ( n=0; n < polygons.length; n++ ) {
		
		contours = contours.concat( _fixDateLine(polygons[n][0]) );
	}
	
	
	for ( n=0; n < contours.length; n++ ) {

		var coords = clipPolygon(contours[n],csBound);

		offset = this.vertices.length;

		// Build upper polygon vertices
		var clockwise = 0;
		for ( i=0; i < coords.length; i++)
		{
			// Always use coordinates at zero height on vertex construction, height will be taken into account on extrude
			coordinateSystem.fromGeoTo3D([ coords[i][0], coords[i][1], 0.0 ], pos3d);
			this.vertices[offset] = pos3d[0] - this.origin[0];
			this.vertices[offset+1] = pos3d[1] - this.origin[1];
			this.vertices[offset+2] = pos3d[2] - this.origin[2];

			// Find out if its vertices ordered clockwise to build index buffer properly
			if ( i < coords.length - 1 ) {
				clockwise += (coords[i+1][0] - coords[i][0]) * (coords[i+1][1] + coords[i][1]);
			}

			if ( style.extrude )
			{
				// Compute normals
				vec3.normalize(pos3d);
				this.vertices[offset+3] = pos3d[0];
				this.vertices[offset+4] = pos3d[1];
				this.vertices[offset+5] = pos3d[2];
				var extrudeValue;
				if ( typeof style.extrude === "boolean" )
				{
					// Extrude value extracted from KML, use the height coordinate
					extrudeValue = coords[i][2];
				}
				else
				{
					// Extrude value is a float defined by user
					extrudeValue = style.extrude;
				}
				this.vertices[offset+6] = extrudeValue * coordinateSystem.geoide.heightScale;
			}

			offset += this.vertexSize;
		}

		// Build bottom polygon vertices on extrude
		if ( style.extrude )
		{
			// Use same vertices as upper polygon but resest the 4-th compoenent
			var prevOffset = lastIndex * this.vertexSize;
			this.vertices = this.vertices.concat( this.vertices.slice(prevOffset, offset) );
			// Reset the 4-th component for extrusion
			for ( i=offset; i < this.vertices.length; i+= this.vertexSize)
			{
				this.vertices[i+6] = 0.0;
			}
		}

		// Build triangle indices for upper polygon
		var triangulator = new PNLTRI.Triangulator();
		var contour = coords.map( function(value) {  return { x: value[0], y: value[1] }; });
		var triangList = triangulator.triangulate_polygon( [ contour ] );
		for (i=0; i<triangList.length; i++ )
		{
			this.triIndices.push(lastIndex + triangList[i][0], lastIndex + triangList[i][1], lastIndex + triangList[i][2] );
			//this.lineIndices.push( lastIndex + triangList[i][0], lastIndex + triangList[i][1], lastIndex + triangList[i][1], lastIndex + triangList[i][2], lastIndex + triangList[i][2], lastIndex + triangList[i][0] );
		}


		// Build side triangle indices
		if ( style.extrude )
		{
			upOffset = lastIndex;
			lowOffset = lastIndex + coords.length;

			for (i = 0; i < coords.length-1; i++ )
			{
				// Depending on vertice order, push the
				if ( clockwise > 0 )
				{
					this.triIndices.push( upOffset, upOffset + 1, lowOffset );
					this.triIndices.push( upOffset + 1, lowOffset + 1, lowOffset );
				}
				else
				{
					this.triIndices.push( upOffset, lowOffset, upOffset + 1 );
					this.triIndices.push( upOffset + 1, lowOffset, lowOffset + 1 );
				}
				upOffset += 1;
				lowOffset += 1;
			}
		}

		// Build line indices for upper polygon
		for ( i = 0; i < coords.length-1; i++ )
		{
			this.lineIndices.push( lastIndex + i, lastIndex + i + 1 );
		}

		// Build top-to-bottom line indices
		if ( style.extrude )
		{
			upOffset = lastIndex;
			lowOffset = lastIndex + coords.length;
			for ( i = 0; i < coords.length-1; i++ )
			{
				this.lineIndices.push( upOffset + i, lowOffset + i );
			}
		}

		// Update last index
		lastIndex = this.vertices.length / this.vertexSize;
	}
	// Geometry is always added contrary to tiled renderables
	return true;
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
	return this.style === style;
};

/**************************************************************************************************************/

/**
 * 	Render all the polygons
 * @function render
 * @memberof PolygonRenderer.prototype
 * @param renderables
 * @param {Integer} start Start index
 * @param {Integer} end End index
 */
PolygonRenderer.prototype.render = function(renderables, start, end)
{
	var renderContext = this.planet.renderContext;
	var gl = renderContext.gl;

	gl.enable(gl.BLEND);
	gl.blendEquation(gl.FUNC_ADD);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.depthFunc(gl.LEQUAL);
	//gl.enable(gl.POLYGON_OFFSET_FILL);
	//gl.polygonOffset(-2.0,-2.0);
	//gl.disable(gl.DEPTH_TEST);

	var currentProgram = null;

	// Compute the viewProj matrix
	var viewProjMatrix = mat4.create();
	mat4.multiply(renderContext.projectionMatrix, renderContext.viewMatrix, viewProjMatrix);

	var modelViewProjMatrix = mat4.create();
	for ( var n = start; n < end; n++ )
	{
		var renderable = renderables[n];
		var style = renderable.bucket.style;

		// Setup program
		var program = style.extrude ? this.extrudeProgram : this.program;
		if ( program !== currentProgram )
		{
			program.apply();
			currentProgram = program;
		}

		mat4.multiply(viewProjMatrix,renderable.matrix,modelViewProjMatrix);
		gl.uniformMatrix4fv(program.uniforms.mvp, false, modelViewProjMatrix);

		gl.uniform4f(program.uniforms.u_color, style.fillColor[0], style.fillColor[1], style.fillColor[2],
				style.fillColor[3] * renderable.bucket.layer._opacity);  // use fillColor

		renderable.bindBuffers(renderContext);
		gl.lineWidth( style.strokeWidth );

		// Setup attributes
		gl.vertexAttribPointer(program.attributes.vertex, 3, gl.FLOAT, false, 4 * renderable.vertexSize, 0);
		if ( style.extrude )
		{
			gl.vertexAttribPointer(program.attributes.normal, 4, gl.FLOAT, false, 4 * renderable.vertexSize, 12);
			gl.uniform1f(program.uniforms.extrusionScale, style.extrusionScale);
		}

		// Draw
		gl.drawElements( gl.TRIANGLES, renderable.triIndices.length, renderable.indexType, 0);
		if ( renderable.lineIndices.length > 0 )
		{
			gl.uniform4f(program.uniforms.u_color, style.strokeColor[0], style.strokeColor[1], style.strokeColor[2], style.strokeColor[3] * renderable.bucket.layer._opacity);
			var size = renderable.indexType === gl.UNSIGNED_INT ? 4 : 2;
			gl.drawElements( gl.LINES, renderable.lineIndices.length, renderable.indexType, renderable.triIndices.length * size);
		}
	}

	// Revert line width
	gl.lineWidth(1.0);

	//gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.POLYGON_OFFSET_FILL);
	gl.depthFunc(gl.LESS);
	gl.disable(gl.BLEND);
};

/**************************************************************************************************************/

/**
 * Check if renderer is applicable
 * @function canApply
 * @memberof PolygonRenderer.prototype
 * @param type
 * @param style
 * @return {Boolean} Can apply ?
 */
PolygonRenderer.prototype.canApply = function(type,style)
{
	return (type === "Polygon" || type === "MultiPolygon") && style.fill;
};

/**************************************************************************************************************/

/**
 * Create a bucket
 * @function createBucket
 * @memberof PolygonRenderer.prototype
 * @param layer
 * @param style
 * @return {PolygonBucket} Bucket
 */
PolygonRenderer.prototype.createBucket = function(layer,style)
{
	return new PolygonBucket(layer,style);
};

/**************************************************************************************************************/

// Register the renderer
VectorRendererManager.factory.push( function(planet) { return new PolygonRenderer(planet); } );

});
