/**
 *    Abstract class for Layer Wrapper
 *    Implemented by Concrete transformer in order to transform opensearch request in owner request
 */
define(["jquery", "underscore-min", "../Utils/Utils", "./AbstractNameResolver"],
    function ($, _, Utils, AbstractNameResolver) {

        /**************************************************************************************************************/

         /**
          @name CDSNameResolver
          @class
            CDSNameResolver context constructor
          @augments AbstractNameResolver
          @param options Configuration properties
          */
        var CDSNameResolver = function (options) {

            AbstractNameResolver.prototype.constructor.call(this, options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractNameResolver, CDSNameResolver);

        /**************************************************************************************************************/

        /**
         * Convert passed url into an url understandable by the service (input transformer)
         * @function handle
         * @memberof CDSNameResolver.prototype
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
        CDSNameResolver.prototype.handle = function (options) {
            this.options = options;
            var objectName = this.options.objectName;
            var context = this.options.context;
            var onError = this.options.onError;
            var onComplete = this.options.onComplete;
            var onSuccess = this.options.onSuccess;
            var searchLayer = this.options.searchLayer;
            var zoomTo = this.options.zoomTo;

            var url = "http://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oxp/A?" + objectName;
            $.ajax({
                type: "GET",
                url: url,
                dataType: "xml",
                success: function (xmlResponse) {
                    var target = $(xmlResponse).find("Target");

                    var features = [];

                    $(target).find("Resolver").each(function(index) {
                        var resolver = this;
                        var ra = $(resolver).find("jradeg");
                        var dec = $(resolver).find("jdedeg");

                        if(!_.isEmpty(ra.text()) && !_.isEmpty(dec.text())) {
                            ra = parseFloat(ra.text());
                            dec = parseFloat(dec.text());
                            var feature = {};
                            feature.ra=ra;
                            feature.dec=dec;
                            feature.credit = $(resolver).attr('name');
                            features.push(feature);
                        }
                    });

                    var response = {
                        totalResults: features.length,
                        type: "FeatureCollection",
                        features: [
                        ]
                    };

                    _.each(features, function(feature) {
                       response.features.push({
                           type: 'Feature',
                           geometry: {
                               coordinates: [feature.ra, feature.dec],
                               "type": "Point"
                           },
                           "properties": {
                               "crs": {
                                   "type": "name",
                                   "properties": {
                                       "name": "equatorial.ICRS"
                                   }
                               },
                               "identifier": "CDS0",
                               "credits": feature.credit
                           }
                       })
                    });

                    // Check if response contains features
                    if (response.type === "FeatureCollection" && response.features.length > 0) {
                        var firstFeature = response.features[0];
                        var zoomToCallback = function () {
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

        return CDSNameResolver;
    });
