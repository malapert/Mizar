
define(["jquery", "./BaseLayer", '../Renderer/FeatureStyle', "../Utils/Utils", "../Tiling/HEALPixBase", "./FitsLoader"],
    function ($, BaseLayer, FeatureStyle, Utils, HEALPixBase, FitsLoader) {
        /**
          @name MocLayer
          @class
          This layer draws a MOC data
          @augments RasterLayer
          @param options Configuration properties for the layer. See {@link RasterLayer} for base properties :
          <ul>
          <li>serviceUrl : Url of the service providing the MOC data(necessary option)</li>
          <li>startOrder : Starting order of HEALPix tiling
          </ul>
          */
        var MocLayer = function (options) {

            BaseLayer.prototype.constructor.call(this, options);

            this.serviceUrl = options.serviceUrl;
            this.startOrder = options.startOrder || 2;

            // Set style
            if (options && options.style) {
                this.style = new FeatureStyle(options.style);
            }
            else {
                this.style = new FeatureStyle();
            }

            this.featuresSet = null;
        };

        /**************************************************************************************************************/

        Utils.inherits(BaseLayer, MocLayer);

        /**************************************************************************************************************/

        /**
         * Attach the layer to the planet
         * @function _attach
         * @memberof MocLayer.prototype
         * @param g Planet
         * @private
         */
        MocLayer.prototype._attach = function (g) {
            BaseLayer.prototype._attach.call(this, g);

            var self = this;
            var i;

            if (String(self.serviceUrl).endsWith(".fits")) {
                FitsLoader.loadFits(self.serviceUrl, function (fits) {
                    var healpixMoc = {};
                    var binaryTable = fits.getHDU(1).data;

                    // setting startOrder with first order in dataTable
                    //self.startOrder = uniq2hpix(binaryTable.getRow(0)[binaryTable.columns[0]])[0];

                    for(i = 0; i < binaryTable.rows; i++) {
                        var uniq = binaryTable.getRow(i);
                        var hpix = HEALPixBase.uniq2hpix(uniq[binaryTable.columns[0]]);

                        var order = hpix[0];
                        if (healpixMoc[order] === undefined) {
                            healpixMoc[order] = [];
                        }
                        healpixMoc[order].push(hpix[1]);
                    }
                    // MIZAR CANNOT display MOC with order less than 3, convert the current moc to a moc starting a order 3
                    if(healpixMoc.hasOwnProperty("0") || healpixMoc.hasOwnProperty("1") || healpixMoc.hasOwnProperty("2")) {

                        for(i=0; i<3; i++) {
                            if(healpixMoc.hasOwnProperty(i)) {
                                var pixels = healpixMoc[i];
                                _.each(pixels, function(pixel) {
                                    var pix = HEALPixBase.getChildren(pixel);
                                    if(!healpixMoc.hasOwnProperty(i+1)){
                                        healpixMoc[i+1] = [];
                                    }
                                    healpixMoc[i+1].push(pix[0]);
                                    healpixMoc[i+1].push(pix[1]);
                                    healpixMoc[i+1].push(pix[2]);
                                    healpixMoc[i+1].push(pix[3]);
                                });
                                delete healpixMoc[i];
                            }
                        }
                    }
                    self.moc = healpixMoc;
                    self.handleDistribution(healpixMoc);
                    // TODO : comprendre la ligne suivante
                    // delete fits;
                });

            } else {
                $.ajax({
                    type: "GET",
                    url: self.serviceUrl,
                    dataType: 'json',
                    success: function (response) {
                        self.handleDistribution(response);
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        $('#addLayer_' + self.id).find('label').css("color", "red");
                        console.error(xhr.responseText);
                    }
                });
            }


            // As post renderer, moc layer will regenerate data on tiles in case of base imagery change
            g.tileManager.addPostRenderer(this);
        };

        /**************************************************************************************************************/

        /**
         * Generates moc data on tiles
         * @function generate
         * @memberof MocLayer.prototype
         * @param {Tile} tile Tile
         */
        MocLayer.prototype.generate = function (tile) {
            if (this.featuresSet && tile.order === this.startOrder) {
                var geometries = this.featuresSet[tile.pixelIndex];
                if (geometries) {
                    for (var i = 0; i < geometries.length; i++) {
                        this.planet.vectorRendererManager.addGeometryToTile(this, geometries[i], this.style, tile);
                    }
                }
            }
        };

        /**************************************************************************************************************/

        /**
         * Render
         * @function render
         * @memberof MocLayer.prototype
         */
        MocLayer.prototype.render = function () {
            // No rendering
        };

        /**************************************************************************************************************/

        /**
         * Detach the layer from the planet
         * @function _detach
         * @memberof MocLayer.prototype
         * @private
         */
        MocLayer.prototype._detach = function () {
            for (var tileIndex in this.featuresSet) {
                var tile = this.planet.tileManager.level0Tiles[tileIndex];
                for (var i = 0; i < this.featuresSet[tileIndex].length; i++) {
                    this.planet.vectorRendererManager.removeGeometryFromTile(this.featuresSet[tileIndex][i], tile);
                }
            }
            this.featuresSet = null;
            this.planet.tileManager.removePostRenderer(this);

            BaseLayer.prototype._detach.call(this);
        };

        /**************************************************************************************************************/

        /**
         * Return children indices of starting tiling order
         * @function findChildIndices
         * @memberof MocLayer.prototype
         * @param index Parent index
         * @param order Parent order
         */
        MocLayer.prototype.findChildIndices = function (index, order) {
            var childOrder = this.startOrder;
            var orderDepth = childOrder - order;
            var numSubTiles = Math.pow(4, orderDepth); // Number of subtiles depending on order
            var firstSubTileIndex = index * numSubTiles;
            var indices = [];
            for (var i = firstSubTileIndex; i < firstSubTileIndex + numSubTiles; i++) {
                indices.push(i);
            }

            return indices;
        };

        /**************************************************************************************************************/

        /**
         * Return index of parent of starting tiling order
         * @function findParentIndex
         * @memberof MocLayer.prototype
         * @param index Child index
         * @param order Child order
         */
        MocLayer.prototype.findParentIndex = function (index, order) {
            var parentOrder = this.startOrder;
            var orderDepth = order - parentOrder;
            return Math.floor(index / (Math.pow(4, orderDepth)));
        };

        /**************************************************************************************************************/

        /**
         * Handle MOC response
         * @function handleDistribution
         * @memberof MocLayer.prototype
         * @param response MOC response
         */
        MocLayer.prototype.handleDistribution = function (response) {
            var gl = this.planet.tileManager.renderContext.gl;
            this.featuresSet = {};
            var parentIndex;
            var i,u,v;
            // For each order, compute rectangles geometry depending on the pixel index
            for (var key in response) {
                var order = parseInt(key);
                for (i = 0; i < response[key].length; i++) {
                    var pixelIndex = response[key][i];

                    if (order > this.startOrder) {
                        parentIndex = this.findParentIndex(pixelIndex, order);
                    }
                    else if (order === this.startOrder) {
                        parentIndex = pixelIndex;
                    }
                    else {
                        // Handle low orders(< 3) by creating children polygons of order 3
                        var indices = this.findChildIndices(pixelIndex, order);
                        if (response[this.startOrder.toString()] === undefined) {
                            response[this.startOrder.toString()] = response[0].concat(indices);
                        } else {
                            response[this.startOrder.toString()] = response[this.startOrder.toString()].concat(indices);

                        }
                        continue;
                    }

                    var geometry = {
                        type: "Polygon",
                        gid: "moc" + this.id + "_" + order + "_" + pixelIndex,
                        coordinates: [[]]
                    };

                    // Build the vertices
                    var size = 2; // TODO
                    var step = 1;

                    // Tesselate only low-order tiles
                    if (order < 5) {
                        size = 5;
                        step = 1.0 / (size - 1);
                    }

                    var nside = Math.pow(2, order);
                    var pix = pixelIndex & (nside * nside - 1);
                    var ix = HEALPixBase.compress_bits(pix);
                    var iy = HEALPixBase.compress_bits(pix >>> 1);
                    var face = (pixelIndex >>> (2 * order));

                    var vertice, geo;

                    // Horizontal boudaries
                    for (u = 0; u < 2; u++) {
                        for (v = 0; v < size; v++) {
                            vertice = HEALPixBase.fxyf((ix + u * (size - 1) * step) / nside, (iy + v * step) / nside, face);
                            geo = this.planet.coordinateSystem.from3DToGeo(vertice);
                            if (u === 0) {
                                // Invert to clockwise sense
                                geometry.coordinates[0][2 * u * size + (size - 1) - v] = [geo[0], geo[1]];
                            }
                            else {
                                geometry.coordinates[0][2 * u * size + v] = [geo[0], geo[1]];
                            }
                        }
                    }

                    // Vertical boundaries
                    for (v = 0; v < 2; v++) {
                        for ( u = 0; u < size; u++) {
                            vertice = HEALPixBase.fxyf((ix + u * step) / nside, (iy + v * (size - 1) * step) / nside, face);
                            geo = this.planet.coordinateSystem.from3DToGeo(vertice);
                            if (v === 1) {
                                // Invert to clockwise sense
                                geometry.coordinates[0][size + 2 * v * size + (size - 1) - u] = [geo[0], geo[1]];
                            }
                            else {
                                geometry.coordinates[0][size + 2 * v * size + u] = [geo[0], geo[1]];
                            }
                        }
                    }

                    var parentTile = this.planet.tileManager.level0Tiles[parentIndex];

                    if (!this.featuresSet[parentIndex]) {
                        this.featuresSet[parentIndex] = [];
                    }

                    this.featuresSet[parentIndex].push(geometry);
                    this.planet.vectorRendererManager.addGeometryToTile(this, geometry, this.style, parentTile);
                }
            }
        };

        return MocLayer;
    });
