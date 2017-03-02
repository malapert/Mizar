define(["jquery", "underscore-min", "../Utils/Utils", "./AbstractNameResolver"],
    function ($, _, Utils, AbstractNameResolver) {
        /**************************************************************************************************************/

         /**
          @name IMCCENameResolver
          @class
            IMCCENameResolver ctx constructor
          @augments AbstractNameResolver
          @param options Configuration properties
          */
        var IMCCENameResolver = function (options) {
            AbstractNameResolver.prototype.constructor.call(this, options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractNameResolver, IMCCENameResolver);

        /**************************************************************************************************************/

        /**
         * Convert passed url into an url understandable by the service (input transformer)
         * @function handle
         * @memberof IMCCENameResolver.prototype
         * @param options Configuration properties for the Planet :
         * <ul>
         * <li>objectName : Searched name</li>
         * <li>onError : Callback function when error</li>
         * <li>onComplete : Callback function when finish</li>
         * <li>onSuccess: Callback function when success</li>
         * <li>searchLayer : Layer where the research is done</li>
         * <li>zoomTo : ZoomTo function</li>
         * </ul>
         */
        IMCCENameResolver.prototype.handle = function (options) {
            this.options = options;
            var objectName = this.options.objectName;
            var onError = this.options.onError;
            var onComplete = this.options.onComplete;
            var onSuccess = this.options.onSuccess;
            var searchLayer = this.options.searchLayer;
            var zoomTo = this.options.zoomTo;
            var features = [];
            var url = "http://vo.imcce.fr/webservices/ssodnet/resolver.php?name=" + objectName +"&mime=json&from=Mizar";
            $.ajax({
                type: "GET",
                url: url,
                dataType: "json",
                success: function (jsonResponse) {

                    function parseResponse(data, features) {
                        _.each(data, function(data) {
                            var ra = data.ra;
                            var dec = data.dec;

                            if(_.isNumber(ra) && _.isNumber(dec)) {
                                ra = parseFloat(ra);
                                dec = parseFloat(dec);
                                var feature = {};
                                feature.ra=ra;
                                feature.dec=dec;
                                feature.credit = "IMCCE";
                                feature.id = data.id;
                                feature.type = data.type;
                                feature.name = data.name;
                                features.push(feature);
                            }
                        });
                    }
                    function createsGeoJsonResponse (features, response) {
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
                                    "identifier": feature.id,
                                    "type": feature.type,
                                    "name":feature.name,
                                    "credits": feature.credits
                                }
                            })
                        });
                    }

                    var data = jsonResponse.data;
                    parseResponse(data, features);
                    var response = {
                        totalResults: features.length,
                        type: "FeatureCollection",
                        features: [
                        ]
                    };
                    createsGeoJsonResponse(features, response);

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
                complete: function (xhr) {
                    if (onComplete) {
                        onComplete(xhr);
                    }
                }
            });
        };

        return IMCCENameResolver;
    });
