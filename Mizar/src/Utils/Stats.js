define(function () {
    /**
     @name Stats
     @class
         Display some rendering statistics in a HTML element
     @param {BaseContext} Context
     @param options Configuration properties for Stats.
     <ul>
     <li>element : the HTML element to receivce statistcs, can be a string (the ID) or the DOM element itself</li>
     <li>verbose : the verbosity of the stats, default is false</li>
     </ul>
     @constructor
    */
    var Stats = function (context, options) {
        this.type = null;
        context.planet.renderContext.stats = this;
        //context.planet.renderContext.stats = this;
        this.context = context;
        var elt = options ? options.element : undefined;
        if (elt) {
            if (typeof elt === "string") {
                this.element = document.getElementById(elt);
                this.type = "dom";
            }
            else {
                this.element = elt;
                this.type = "jquery";
            }
        }



        this.showFPS = this.context.planet.continuousRendering;
        this.verbose = options && options.verbose ? options.verbose : false;
        this.numFrames = 0;

        var self = this;
        window.setInterval(function () {
            self.print();
        }, 1000);
    };

    /**************************************************************************************************************/

    /**
     Start measuring time
     */
    Stats.prototype.start = function (name) {
        this[name] = Date.now();
    };

    /**************************************************************************************************************/

    /**
     End measuring time
     */
    Stats.prototype.end = function (name) {
        var time = Date.now() - this[name];

        var max = this["max_" + name] || -1;
        if (max < time) {
          max = time;
        }

        var sum = this["sum_" + name] || 0;
        sum += time;

        this[name] = time;
        this["max_" + name] = max;
        this["sum_" + name] = sum;
        if (name === "globalRenderTime") {
            this.numFrames++;
        }
    };

    /**************************************************************************************************************/

    /**
     Print stats in an HTML element
     */
    Stats.prototype.print = function () {
        if (this.numFrames > 0) {
            var content = "";

            if (this.showFPS) {
                content += "FPS : " + this.numFrames + "<br>";
            }

            content += "Average render time : " + (this.sum_globalRenderTime / this.numFrames).toFixed(2) + " ms";
            // FIXME: currently count stats for the first renderer in render context
            /*if (this.context.planet.renderContext.renderers[0].getRenderStats) {
                content += "<br>" + this.renderContext.renderers[0].getRenderStats();
            }
            */
            if (this.verbose) {
                content += "<br>Average traverse tiles time : " + (this.sum_traverseTime / this.numFrames).toFixed(2) + " ms";
                content += "<br>Average render tiles time : " + (this.sum_renderTime / this.numFrames).toFixed(2) + " ms";
                content += "<br>Average generate tiles time : " + (this.sum_generateTime / this.numFrames).toFixed(2) + " ms";
                content += "<br>Average request tiles time : " + (this.sum_requestTime / this.numFrames).toFixed(2) + " ms";
                content += "<br>Max render time : " + this.max_globalRenderTime + " ms";
                content += "<br>Max traverse tiles time : " + this.max_traverseTime + " ms";
                content += "<br>Max render tiles time : " + this.max_renderTime + " ms";
                content += "<br>Max generate tiles time : " + this.max_generateTime + " ms";
                content += "<br>Max request tiles time : " + this.max_requestTime + " ms";
            }

            if (this.element) {
              if (this.type === "dom") {
                this.element.innerHTML = content;
              } else if (this.type === "jquery") {
                this.element.html(content);
              }
            }

            this.sum_globalRenderTime = 0;
            this.sum_traverseTime = 0;
            this.sum_renderTime = 0;
            this.sum_generateTime = 0;
            this.sum_requestTime = 0;
            this.max_globalRenderTime = 0;
            this.max_traverseTime = 0;
            this.max_renderTime = 0;
            this.max_generateTime = 0;
            this.max_requestTime = 0;
            this.numFrames = 0;
        }
    };

    /**************************************************************************************************************/

    return Stats;

});
