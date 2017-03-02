define(['./RendererTileData','../Tiling/Tile'],
	function(RendererTileData, Tile) {

/**************************************************************************************************************/

/**
  @name VectorRenderer
  @class
	  VectorRenderer constructor
  @param {Planet} planet Planet
  @constructor
  */
var VectorRenderer = function(planet)
{
	this.tileManager = planet.tileManager;
	this.planet = planet;
	this.buckets = [];
	this.maxTilePerGeometry = 100;
	this.levelZeroTiledGeometries = [];
};

/**************************************************************************************************************/

/**
 * Find a compatible bucket
 * @function findBucket
 * @memberof VectorRenderer.prototype
 * @param layer
 * @param style
 * @return {Bucket} Bucket
 */
VectorRenderer.prototype.findBucket = function(layer,style)
{
	// Find an existing bucket for the given style
	for ( var i = 0; i < this.buckets.length; i++ )
	{
		var bucket = this.buckets[i];
		if ( bucket.layer === layer &&
			bucket.isCompatible(style) )
		{
			return bucket;
		}
	}

	return null;
};


/**************************************************************************************************************/

/**
 * Generate the level zero for a tile
 * @function generateLevelZero
 * @memberof VectorRenderer.prototype
 * @param {Tile} tile Tile
 */
VectorRenderer.prototype.generateLevelZero = function(tile)
{
	for ( var i=0; i < this.levelZeroTiledGeometries.length; i++ )
	{
		var geometry = this.levelZeroTiledGeometries[i];

		// Check that the geometry is on this tile
		var isFound = false;
		for ( var n = 0; n < geometry._tileIndices.length && !isFound; n++ )
		{
			var t = this.tileManager.level0Tiles[ geometry._tileIndices[n] ];
			isFound = ( t === tile );
		}

		// Found the tile, so add it
		if ( isFound )
		{
			this._addGeometryToTile(geometry._bucket, geometry, tile);
		}
	}
};

/**************************************************************************************************************/

/**
 * Recursively add a geometry to a tile
 * @function _recursiveAddGeometryToTile
 * @memberof VectorRenderer.prototype
 * @param {Bucket} bucket Bucket
 * @param geometry
 * @param {Tile} tile Tile
 * @private
*/
VectorRenderer.prototype._recursiveAddGeometryToTile = function(bucket, geometry, tile)
{
	var renderable = this._addGeometryToTile(bucket, geometry, tile);

	if ( renderable && renderable.generateChild && tile.children)
	{
		for ( var i = 0; i < 4; i++ )
		{
			if ( tile.children[i].state === Tile.State.LOADED )
			{
				renderable.hasChildren = true;
				this._recursiveAddGeometryToTile( bucket, geometry, tile.children[i] );
			}
		}
	}
};

/**************************************************************************************************************/

/**
 * Add a geometry to a vector renderer
 * @function addGeometry
 * @memberof VectorRenderer.prototype
 * @param layer
 * @param geometry
 * @param style
 */
VectorRenderer.prototype.addGeometry = function(layer, geometry, style)
{
	var bucket = this.getOrCreateBucket(layer, geometry, style);
	geometry._bucket = bucket;

	var tileIndices = this.maxTilePerGeometry > 0 ? this.tileManager.tiling.getOverlappedLevelZeroTiles(geometry) : null;
	if ( tileIndices && tileIndices.length < this.maxTilePerGeometry )
	{
		// Add geometry to each tile in range
		for ( var i=0; i < tileIndices.length; i++ )
		{
			var tile = this.tileManager.level0Tiles[ tileIndices[i] ];
			if ( tile && (tile.state === Tile.State.LOADED) )
			{
				this._recursiveAddGeometryToTile(bucket, geometry, tile);
			}
		}

		geometry._tileIndices = tileIndices;
		this.levelZeroTiledGeometries.push(geometry);
	}
	else
	{
		// Attach to mainRenderable
		if (!bucket.mainRenderable)
		{
			bucket.mainRenderable = bucket.createRenderable();
		}
		bucket.mainRenderable.add(geometry);
	}
};

/**************************************************************************************************************/

/**
 * Remove a geometry from a vector renderer
 * @function removeGeometry
 * @memberof VectorRenderer.prototype
 * @param geometry
 */
VectorRenderer.prototype.removeGeometry = function(geometry)
{
	var tileIndices = geometry._tileIndices;

	if ( tileIndices )
	{
		// Remove from tile
		for ( var i = 0; i < tileIndices.length; i++ )
		{
			var tile = this.tileManager.level0Tiles[ tileIndices[i] ];
			this.removeGeometryFromTile(geometry, tile);
		}
		// Remove from geometry arrays
		this.levelZeroTiledGeometries.splice( this.levelZeroTiledGeometries.indexOf(geometry), 1 );

		 geometry._tileIndices = null;
	}
	else
	{
		var bucket = geometry._bucket;
		if ( bucket.mainRenderable )
		{
			var numGeometries = bucket.mainRenderable.remove(geometry);
			if ( numGeometries === 0 )
			{
				bucket.mainRenderable.dispose(this.renderContext);
				bucket.mainRenderable = null;
			}
		}
	}
};

/**************************************************************************************************************/

/**
 * Get or create a bucket for the given configuration
 * @function getOrCreateBucket
 * @memberof VectorRenderer.prototype
 * @param layer
 * @param geometry
 * @param style
 * @return {Bucket} Bucket
 */
VectorRenderer.prototype.getOrCreateBucket = function(layer, geometry, style )
{
	// Then find an existing bucket
	var bucket = this.findBucket(layer,style);
	if (!bucket)
	{
		bucket = this.createBucket(layer,style);
		bucket.renderer = this;
		bucket.id = this.planet.vectorRendererManager.bucketId++;
		this.buckets.push( bucket );
	}
	return bucket;
};

/**************************************************************************************************************/

/**
 * Add a geometry to a tile
 * @function addGeometryToTile
 * @memberof VectorRenderer.prototype
 * @param layer
 * @param geometry
 * @param style
 * @param {Tile} tile Tile
 */
VectorRenderer.prototype.addGeometryToTile = function(layer, geometry, style, tile)
{
	var bucket = this.getOrCreateBucket(layer, geometry, style);
	geometry._bucket = bucket;
	return this._addGeometryToTile( bucket, geometry, tile );
};

/**************************************************************************************************************/

/**
 * Internal method to add a geometry to a tile
 * @function _addGeometryToTile
 * @memberof VectorRenderer.prototype
 * @param {Bucket} bucket Bucket
 * @param geometry
 * @param {Tile} tile Tile
 * @private
 */
VectorRenderer.prototype._addGeometryToTile = function(bucket, geometry, tile)
{
	var tileData = tile.extension.renderer;
	if (!tileData)
	{
		tileData = tile.extension.renderer = new RendererTileData(this.planet.vectorRendererManager);
	}

	var renderable = tileData.getRenderable(bucket);
	var needsToAdd = false;
	if (!renderable)
	{
		renderable = bucket.createRenderable();
		needsToAdd = true;
	}
	if ( renderable.add(geometry, tile) )
	{
		if (needsToAdd)
		{
			tileData.renderables.push(renderable);
		}
		return renderable;
	}

	return null;
};

/**************************************************************************************************************/

/**
 * Remove a geometry from a tile
 * @function removeGeometryFromTile
 * @memberof VectorRenderer.prototype
 * @param geometry
 * @param {Tile} tile Tile
 */
VectorRenderer.prototype.removeGeometryFromTile = function(geometry,tile)
{
	var tileData = null;
	if (tile && tile.extension) {
		tileData = tile.extension.renderer;
	}
	if (tileData)
	{
		var i = 0;
		while ( i < tileData.renderables.length )
		{
			var renderable = tileData.renderables[i];
			var renderer = renderable.bucket.renderer;
			if ( renderer === this )
			{
				// Remove renderable
				var numGeometries = renderable.remove(geometry);
				if ( numGeometries === 0 )
				{
					tileData.renderables.splice(i,1);
				}
				else
				{
					i++;
				}

				// Remove geoemtry from children if needed
				if ( renderable.hasChildren && tile.children)
				{
					for ( var n = 0; n < 4; n++ )
					{
						if ( tile.children[n].state === Tile.State.LOADED )
						{
							this.removeGeometryFromTile( geometry, tile.children[n] );
						}
					}
				}
			}
			else
			{
				i++;
			}
		}
	}
};

/**************************************************************************************************************/

return VectorRenderer;

});
