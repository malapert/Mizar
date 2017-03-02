define( function() {

/**************************************************************************************************************/

/**
  @name VectorRendererManager
  @class
	  VectorRendererManager constructor
  @param {Planet} planet Planet
  @constructor
  */
var VectorRendererManager = function(planet)
{
	// Create the registered renderers
	this.renderers = [];
	for ( var i = 0; i < VectorRendererManager.factory.length; i++ )
	{
		this.renderers.push( VectorRendererManager.factory[i](planet) );
	}


	// The array of renderables used during rendering
	this.renderables = [];

	// To uniquely identify buckets created by the renderers
	this.bucketId = 0;
};

/**************************************************************************************************************/

/**
	The factory for renderers
 */
VectorRendererManager.factory = [];

/**************************************************************************************************************/

/**
 * Get a renderer
 * @function getRenderer
 * @memberof VectorRendererManager.prototype
 * @param geometry
 * @param style
 * @return Renderer
 */
VectorRendererManager.prototype.getRenderer = function(geometry,style)
{
	for ( var i = 0; i < this.renderers.length; i++ )
	{
		if ( this.renderers[i].canApply(geometry.type,style) )
		{
			return this.renderers[i];
		}
	}

	return null;
};

/**************************************************************************************************************/

/**
 *	Generate the tile data
 * @function generate
 * @memberof VectorRendererManager.prototype
 * @param {Tile} tile Tile
 */
VectorRendererManager.prototype.generate = function(tile)
{
	var i;
	if ( !tile.parent )
	{
		for ( i=0; i < this.renderers.length; i++ )
		{
			this.renderers[i].generateLevelZero(tile);
		}
	}
	else
	{
		var tileData = tile.parent.extension.renderer;
		if ( tileData )
		{
			// delete renderer created at init time
			delete tile.extension.renderer;

			// Now generate renderables
			for ( i = 0; i < tileData.renderables.length; i++ )
			{
				var renderable = tileData.renderables[i];
				if ( renderable.generateChild )
				{
					renderable.generateChild( tile );
				}
			}
		}
	}
};

/**************************************************************************************************************/

/**
 * Add a geometry to the renderer
 * @function addGeometry
 * @memberof VectorRendererManager.prototype
 * @param layer
 * @param geometry
 * @param style
 */
VectorRendererManager.prototype.addGeometry = function(layer, geometry, style)
{
	var renderer = this.getRenderer(geometry,style);
	if (renderer) {
		renderer.addGeometry(layer, geometry, style);
	} else {
		console.log("No renderer for VectorRendererManager");
	}
};

/**************************************************************************************************************/

/**
 * Remove a geometry from the renderer
 * @function removeGeometry
 * @memberof VectorRendererManager.prototype
 * @param geometry
 * @param layer
 * @return {Boolean}
 */
VectorRendererManager.prototype.removeGeometry = function(geometry,layer)
{
	var bucket = geometry._bucket;
	if ( bucket && bucket.layer === layer )
	{
		bucket.renderer.removeGeometry(geometry);
		return true;
	}
	return false;
};

/**************************************************************************************************************/

/**
 * Add a geometry to a tile
 * @function addGeometryToTile
 * @memberof VectorRendererManager.prototype
 * @param layer
 * @param geometry
 * @param style
 * @param {Tile} tile Tile
 */
VectorRendererManager.prototype.addGeometryToTile = function(layer, geometry, style, tile)
{
	var renderer = this.getRenderer(geometry,style);
	renderer.addGeometryToTile(layer, geometry, style, tile);
};


/**************************************************************************************************************/

/**
 * Remove a geometry from a tile
 * @function removeGeometryFromTile
 * @memberof VectorRendererManager.prototype
 * @param geometry
 * @param {Tile} tile Tile
 */
VectorRendererManager.prototype.removeGeometryFromTile = function(geometry,tile)
{
	var bucket = geometry._bucket;
	bucket.renderer.removeGeometryFromTile(geometry,tile);
};


/**************************************************************************************************************/

/**
 * Function to sort with zIndex, then bucket
 */
var renderableSort = function(r1,r2)
{
	var zdiff = r1.bucket.style.zIndex - r2.bucket.style.zIndex;
	if ( zdiff === 0 ) {
		return r1.bucket.id - r2.bucket.id;
	} else {
		return zdiff;
	}
};

/**************************************************************************************************************/

/**
 * Render all
 * @function render
 * @memberof VectorRendererManager.prototype
 */
VectorRendererManager.prototype.render = function()
{
	// Add main renderables
	var i,j;
	for ( j = 0; j < this.renderers.length; j++ )
	{
		var buckets = this.renderers[j].buckets;
		for ( i = 0; i < buckets.length; i++ )
		{
			if ( buckets[i].layer._visible && buckets[i].mainRenderable )
			{
				this.renderables.push( buckets[i].mainRenderable );
			}
		}
	}

	// Renderable sort
	this.renderables.sort( renderableSort );

	//var renderCall = 0;

	i = 0;
	while ( i < this.renderables.length )
	{
		j = i + 1;

		var currentRenderer = this.renderables[i].bucket.renderer;
		while ( j < this.renderables.length && this.renderables[j].bucket.renderer === currentRenderer )
		{
			j++;
		}
		currentRenderer.render( this.renderables, i, j );
		//renderCall++;

		i = j;
	}

	//console.log( "# of render calls "  + renderCall );

	this.renderables.length = 0;
};

/**************************************************************************************************************/

return VectorRendererManager;

});
