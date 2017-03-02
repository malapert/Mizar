define(function () {

    var Utils = {};

    /**
     * Inherits from an object
     */
    Utils.inherits = function (base, sub) {
        function tempCtor() {
        }

        tempCtor.prototype = base.prototype;
        sub.prototype = new tempCtor();
        sub.prototype.constructor = sub;
    };

    return Utils;

});
