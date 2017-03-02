/**
 *    Abstract class for provider
 *    Implemented by content providers like ConstellationProvider and StartProvider
 */
define(["jquery"],
    function ($) {

      /**************************************************************************************************************/

      /**
       @name AbstractProvider
       @class
         Abstract Provider constructor
       @param {object} options
      */
        var AbstractProvider = function (options) {
            this.options = options;
        };

        /**************************************************************************************************************/

        /**
         * Load specific file passed from configuration
         * @function loadFiles
         * @memberof AbstractProvider.prototype
         * @param {object} layer
         * @param {object} configuration
         */
        AbstractProvider.prototype.loadFiles = function (layer, configuration) {
        };

        /**************************************************************************************************************/

        /**
         * Process data and add them to the layer
         * @function handleFeatures
         * @memberof AbstractProvider.prototype
         * @param {object} layer
         */
        AbstractProvider.prototype.handleFeatures = function (layer) {
        };

        /**************************************************************************************************************/

        return AbstractProvider;
    });
