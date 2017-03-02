define([], function () {

    /**
     *    @constructor
     *    ImageRequest constructor
     */
    var ImageRequest = function (options) {
        this.successCallback = options.successCallback;
        this.failCallback = options.failCallback;
        this.abortCallback = options.abortCallback;
        this.image = null;
    };

    /**************************************************************************************************************/

    /**
     *    Send image request
     */
    ImageRequest.prototype.send = function (url, crossOrigin) {
        this.image = new Image();
        this.image.crossOrigin = crossOrigin;
        this.image.dataType = "byte";

        var self = this;
        this.image.onload = function () {
            var isComplete = self.image.naturalWidth !== 0 && self.image.complete;
            if (isComplete) {
                self.successCallback.call(self);
            }
        };
        this.image.onerror = this.failCallback.bind(this);
        this.image.src = url;
    };

    /**************************************************************************************************************/

    /**
     *    Abort image request
     */
    ImageRequest.prototype.abort = function () {
        if (this.abortCallback) {
            this.abortCallback(this);
        }
        this.image.src = '';
    };

    /**************************************************************************************************************/

    return ImageRequest;

});
