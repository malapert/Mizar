 define( function() {

/**************************************************************************************************************/

 /**
  @name GeoBound
  @class
   Geo Bound
  @param {Float} w West
  @param {Float} s South
  @param {Float} e East
  @param {Float} n North
  @constructor
  */
var GeoBound = function( w, s, e, n )
{
	this.south = s;
	this.west = w;
	this.north = n;
	this.east = e;
};

 /**
 	Get geo center
 	@function getCenter
 	@memberof GeoBound.prototype
 	@return {Float[]} Geo center as array of 2 float
 */
GeoBound.prototype.getCenter = function()
{
	return [ (this.east+this.west)*0.5, (this.south+this.north)*0.5, 0.0 ];
};

/**************************************************************************************************************/

/**
 Get North
 @function getNorth
 @memberof GeoBound.prototype
 @return {Float} North
*/
GeoBound.prototype.getNorth = function()
{
	return this.north;
};

/**
 Get South
 @function getSouth
 @memberof GeoBound.prototype
 @return {Float} South
*/
GeoBound.prototype.getSouth = function()
{
	return this.south;
};

 /**
  Get West
  @function getWest
  @memberof GeoBound.prototype
  @return {Float} West
 */
GeoBound.prototype.getWest = function()
{
	return this.west;
};

 /**
  Get East
  @function getEast
  @memberof GeoBound.prototype
  @return {Float} East
 */
GeoBound.prototype.getEast = function()
{
	return this.east;
};

 /**
  Compute the geo bound from coordinates
  @function computeFromCoordinates
  @memberof GeoBound.prototype
  @param {Float[][]} coordinates Coordinates as bi-dimensionnal array of float
 */
GeoBound.prototype.computeFromCoordinates = function( coordinates )
{
	this.west = coordinates[0][0];
	this.east = coordinates[0][0];
	this.south = coordinates[0][1];
	this.north = coordinates[0][1];

	for ( var i = 1; i < coordinates.length; i++ )
	{
		this.west = Math.min( this.west, coordinates[i][0] );
		this.east = Math.max( this.east, coordinates[i][0] );
		this.south = Math.min( this.south, coordinates[i][1] );
		this.north = Math.max( this.north, coordinates[i][1] );
	}
};

 /**
  Check if a point is inside the given bound
  @function isPointInside
  @memberof GeoBound.prototype
  @param {Array} point The point
  @return {Boolean} return the test
 */
GeoBound.prototype.isPointInside = function( point )
{
	return point[0] >= this.west  && point[0] <= this.east && point[1] >= this.south  && point[1] <= this.north;
};

 /**
  Intersects this geo bound with another one
  @function intersects
  @memberof GeoBound.prototype
  @param {GeoBound} geoBound Geo bound
  @return {Boolean} Intersects ?
 */
GeoBound.prototype.intersects = function( geoBound )
{
	if ( this.west >= geoBound.east || this.east <= geoBound.west ) {
		return false;
  }

	if ( this.south >= geoBound.north || this.north <= geoBound.south ) {
		return false;
  }

	return true;
};

 /**
  Intersects this geo bound with GeoJSON geometry
  @function intersectsGeometry
  @memberof GeoBound.prototype
  @param {JSON} geometry GeoJSON geometry
  @return {Boolean} Intersects ?
 */
GeoBound.prototype.intersectsGeometry = function( geometry )
{
	var isIntersected = false;
  var i,j;
	var geoBound = new GeoBound();
	var coords = geometry.coordinates;
	switch (geometry.type)
	{
		case "LineString":
			geoBound.computeFromCoordinates( coords );
			isIntersected |= this.intersects(geoBound);
			break;
		case "Polygon":
			// Don't take care about holes
			for (i = 0; i < coords.length && !isIntersected; i++ )
			{
				geoBound.computeFromCoordinates( coords[i] );
				isIntersected |= this.intersects(geoBound);
			}
			break;
		case "MultiLineString":
			for (i = 0; i < coords.length && !isIntersected; i++ )
			{
				geoBound.computeFromCoordinates( coords[i] );
				isIntersected |= this.intersects(geoBound);
			}
			break;
		case "MultiPolygon":
			for (i = 0; i < coords.length && !isIntersected; i++ )
			{
				for (j = 0; j < coords[i].length && !isIntersected; j++ )
				{
					geoBound.computeFromCoordinates( coords[i][j] );
					isIntersected |= this.intersects(geoBound);
				}
			}
			break;
	}
	return isIntersected;
};

/**************************************************************************************************************/

return GeoBound;

});
