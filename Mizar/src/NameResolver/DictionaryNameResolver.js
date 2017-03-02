/**
 *    Abstract class for Layer Wrapper
 *    Implemented by Concrete transformer in order to transform opensearch request in owner request
 */
define(["jquery", "underscore-min", "../Utils/Utils", "./AbstractNameResolver","../Layer/VectorLayer", "../Renderer/FeatureStyle"],
    function ($, _, Utils, AbstractNameResolver, VectorLayer, FeatureStyle) {

      var dictionary;
      var context;
      var nameResolverLayer;

      /**
       * In case if base url isn't a service but a json containing all known places
       * this method allows to retrieve it
       */
      var retrieveDictionary = function (context) {
          var containsDictionary = context.configuration.nameResolver.baseUrl.indexOf("json") >= 0;
          if (containsDictionary) {
              // Dictionary as json
              var marsResolverUrl = context.configuration.nameResolver.baseUrl;//.replace('mizar_gui', 'mizar_lite');
              $.ajax({
                  type: "GET",
                  dataType : "json",
                  url: marsResolverUrl,
                  success: function (response) {
                      dictionary = response;
                      nameResolverLayer = new VectorLayer();
                      for (var i = 0; i < response.features.length; i++) {
                          var feature = response.features[i];
                          feature.properties.style = new FeatureStyle({
                              label: feature.properties.Name,
                              fillColor: [1, 0.7, 0, 1]
                          });
                      }
                      nameResolverLayer.addFeatureCollection(response);
                      context.planet.addLayer(nameResolverLayer);
                  },
                  error: function (thrownError) {
                      console.error(thrownError);
                  }
              });
          }
          else {
              dictionary = null;
          }
      };

      /**************************************************************************************************************/
         /**
          @name DictionaryNameResolver
          @class
            DefaultNameResolver ctx constructor
          @augments AbstractNameResolver
          @param ctx Configuration properties
          */
        var DictionaryNameResolver = function (ctx) {
            AbstractNameResolver.prototype.constructor.call(this, ctx);
            context = ctx;
            dictionary = retrieveDictionary(ctx);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractNameResolver, DictionaryNameResolver);

        /**
         * Code to execute when remove
         * @function remove
         * @memberof DictionaryNameResolver.prototype
         */
        DictionaryNameResolver.prototype.remove = function () {
            if (nameResolverLayer) {
                context.planet.removeLayer(nameResolverLayer);
                nameResolverLayer = null;
            }
            dictionary = null;
        };

        /**
         * Convert passed url into an url understandable by the service (input transformer)
         * @function handle
         * @memberof DictionaryNameResolver.prototype
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
        DictionaryNameResolver.prototype.handle = function (options) {
            this.options = options;
            var objectName = this.options.objectName;
            var context = this.options.context;
            var onError = this.options.onError;
            var onComplete = this.options.onComplete;
            var onSuccess = this.options.onSuccess;
            var searchLayer = this.options.searchLayer;
            var zoomTo = this.options.zoomTo;

            // Planet resolver(Mars only currently)
            var feature = _.find(dictionary.features, function (f) {
                return f.properties.Name.toLowerCase() === objectName.toLowerCase();
            });

            if (feature) {
                var lon = parseFloat(feature.properties.center_lon);
                var lat = parseFloat(feature.properties.center_lat);
                zoomTo(lon, lat, onSuccess, {features: [feature]});
            }
            else {
                if (onError) {
                    onError();
                }
            }
        };

        return DictionaryNameResolver;
    });
