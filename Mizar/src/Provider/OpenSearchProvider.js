/**
 *    OpenSearch provider module
 *
 *    Module providing JSON file in GeoJSON format from OpenSearch response
 */
define(["jquery", "./AbstractProvider", "../Layer/LayerManager", "../Parser/JsonProcessor"],
    function ($, AbstractProvider, LayerManager, JsonProcessor) {

        var self;

         /**
          * @name OpenSearchProvider
          * @class
          *   OpenSearchProvider context constructor
          * @param {object} options
          * @augments AbstractProvider
          * @constructor
          */
        var OpenSearchProvider = function (options) {
            self = this;
            AbstractProvider.prototype.constructor.call(this, options);
        };

        /***************************************************************************************************/

        /**
         * Load JSON file and call handleFeatures
         * @function loadFiles
         * @memberof OpenSearchProvider.prototype
         * @param mizarLayer Mizar layer
         * @param configuration Url to JSON containing feature collection in equatorial coordinates
         */
        OpenSearchProvider.prototype.loadFiles = function (mizarLayer, configuration, startIndex) {
            $.ajax({
                type: "GET",
                url: configuration.url + "startIndex=" + startIndex + "&count=500",
                success: function (response) {
                    self.handleFeatures(mizarLayer, configuration, startIndex, response)
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.error(xhr.responseText);
                }
            });
        };

        /***************************************************************************************************/

        /**
         * Transform response into GeoJSON format and add to the layer
         * @function handleFeatures
         * @memberof OpenSearchProvider.prototype
         * @param {object} mizarLayer
         * @param {object} response
         */
        OpenSearchProvider.prototype.handleFeatures = function (mizarLayer, configuration, startIndex, response) {
            JsonProcessor.handleFeatureCollection(mizarLayer, response);
            mizarLayer.addFeatureCollection(response);
            if (startIndex + response.features.length < response.totalResults) {
                self.loadFiles(mizarLayer, configuration.url, startIndex + response.features.length);
            }
        };

        /***************************************************************************************************/

        return OpenSearchProvider;

    });
