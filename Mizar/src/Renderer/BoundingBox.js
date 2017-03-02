define( function() {
	/**
	 @name BoundingBox
	 @class
	  Bounding Box
	 @param {Float[]} min Min corner as 3D point (array of 3 float)
	 @param {Float[]} max Max corner as 3D point (array of 3 float)
	 @constructor
	 */
var BoundingBox = function(min,max)
{
	if (min)
	{
		this.min = vec3.create( min );
	}
	if (max)
	{
		this.max = vec3.create( max );
	}
};

/**
	Extent the bounding box with the given point
	@function extend
	@memberof BoundingBox.prototype
	@param {Float} x Coord x of extent point
	@param {Float} y Coord y of extent point
	@param {Float} z Coord z of extent point
*/
BoundingBox.prototype.extend = function( x, y, z)
{
	if (!this.min)
	{
		this.min = vec3.create();
		this.max = vec3.create();

		this.min[0] = x;
		this.min[1] = y;
		this.min[2] = z;
		this.max[0] = x;
		this.max[1] = y;
		this.max[2] = z;
	}
	else
	{
		if ( x < this.min[0] )
		{
			this.min[0] = x;
		}
		if ( y < this.min[1] )
		{
			this.min[1] = y;
		}
		if ( z < this.min[2] )
		{
			this.min[2] = z;
		}
		if ( x > this.max[0] )
		{
			this.max[0] = x;
		}
		if ( y > this.max[1] )
		{
			this.max[1] = y;
		}
		if ( z > this.max[2] )
		{
			this.max[2] = z;
		}
	}
};
 /**
 	Compute the bounding box from an array of vertices
 	@function compute
 	@memberof BoundingBox.prototype
 	@param {Float[]} vertices All coords as array of multiple of 3 float)
 	@param {Float} length Vertices array length
 	@param {Float} stride Stride (3 by default)
 */
BoundingBox.prototype.compute = function(vertices,length,stride)
{
	if (!this.min)
	{
		this.min = vec3.create();
		this.max = vec3.create();
	}

	this.min[0] = vertices[0];
	this.min[1] = vertices[1];
	this.min[2] = vertices[2];
	this.max[0] = vertices[0];
	this.max[1] = vertices[1];
	this.max[2] = vertices[2];

	var i,j;
	var st = stride || 3;
	var ll = length || vertices.length;

	for (i=st; i < ll; i += st)
	{
		for (j=0; j < 3; j++)
		{
			if ( vertices[i+j] < this.min[j] )
			{
				this.min[j] = vertices[i+j];
			}
			if ( vertices[i+j] > this.max[j] )
			{
				this.max[j] = vertices[i+j];
			}
		}
	}
};

 /**
 	Get the corner of a bounding box
 	@function getCorner
 	@memberof BoundingBox.prototype
 	@param {Float} pos Position
 	@return {?} Corner
 */
BoundingBox.prototype.getCorner = function(pos)
{
	return [ pos&1 ? this.max[0] : this.min[0],
			pos&2 ? this.max[1] : this.min[1],
			pos&4 ? this.max[2] : this.min[2]	];
};

 /**
 	Get the center of a bounding box
 	@function getCenter
 	@memberof BoundingBox.prototype
 	@return {?} Center
 */
BoundingBox.prototype.getCenter = function()
{
	return [ (this.max[0] + this.min[0]) * 0.5,
			(this.max[1] + this.min[1]) * 0.5,
			(this.max[2] + this.min[2]) * 0.5	];
};

 /**
 	Get the radius of a bounding box
 	@function getRadius
 	@memberof BoundingBox.prototype
 	@return {Float} Radius
 */
BoundingBox.prototype.getRadius = function()
{
	var vec = vec3.create();
	vec3.subtract( this.max, this.min, vec);
	return 0.5 * vec3.length(vec);
};

/**************************************************************************************************************/

return BoundingBox;

});
