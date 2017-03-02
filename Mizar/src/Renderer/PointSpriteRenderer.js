define(['../Utils/Utils','./VectorRenderer','./Program','./FeatureStyle', './VectorRendererManager'],
	function(Utils,VectorRenderer,Program,FeatureStyle,VectorRendererManager) {

/**************************************************************************************************************/

 /**
	 @name PointSpriteRenderer
	 @class
		PointSpriteRenderer constructor
	 @param {Planet} planet Planet
 	 @augments VectorRenderer
	 @constructor
	 */
var PointSpriteRenderer = function(planet)
{
	VectorRenderer.prototype.constructor.call( this, planet );

	// For stats
	this.numberOfRenderPoints = 0;

	var vertexShader = "attribute vec3 vertex; \n";
	vertexShader    += "uniform mat4 viewProjectionMatrix; \n";
	vertexShader    += "uniform float pointSize; \n";
	vertexShader    += "void main(void)  \n";
	vertexShader    += "{ \n";
	vertexShader    += "	gl_Position = viewProjectionMatrix * vec4(vertex,1.0); \n";
	vertexShader    += "	gl_PointSize = pointSize; \n";
	vertexShader    += "} \n";

	var fragmentShader = "precision lowp float; \n";
	fragmentShader    += "uniform sampler2D texture; \n";
	fragmentShader    += "uniform float alpha; \n";
	fragmentShader    += "uniform vec3 color; \n";
	fragmentShader    += "\n";
	fragmentShader    += "void main(void) \n";
	fragmentShader    += "{ \n";
	fragmentShader    += "	vec4 textureColor = texture2D(texture, gl_PointCoord); \n";
	fragmentShader    += "	gl_FragColor = vec4(textureColor.rgb * color, textureColor.a * alpha); \n";
	fragmentShader    += "	if (gl_FragColor.a <= 0.0) discard; \n";
	fragmentShader    += "	//gl_FragColor = vec4(1.0); \n";
	fragmentShader    += "} \n";

    this.program = new Program(planet.renderContext);
    this.program.createFromSource(vertexShader, fragmentShader);

	this.defaultTexture = null;
};

Utils.inherits(VectorRenderer,PointSpriteRenderer);

/**************************************************************************************************************/

 /**
	 @name Renderable
	 @class
		Renderable constructor for PointSprite
	 @param {Bucket} bucket Bucket
	 @constructor
	 */
var Renderable = function(bucket)
{
	this.bucket = bucket;
	this.geometry2vb = {};
	this.vertices = [];
	this.vertexBuffer = null;
	this.vertexBufferDirty = false;
};

/**************************************************************************************************************/

/**
 * Add a geometry to the renderable
 * @function add
 * @memberof Renderable.prototype
 * @param geometry
 * @return {Boolean} If the geometry has been successfully added to the renderable
 */
Renderable.prototype.add = function(geometry)
{
	this.geometry2vb[ geometry.gid ] = this.vertices.length;
	// TODO: Find a better way to access to coordinate system
	var pt = this.bucket.renderer.planet.coordinateSystem.fromGeoTo3D( geometry.coordinates );
	var planetRadius = this.bucket.renderer.planet.coordinateSystem.geoide.realPlanetRadius;
	var scale = this.bucket.renderer.planet.isSky ? 0.985 : this.bucket.renderer.planet.getElevation(geometry.coordinates[0],geometry.coordinates[1])/planetRadius+1.0015;
	this.vertices.push( scale * pt[0], scale * pt[1], scale * pt[2] );
	this.vertexBufferDirty = true;

	return true;
};

/**************************************************************************************************************/

/**
 * Remove a geometry from the renderable
 * @function remove
 * @memberof Renderable.prototype
 * @param geometry
 */
Renderable.prototype.remove = function(geometry)
{
	if ( this.geometry2vb.hasOwnProperty(geometry.gid) )
	{
		var vbIndex = this.geometry2vb[ geometry.gid ];
		delete this.geometry2vb[ geometry.gid ];
		this.vertices.splice( vbIndex, 3 );
		this.vertexBufferDirty = true;

		// Update render data for all other geometries
		for ( var g in this.geometry2vb )
		{
			if ( g )
			{
				if ( this.geometry2vb[g] > vbIndex )
				{
					this.geometry2vb[g] -= 3;
				}
			}
		}
	}
	return this.vertices.length;
};

/**************************************************************************************************************/

/**
 * Dispose the renderable
 * @function dispose
 * @memberof Renderable.prototype
 * @param renderContext
 */
Renderable.prototype.dispose = function(renderContext)
{
	if ( this.vertexBuffer )
	{
		renderContext.gl.deleteBuffer( this.vertexBuffer );
	}
};

/**************************************************************************************************************/

/**
 * Build a default texture
 * @function _buildDefaultTexture
 * @memberof PointSpriteRenderer.prototype
 * @param {Bucket} bucket Bucket
 * @private
 */
PointSpriteRenderer.prototype._buildDefaultTexture = function(bucket)
{
	if ( !this.defaultTexture )
	{
		var gl = this.planet.renderContext.gl;
		this.defaultTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture);
		var whitePixel = new Uint8Array([255, 255, 255, 255]);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
	}

	bucket.texture = this.defaultTexture;
	bucket.textureWidth = 10;
	bucket.textureHeight = 10;
};

/**************************************************************************************************************/

/**
 * Build a texture from an image and store in a bucket
 * @function _buildTextureFromImage
 * @memberof PointSpriteRenderer.prototype
 * @param {Bucket} bucket Bucket
 * @param image
 * @private
 */
PointSpriteRenderer.prototype._buildTextureFromImage = function(bucket,image)
{
	bucket.texture = this.planet.renderContext.createNonPowerOfTwoTextureFromImage(image);
	bucket.textureWidth = image.width;
	bucket.textureHeight = image.height;
};

/**************************************************************************************************************/

/**
 * Check if renderer is applicable
 * @function canApply
 * @memberof PointSpriteRenderer.prototype
 * @param type
 * @param style
 * @return {Boolean} Is applicable ?
 */
PointSpriteRenderer.prototype.canApply = function(type,style)
{
	return type === "Point" && !style.label;
};

/**************************************************************************************************************/

 /**
	 @name Bucket
	 @class
		Bucket constructor for PointSpriteRenderer
	 @param layer
	 @param style
	 @constructor
	 */

 var Bucket = function(layer,style)
{
	this.layer = layer;
	this.style = new FeatureStyle(style);
	this.texture = null;
	this.renderer = null;
};

/**************************************************************************************************************/

/**
 * Create a renderable for this bucket
 * @function createRenderable
 * @memberof Bucket.prototype
 * @return {Renderable} Renderable
 */
Bucket.prototype.createRenderable = function()
{
	return new Renderable(this);
};

/**************************************************************************************************************/

/**
 * Check if a bucket is compatible
 * @function isCompatible
 * @memberof Bucket.prototype
 * @param style
 * @return {Boolean} Is compatible ?
 */
Bucket.prototype.isCompatible = function(style)
{
	if ( this.style.iconUrl === style.iconUrl &&
		this.style.icon === style.icon &&
		this.style.fillColor[0] === style.fillColor[0] &&
		this.style.fillColor[1] === style.fillColor[1] &&
		this.style.fillColor[2] === style.fillColor[2] )
	{
		return true;
	}

	return false;
};

/**************************************************************************************************************/

/**
 * Create bucket to render a point
 * @function createBucket
 * @memberof PointSpriteRenderer.prototype
 * @param layer
 * @param style
 * @return {Bucket} Bucket
 */
PointSpriteRenderer.prototype.createBucket = function(layer,style)
{
	var gl = this.planet.renderContext.gl;
	var vb = gl.createBuffer();

	// Create a bucket
	var bucket = new Bucket(layer,style);
	bucket.renderer = this;

	// Initialize bucket : create the texture
	if ( style.iconUrl )
	{
		var image = new Image();
		image.crossOrigin = '';
		var self = this;
		image.onload = function() {self._buildTextureFromImage(bucket,image); self.planet.renderContext.requestFrame(); };
		image.onerror = function() { self._buildDefaultTexture(bucket); };
		image.src = style.iconUrl;
	}
	else if ( style.icon )
	{
		this._buildTextureFromImage(bucket,style.icon);
	}
	else
	{
		this._buildDefaultTexture(bucket);
	}

	return bucket;
};

/**************************************************************************************************************/

/**
 * Render
 * @function render
 * @memberof PointSpriteRenderer.prototype
 * @param renderables
 * @param {Integer} start Start index
 * @param {Integer} end End index
 */
PointSpriteRenderer.prototype.render = function(renderables,start,end)
{
	var renderContext = this.planet.renderContext;
	var gl = renderContext.gl;

	// Setup states
	//gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendEquation(gl.FUNC_ADD);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	// Setup program
	this.program.apply();

	// The shader only needs the viewProjection matrix, use GlobWeb.modelViewMatrix as a temporary storage
	mat4.multiply(renderContext.projectionMatrix, renderContext.viewMatrix, renderContext.modelViewMatrix);
	gl.uniformMatrix4fv(this.program.uniforms.viewProjectionMatrix, false, renderContext.modelViewMatrix);
	gl.uniform1i(this.program.uniforms.texture, 0);

	// Render each renderables
	var currentBucket = null;
	for ( var n = start; n < end; n++ )
	{
		var renderable = renderables[n];
		var bucket = renderable.bucket;

		if ( currentBucket !== bucket )
		{
			gl.uniform1f(this.program.uniforms.alpha, bucket.layer._opacity);
			var color = bucket.style.fillColor;
			gl.uniform3f(this.program.uniforms.color, color[0], color[1], color[2] );
			gl.uniform1f(this.program.uniforms.pointSize, bucket.textureWidth);

			// Bind point texture
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, bucket.texture);

			currentBucket = bucket;
		}


		if ( !renderable.vertexBuffer )
		{
			renderable.vertexBuffer = gl.createBuffer();
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, renderable.vertexBuffer);
		gl.vertexAttribPointer(this.program.attributes.vertex, 3, gl.FLOAT, false, 0, 0);

		if ( renderable.vertexBufferDirty )
		{
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(renderable.vertices), gl.STATIC_DRAW);
			renderable.vertexBufferDirty = false;
		}


		gl.drawArrays(gl.POINTS, 0, renderable.vertices.length/3);
	}

    //gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
};


/**************************************************************************************************************/

// Register the renderer
VectorRendererManager.factory.push( function(planet) { return new PointSpriteRenderer(planet); } );
return PointSpriteRenderer;

});
