define(["./Renderer/FeatureStyle" ],
    function (FeatureStyle
    ) {

    /**
     @name DrawingFactory
     @class
     Drawing Factory
    */
    var DrawingFactory = function () {
    };

    /**
     Create and get a FeatureStyle
     @function createFeatureStyle
     @memberof DrawingFactory.prototype
     @param {JSON} options Configuration properties for the Feature style. See {@link FeatureStyle} for properties
     @return {FeatureStyle} FeatureStyle Object
    */
    DrawingFactory.prototype.createFeatureStyle = function (options) {
        return new FeatureStyle(options);
    };

    /**
     Convert a color from a string to RGB
     @function fromStringToColor
     @memberof DrawingFactory.prototype
     @param {String} color_string Color string
     @return {Float[]} array with [r,g,b,alpha]
    */
    DrawingFactory.prototype.fromStringToColor = function(color_string)
    {
        return FeatureStyle.fromStringToColor(color_string);
    };

    /**************************************************************************************************************/

    return DrawingFactory;

});
