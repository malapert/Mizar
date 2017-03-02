/**
 *    Main class for managing Wrappers, all transformers have to be required here
 */
define(["jquery", "underscore-min", "./DefaultNameResolver", "./CDSNameResolver",  "./DictionaryNameResolver", "./IMCCENameResolver"],
    function ($, _, DefaultNameResolver, CDSNameResolver, DictionaryNameResolver, IMCCENameResolver) {

        /**************************************************************************************************************/

       /**
        @name NameResolverManager
        @class
          NameResolver Manager Constructor
        @augments AbstractNameResolver
        @param options Configuration properties
       */
        var NameResolverManager = function (options) {

        };

        return NameResolverManager;
    });
