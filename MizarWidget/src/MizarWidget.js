/**
 * Mizar widget
 */
define(["./MizarGlobal","gw/Utils/Event","gw/Utils/Utils"], function (MizarGlobal,Event,Utils) {

  /**
   @name MizarWidget
   @class
   Entry point to manage Mizar Widget.
   @augments Event
   @param div Div to use for the Widget.
   @param userOptions Configuration properties for the Widget.
   */
   var MizarWidget = function (div,options) {
      Event.prototype.constructor.call(this);

      this.mizarGlobal = new MizarGlobal(div,options);
  };

  /**************************************************************************************************************/
  Utils.inherits(Event, MizarWidget);
  /**************************************************************************************************************/

  /**
   * Return the associated instance of MizarGlobal
   * @function getMizarGlobal
   * @memberof MizarWidget.prototype
   * @return MizarGlobal instance of MizarGlobal
   */
     MizarWidget.prototype.getMizarGlobal = function() {
    return this.mizarGlobal;
  };

  window.MizarWidget = MizarWidget;

  return MizarWidget;

});
