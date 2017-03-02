/**
 *    Abstract class for Layer Wrapper
 *    Implemented by Concrete transformer in order to transform opensearch request in owner request
 */
define(["jquery", "underscore-min", "../Utils/Utils", "./AbstractNameResolver"],
    function ($, _, Utils, AbstractNameResolver) {

        /**************************************************************************************************************/

         /**
          @name DefaultNameResolver
          @class
            DefaultNameResolver context constructor
          @augments AbstractNameResolver
          @param options Configuration properties
          */
        var DefaultNameResolver = function (options) {
            AbstractNameResolver.prototype.constructor.call(this, options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractNameResolver, DefaultNameResolver);

        /**************************************************************************************************************/

        /**
         * Convert passed url into an url understandable by the service (input transformer)
         * @function handle
         * @memberof DefaultNameResolver.prototype
         * @param options Configuration properties for the Planet :
         * <ul>
         * <li>objectName : Searched name</li>
         * <li>context : Context of research</li>
         * <li>onError : Callback function when error</li>
         * <li>onComplete : Callback function when finish</li>
         * <li>onSuccess: Callback function when success</li>
         * <li>searchLayer : Layer where the research is done</li>
         * <li>zoomTo : ZoomTo function</li>
         * </ul>
         */
        DefaultNameResolver.prototype.handle = function (options) {
            this.options = options;
            var objectName = this.options.objectName;
            var context = this.options.context;
            var onError = this.options.onError;
            var onComplete = this.options.onComplete;
            var onSuccess = this.options.onSuccess;
            var searchLayer = this.options.searchLayer;
            var zoomTo = this.options.zoomTo;

            var url = context.configuration.nameResolver.baseUrl + "/" + objectName + "/EQUATORIAL";
            $.ajax({
                type: "GET",
                url: url,
                success: function (response) {
                    // Check if response contains features
                    if (response.type === "FeatureCollection") {
                        var firstFeature = response.features[0];
                        var zoomToCallback = function() {
                            searchLayer(objectName, onSuccess, onError, response);
                        };
                        zoomTo(firstFeature.geometry.coordinates[0], firstFeature.geometry.coordinates[1], zoomToCallback, response);

                    } else {
                        onError();
                    }
                },
                error: function (xhr) {
                    searchLayer(objectName, onSuccess, onError);
                    console.error(xhr.responseText);
                },
                complete: function (xhr, textStatus) {
                    if (onComplete) {
                        onComplete(xhr);
                    }
                }
            });
        };

        /**************************************************************************************************************/

        return DefaultNameResolver;

    });
