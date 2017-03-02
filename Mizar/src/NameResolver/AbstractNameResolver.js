/**
 *    Abstract class for Layer Wrapper
 *    Implemented by Concrete transformers in order to transform opensearch request in owner request
 */
define(["jquery", "underscore-min"],
    function ($, _) {

        /**************************************************************************************************************/

        /**
         @name AtmosphAbstractNameResolverereLayer
         @class
         Abstract Wrapper constructor
         @param options Configuration properties
         */
        var AbstractNameResolver = function (options) {
            this.options = options;
        };

        /**************************************************************************************************************/

        /**
         * Code to execute when init
         * @function init
         * @memberof AbstractNameResolver.prototype
         */
        AbstractNameResolver.prototype.init = function () {
        };

        /**
         * Code to execute when remove
         * @function remove
         * @memberof AbstractNameResolver.prototype
         */
        AbstractNameResolver.prototype.remove = function () {
        };

        /**
         * Convert returned data from service into intelligible data for Mizar (output transformer)
         * @function handle
         * @memberof AbstractNameResolver.prototype
         */
        AbstractNameResolver.prototype.handle = function () {
        };

        /**************************************************************************************************************/

        return AbstractNameResolver;
    });
