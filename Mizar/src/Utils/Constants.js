define(function () {
    /**
     @name Constants
     @class
         Constants class
     @constructor
    */
    var Constants = function () {
    };

    Constants.ANIMATION = {
          "Inertia"     : "Inertia",
          "Interpolated": "Interpolated",
          "Path"        : "Path",
          "Segmented"   : "Segmented"
    };


    Constants.CONTEXT = {
          "Planet" : "Planet",
          "Sky"    : "Sky"
    };

    Constants.LAYER =  {
          "WMS"           :"WMS",
          "WMTS"          :"WMTS",
          "WMSElevation"  :"WMSElevation",
          "WCSElevation"  :"WCSElevation",
          "Vector"        :"Vector",
          "Atmosphere"    :"Atmosphere",
          "Bing"          :"Bing",
          "GroundOverlay" :"GroundOverlay",
          "OSM"           :"OSM",
          "TileWireframe" :"TileWireframe",
          "CoordinateGrid":"CoordinateGrid",
          "HipsFits"      :"HipsFits",
          "Hips"          :"Hips",
          "Moc"           :"Moc",
          "OpenSearch"    :"OpenSearch",
          "Planet"        :"Planet"
    };

    Constants.PROJECTION = {
          "Aitoff"    : "Aitoff",
          "August"    : "August",
          "Mercator"  : "Mercator",
          "Mollweide" : "Mollweide",
          "Plate"     : "Plate",
          "Azimuth"   : "Azimuth"
   };

    Constants.GEOIDE = {
      "Ecliptic"          : "Ecliptic",
      "Equatorial"        : "Equatorial",
      "Galactic"          : "Galactic",
      "SuperGalactic"     : "SuperGalactic",
      "ICRS"              : "ICRS",
      "WGS84"             : "WGS84",
      "Mars_2000_IAU_IAG" : "Mars_2000_IAU_IAG",
      "Sky"               : "Sky"
    };


    /**************************************************************************************************************/

    return Constants;

});
