define(['./Tile', '../Utils/ImageRequest'], function (Tile, ImageRequest) {
  /**************************************************************************************************************/


    /**************************************************************************************************************/

    /** @constructor
     TileRequest constructor
     */
    var TileRequest = function (tileManager) {
        // Private variables
        var _imageLoaded = false;
        var _elevationLoaded = true;
        var _xhr = new XMLHttpRequest();
        var _imageRequest;

        // Public variables
        this.tile = null;
        this.elevations = null;
        this.image = null;

        var self = this;

        /**
         Handle when elevation is loaded
         */
        var _handleLoadedElevation = function () {
            self.elevations = tileManager.elevationProvider.parseElevations(_xhr.responseText);
            _elevationLoaded = true;

            if (_imageLoaded) {
                tileManager.pendingRequests.splice(tileManager.pendingRequests.indexOf(self), 1);
                tileManager.completedRequests.push(self);
                tileManager.renderContext.requestFrame();
            }
        };

        /**************************************************************************************************************/

        /**
         Handle when loading elevation failed
         */
        var _handleErrorElevation = function () {
            self.elevations = null;
            _elevationLoaded = true;

            if (_imageLoaded) {
                tileManager.pendingRequests.splice(tileManager.pendingRequests.indexOf(self), 1);
                tileManager.completedRequests.push(self);
                tileManager.renderContext.requestFrame();
            }
        };

        // Setup the XHR callback
        _xhr.onreadystatechange = function (e) {
            if (_xhr.readyState === 4) {
                if (_xhr.status === 200) {
                    _handleLoadedElevation();
                }
                else {
                    _handleErrorElevation();
                }
            }
        };


        /**************************************************************************************************************/

        /**
         Handle when image is loaded
         */
        var _handleLoadedImage = function () {
            // The method can be called twice when the image is in the cache (see launch())
            if (!_imageLoaded) {
                _imageLoaded = true;
                if (_elevationLoaded) {
                    // Call post-process function if defined
                    if (tileManager.imageryProvider && tileManager.imageryProvider.handleImage) {
                        tileManager.imageryProvider.handleImage(_imageRequest);
                    }

                    tileManager.pendingRequests.splice(tileManager.pendingRequests.indexOf(self), 1);
                    tileManager.completedRequests.push(self);
                    tileManager.renderContext.requestFrame();
                }
                self.image = _imageRequest.image;
            }
        };

        /**************************************************************************************************************/

        /**
         Handle when loading image failed
         */
        var _handleErrorImage = function () {
            self.tile.state = Tile.State.ERROR;
            tileManager.pendingRequests.splice(tileManager.pendingRequests.indexOf(self), 1);
            tileManager.availableRequests.push(self);
        };

        /**************************************************************************************************************/

        /**
         Abort request
         */
        var _handleAbort = function () {
            self.tile.state = Tile.State.NONE;
            tileManager.pendingRequests.splice(tileManager.pendingRequests.indexOf(self), 1);
            tileManager.availableRequests.push(self);
        };



        /**************************************************************************************************************/

        /**
         Launch the HTTP request for a tile
         */
        this.launch = function (tile) {
            tile.state = Tile.State.LOADING;
            this.tile = tile;
            tileManager.pendingRequests.push(this);

            this.image = null;
            this.elevations = null;

            // Request the elevation if needed
            if (tileManager.elevationProvider) {
                // TODO : handle the elevations coming from cache
                _elevationLoaded = false;
                _xhr.open("GET", tileManager.elevationProvider.getUrl(tile));

                // Set withCredentials property after "open": http://stackoverflow.com/questions/19666809/cors-withcredentials-support-limited?answertab=votes#tab-top
                var useCredentials = tileManager.elevationProvider.crossOrigin === 'use-credentials';
                _xhr.withCredentials = useCredentials;

                _xhr.send();
            }
            else {
                _elevationLoaded = true;
            }

            if (tileManager.imageryProvider) {
                if (!_imageRequest) {
                    _imageRequest = new ImageRequest({
                        successCallback: function () {
                            _handleLoadedImage();
                            if (tileManager.imageryProvider.cache) {
                                tileManager.imageryProvider.cache.storeInCache(self);
                            }
                        },
                        failCallback: _handleErrorImage,
                        abortCallback: _handleAbort
                    });
                }

                // Check if the image isn't already loaded in cache
                var cachedTileRequest;
                if (tileManager.imageryProvider.cache) {
                    cachedTileRequest = cachedTileRequest = tileManager.imageryProvider.cache.getFromCache(tile);
                }

                _imageLoaded = false;
                if (cachedTileRequest) {
                    _imageRequest.image = cachedTileRequest.image;
                    _handleLoadedImage();
                }
                else {
                    // Tile not found in cache or cache isn't activated, send the request
                    _imageRequest.send(tileManager.imageryProvider.getUrl(tile), tileManager.imageryProvider.crossOrigin);
                }

            }
            else {
                _imageLoaded = true;
            }

            // Check if there is nothing to load
            if (!tileManager.imageryProvider && !tileManager.elevationProvider) {
                tileManager.pendingRequests.splice(tileManager.pendingRequests.indexOf(this), 1);
                tileManager.completedRequests.push(this);
            }
        };

        /**************************************************************************************************************/

        /**
         *    Abort launched request
         */
        this.abort = function () {
            if (_imageRequest) {
                _imageRequest.abort();
            }
        };

    };

    /**************************************************************************************************************/

    return TileRequest;

});
