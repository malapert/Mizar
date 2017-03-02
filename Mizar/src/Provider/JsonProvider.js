/**
 *    JSON provider module
 *
 *    Module providing JSON file in GeoJSON format from equatorial
 *
 */
define(["jquery", "./AbstractProvider", "../Layer/LayerManager", "../Parser/JsonProcessor", "../Utils/Utils"],
    function ($, AbstractProvider, LayerManager, JsonProcessor, Utils) {

        var self;

         /**
          * @name JsonProvider
          * @class
          *   JsonProvider context constructor
          * @param {object} options
          * @augments AbstractProvider
          * @constructor
          */
        var JsonProvider = function (options) {
            AbstractProvider.prototype.constructor.call(this, options);
            self = this;
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractProvider, JsonProvider);

        /**************************************************************************************************************/

        /**
         * Load JSON file and call handleFeatures
         * @function loadFiles
         * @memberof JsonProvider.prototype
         * @param mizarLayer Mizar layer
         * @param configuration Url to JSON containing feature collection in equatorial coordinates
         */
        JsonProvider.prototype.loadFiles = function (mizarLayer, configuration) {
            $.ajax({
                type: "GET",
                url: configuration.url,
                success: function (response) {
                    self.handleFeatures(mizarLayer, response);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.error(xhr.responseText);
                }
            });
        };

        /**************************************************************************************************************/

        /**
         * Transform response into GeoJSON format and add to the layer
         * @function handleFeatures
         * @memberof JsonProvider.prototype
         * @param {object} mizarLayer
         * @param {object} response
         */
        JsonProvider.prototype.handleFeatures = function (mizarLayer, response) {
            JsonProcessor.handleFeatureCollection(mizarLayer, response);
            mizarLayer.addFeatureCollection(response);
        }

        /***************************************************************************************************/

        return JsonProvider;
    });
