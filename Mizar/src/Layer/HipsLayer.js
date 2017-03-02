define(['../Utils/Utils', '../Tiling/HEALPixTiling', './RasterLayer'],
    function (Utils, HEALPixTiling, RasterLayer) {

        /**************************************************************************************************************/

        /**
         @name HipsLayer
         @class
         This layer draws an Hips Image
         @augments RasterLayer
         @param options Configuration properties for the layer. See {@link RasterLayer} for base properties :
         <ul>
         <li>tilePixelSize : size in pixel of a tile (512 by default)
         <li>baseLevel : base level of  tiling (2 by default)
         <li>numberOfLevels : number of levels (10 by default)
         <li>baseUrl : base URL
         <li>format : format (jpg by default)
         <li>coordSystem : coordinate system (EQ by default)
         </ul>
         */
        var HipsLayer = function (options) {
            RasterLayer.prototype.constructor.call(this, options);

            this.tilePixelSize = options.tilePixelSize || 512;
            this.tiling = new HEALPixTiling(options.baseLevel || 2, options);
            this.numberOfLevels = options.numberOfLevels || 10;
            this.type = "ImageryRaster";
            this.baseUrl = options.baseUrl;
            this.format = options.format || "jpg";
            this.coordSystem = options.coordSystem || "EQ";

            // allsky
            this.levelZeroImage = new Image();
            var self = this;
            this.levelZeroImage.crossOrigin = '';
            this.levelZeroImage.onload = function () {
                self._ready = true;

                // Call callback if set
                if (options.onready && options.onready instanceof Function) {
                    options.onready(self);
                }

                // Request a frame
                if (self.planet) {
                    self.planet.renderContext.requestFrame();
                }
            };
            this.levelZeroImage.onerror = function (event) {
                self.planet.publish("baseLayersError", self);
                self._ready = false;

                console.log("Cannot load " + self.levelZeroImage.src);
            };

            this._ready = false;
        };

        /**************************************************************************************************************/

        Utils.inherits(RasterLayer, HipsLayer);

        /**************************************************************************************************************/

        /**
         * Attach the raster layer to the planet
         * @function _attach
         * @memberof HipsLayer.prototype
         * @param g Planet
         * @private
         */
        HipsLayer.prototype._attach = function (g) {
            RasterLayer.prototype._attach.call(this, g);

            // Load level zero image now, only for background
            if (!this._overlay) {
                this.levelZeroImage.src = this.baseUrl + "/Norder3/Allsky." + this.format;
            }
        };

        /**************************************************************************************************************/

        /**
         * Get url from a given tile
         * @function getUrl
         * @memberof HipsLayer.prototype
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        HipsLayer.prototype.getUrl = function (tile) {
            var url = this.baseUrl;

            url += "/Norder";
            url += tile.order;

            url += "/Dir";
            var indexDirectory = Math.floor(tile.pixelIndex / 10000) * 10000;
            url += indexDirectory;

            url += "/Npix";
            url += tile.pixelIndex;
            url += "." + this.format;

            return url;
        };


        /**************************************************************************************************************/

        /**
         * Generate the level0 texture for the tiles
         * @function generateLevel0Textures
         * @memberof HipsLayer.prototype
         * @param {} tiles
         * @param {} tilePool
         */
        HipsLayer.prototype.generateLevel0Textures = function (tiles, tilePool) {
            // Create a canvas to build the texture
            var canvas = document.createElement("canvas");
            canvas.width = 128;
            canvas.height = 128;
            var i,pi,sx,sy,tile;
            var context = canvas.getContext("2d");

            for (i = 0; i < tiles.length; i++) {
                tile = tiles[i];

                // Top left
                pi = tile.pixelIndex * 4;
                sx = ( pi % 27) * 64;
                sy = ( Math.floor(pi / 27) ) * 64;
                context.drawImage(this.levelZeroImage, sx, sy, 64, 64, 0, 0, 64, 64);

                // Top right
                pi = tile.pixelIndex * 4 + 2;
                sx = ( pi % 27) * 64;
                sy = ( Math.floor(pi / 27) ) * 64;
                context.drawImage(this.levelZeroImage, sx, sy, 64, 64, 64, 0, 64, 64);

                // Bottom left
                pi = tile.pixelIndex * 4 + 1;
                sx = ( pi % 27) * 64;
                sy = ( Math.floor(pi / 27) ) * 64;
                context.drawImage(this.levelZeroImage, sx, sy, 64, 64, 0, 64, 64, 64);

                // Bottom right
                pi = tile.pixelIndex * 4 + 3;
                sx = ( pi % 27) * 64;
                sy = ( Math.floor(pi / 27) ) * 64;
                context.drawImage(this.levelZeroImage, sx, sy, 64, 64, 64, 64, 64, 64);

                var imgData = context.getImageData(0, 0, 128, 128);
                imgData.dataType = 'byte';

                tile.texture = tilePool.createGLTexture(imgData);
                tile.imageSize = 128;
            }
        };

        /**************************************************************************************************************/

        return HipsLayer;

    });
