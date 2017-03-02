define( function() {
/**
 @name BatchRenderable
 @class
  Base renderable
 @constructor
 */
var BatchRenderable = function( bucket )
{
	this.bucket = bucket;
 	this.vertexBuffer = null;
 	this.indexBuffer = null;
	this.vertices = [];
	this.triIndices = [];
	this.lineIndices = [];
	this.geometryInfos = [];
	this.bufferDirty = true;
	this.vertexSize = 3;
	this.indexType = 0;
	this.vertexBufferShared = false;
};

 /**
   Remove a geometry from the renderable
   @function remove
   @memberof BatchRenderable.prototype
   @param {JSON} geometry Geometry
 */
BatchRenderable.prototype.remove = function( geometry )
{
	var fiIndex = -1;

	// Find the feature
	var vertexIt = 0;
	var lineIndexIt = 0;
	var triIndexIt = 0;
  var n;
	for ( var i = 0; i < this.geometryInfos.length; i++ )
	{
		var fi = this.geometryInfos[i];
		if ( fi.geometry === geometry )
		{
			// Remove feature from vertex and index buffer
			this.vertices.splice( vertexIt, fi.vertexCount );
			this.lineIndices.splice( lineIndexIt, fi.lineIndexCount );
			this.triIndices.splice( triIndexIt, fi.triIndexCount );

			// Update index buffer
			var vertexOffset = fi.vertexCount / this.vertexSize;
			for ( n = lineIndexIt; n < this.lineIndices.length; n++ )
			{
				this.lineIndices[n] -= vertexOffset;
			}
			for ( n = triIndexIt; n < this.triIndices.length; n++ )
			{
				this.triIndices[n] -= vertexOffset;
			}
			fiIndex = i;

			break;
		}

		vertexIt += fi.vertexCount;
		lineIndexIt += fi.lineIndexCount;
		triIndexIt += fi.triIndexCount;
	}

	if ( fiIndex >= 0 )
	{
		this.bufferDirty = true;

		// Remove the feature from the infos array
		this.geometryInfos.splice( fiIndex, 1 );

		return this.vertices.length;
	}
	else
	{
		return this.vertices.length;
	}
};

 /**
   Add a feature to the renderable
   @function add
   @memberof BatchRenderable.prototype
   @param {JSON} geometry Geometry
   @param {?} tile Tile
 */
BatchRenderable.prototype.add = function( geometry, tile )
{
	this.tile = tile;

	// Store previous number of vertices/indices needed for "after-build" computation
	var numVertices = this.vertices.length;
	var numLineIndices = this.lineIndices.length;
	var numTriIndices = this.triIndices.length;

	var geometryInTile = this.build( geometry, tile );
	if ( geometryInTile )
	{
		this.geometryInfos.push({
			geometry: geometry,
			vertexCount: this.vertices.length - numVertices,
			lineIndexCount: this.lineIndices.length - numLineIndices,
			triIndexCount: this.triIndices.length - numTriIndices
		});
		this.bufferDirty = true;

		return true;
	}
	else
	{
		// Feature not in the tile
		return false;
	}
};

 /**
   Dispose graphics data
   @function dispose
   @memberof BatchRenderable.prototype
   @param {renderContext} renderContext Render context
 */
BatchRenderable.prototype.dispose = function(renderContext)
{
	var gl = renderContext.gl;

	if ( this.indexBuffer ) {
		gl.deleteBuffer(this.indexBuffer);
	}
	this.indexBuffer = null;
	if ( this.vertexBuffer && !this.vertexBufferShared)
	{
		gl.deleteBuffer(this.vertexBuffer);
		this.vertexBuffer = null;
	}
};

 /**
   Must be call before rendering
   @function bindBuffers
   @memberof BatchRenderable.prototype
   @param {renderContext} renderContext Render context
 */
BatchRenderable.prototype.bindBuffers = function(renderContext)
{
	var gl = renderContext.gl;

	if ( this.bufferDirty )
	{
		this.dispose(renderContext);

		// Create vertex buffer if needed
		if (this.vertexBuffer)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		}
		else
		{
			this.vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( this.vertices ), gl.STATIC_DRAW);
		}

		// Create index buffer
		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

		var indices = this.triIndices;
		if ( this.triIndices.length > 0  )
		{
			if (this.lineIndices.length > 0) {
				indices = this.triIndices.concat(this.lineIndices);
			} else {
				indices = this.triIndices;
			}
		}
		else
		{
			indices = this.lineIndices;
		}

		var vertexCount = this.vertices.length / this.vertexSize;
		if ( vertexCount > 65535 )
		{
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array( indices ), gl.STATIC_DRAW);
			this.indexType = gl.UNSIGNED_INT;
		}
		else
		{
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW);
			this.indexType = gl.UNSIGNED_SHORT;
		}
		this.bufferDirty = false;
	}
	else
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	}
};


/**************************************************************************************************************/

return BatchRenderable;

});
