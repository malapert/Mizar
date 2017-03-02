/*global define: false */

define(["fits"], function () {

    /**
     *    Parse fits file
     *
     *    @param response XHR response containing fits
     *
     *    @return Parsed data
     */
    function parseFits(response) {
        var FITS = astro.FITS;
        // Initialize the FITS.File object using
        // the array buffer returned from the XHR
        var fits = new FITS.File(response);
        // Grab the first HDU with a data unit
        var hdu = fits.getHDU();
        var data = hdu.data;

        var uintPixels;
        var swapPixels = new Uint8Array(data.view.buffer, data.begin, data.length); // with gl.UNSIGNED_byte

        var bpe;
        if (data.arrayType) {
            bpe = data.arrayType.BYTES_PER_ELEMENT;
        } else {
            bpe = Math.abs(hdu.header.BITPIX) / 8;
        }
        for (var i = 0; i < swapPixels.length; i += bpe) {
            var temp;
            // Swap to little-endian
            for (var j = 0; j < bpe / 2; j++) {
                temp = swapPixels[i + j];
                swapPixels[i + j] = swapPixels[i + bpe - 1 - j];
                swapPixels[i + bpe - 1 - j] = temp;
            }
        }

        return fits;
    }

    var loadFits = function (url, successCallback, failCallback, onprogressCallback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (xhr.response) {
                        var fits = parseFits(xhr.response);
                        if (successCallback) {
                            successCallback(fits);
                        }
                    }
                }
                else {
                    console.log("Error while loading " + url);
                    if (failCallback) {
                        failCallback();
                    }
                }
            }
        };


        // Define default on progress function, otherwise
        // Firefox won't take Content-length header into account
        // so evt.lengthComputable will be always set to false..
        xhr.onprogress = function (evt) {
        };
        xhr.open("GET", url);
        xhr.responseType = 'arraybuffer';
        xhr.send();
        return xhr;
    };

    return {
        loadFits: loadFits,
        parseFits: parseFits
    };

});
