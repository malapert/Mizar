define( function() {

/**************************************************************************************************************/
 /**
  @name RendererTileData
  @class
	  RendererTileData constructor
    Contains a list of renderables for the tiles
  @param manager
  @constructor
  */
var RendererTileData = function(manager)
{
	this.manager = manager;
	this.renderables = [];
};

/**************************************************************************************************************/

/**
 * Initialize a child tile
 * @function initChild
 * @memberof RendererTileData.prototype
 * @param childTile
 * @param i
 * @param j
 */
RendererTileData.prototype.initChild = function(childTile,i,j)
{
	var childData;
	for ( var n = 0; n < this.renderables.length; n++ )
	{
		if ( this.renderables[n].initChild )
		{
			var r = this.renderables[n].initChild(i,j,childTile);
			if (r)
			{
				if (!childData) {
					childData = childTile.extension.renderer = new RendererTileData(this.manager);
				}
				childData.renderables.push( r );
			}
		}
	}
};

/**************************************************************************************************************/

/**
 * Traverse the renderer data
 * @function traverse
 * @memberof RendererTileData.prototype
 * @param {Tile} tile Tile
 * @param isLeaf
 */
RendererTileData.prototype.traverse = function(tile,isLeaf)
{
	for ( var i = 0; i < this.renderables.length; i++ )
	{
		var renderable = this.renderables[i];
		var bucket = renderable.bucket;
		if ( bucket.layer._visible && bucket.layer._opacity > 0 )
		{
			if ( renderable.traverse )
			{
				renderable.traverse( this.manager, tile, isLeaf  );
			}
			else
			{
				if ( renderable.hasChildren && !isLeaf ) {
					continue;
				}

				this.manager.renderables.push( renderable );
			}
		}
	}
};

/**************************************************************************************************************/

/**
 * Get a renderable from the tile, given the bucket
 * @function getRenderable
 * @memberof RendererTileData.prototype
 * @param {Bucket} bucket Bucket
 * @return Renderable
 */
RendererTileData.prototype.getRenderable = function(bucket)
{
	for ( var i=0; i < this.renderables.length; i++ )
	{
		if ( bucket === this.renderables[i].bucket )
		{
			return this.renderables[i];
		}
	}
	return null;
};

/**************************************************************************************************************/

/**
 * Dispose renderable data from tile
 * @function dispose
 * @memberof RendererTileData.prototype
 * @param renderContext
 * @param tilePool
 */
RendererTileData.prototype.dispose = function(renderContext,tilePool)
{
	for ( var i=0; i < this.renderables.length; i++ )
	{
		this.renderables[i].dispose(renderContext,tilePool);
	}
	this.renderables.length = 0;
};

/**************************************************************************************************************/

return RendererTileData;

});
