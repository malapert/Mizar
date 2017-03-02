define(function () {
  /**
    @name AttributionHandler
    @class
    Manage the attributions
    @param {Globe} globe Globe
    @param options Configuration properties
    <ul>
    <li>element : the HTML element to show attributions, can be a string (the ID) or the DOM element itself</li>
    </ul>
  */
    var AttributionHandler = function (globe, options) {

		// Search for the element to use
        var elt = options ? options.element : undefined;
        if (elt) {
            if (typeof elt === "string") {
                this.element = document.getElementById(elt);
            }
            else {
                this.element = elt;
            }
        }

		// Only add the attribution handler to the globe if element is not null
		if (this.element) {
			 globe.attributionHandler = this;
		}
    };

     /**
      * Remove attribution from HTML
      * @function removeAttribution
      * @memberof AttributionHandler.prototype
      * @param {BaseLayer} layer Layer
      */
    AttributionHandler.prototype.removeAttribution = function (layer) {
        var div = document.getElementById(this.element.id + "_" + layer.id);
        if (div) {
            this.element.removeChild(div);
        }
    };

     /**
      * Add attribution in HTML
      * @function addAttribution
      * @memberof AttributionHandler.prototype
      * @param {BaseLayer} layer Layer
      */
    AttributionHandler.prototype.addAttribution = function (layer) {
        var div = document.createElement('div');

        var attribution;
        var title = (layer.ack !== undefined) ? layer.ack : "";
        if (layer.copyrightUrl !== "" && layer.copyrightUrl !== undefined) {
            attribution = '<a class="whiteLink" href="' + layer.copyrightUrl  + '" target="_blank" title="'+ title +'">' + layer.attribution + '</a>';
        } else {
            attribution = layer.attribution;
        }

        div.innerHTML = attribution;
        div.id = this.element.id + "_" + layer.id;

        if (layer.id === 0) {
            // Background layer
            this.element.insertBefore(div, this.element.firstChild);
        }
        else {
            this.element.appendChild(div);
        }
    };

     /**
      * Toggle attribution
      * @function toggleAttribution
      * @memberof AttributionHandler.prototype
      * @param {BaseLayer} layer Layer
      */
    AttributionHandler.prototype.toggleAttribution = function (layer) {
        var div = document.getElementById(this.element.id + "_" + layer.id);
        if (div) {
            this.removeAttribution(layer);
        }
        else {
            this.addAttribution(layer);
        }
    };

    /**************************************************************************************************************/

    return AttributionHandler;

});
