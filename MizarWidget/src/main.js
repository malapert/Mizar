/*******************************************************************************
 * Copyright 2012-2015 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
 *
 * This file is part of SITools2.
 *
 * SITools2 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * SITools2 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/

/**
 * Configuration for require.js
 */
require.config({
    paths: {

        // Externals requirements
        "jquery":                 "../external/jquery/dist/jquery.min",
        "jquery.ui":              "../external/jquery-ui/jquery-ui.min",
        "jquery.ui.timepicker":   "../external/jquery.ui.timepicker/jquery.ui.timepicker",
        "jquery.once":            "../external/jquery-once/jquery.once.min",
        "underscore-min":         "../external/underscore/underscore",
        "jszip":                  "../external/jszip/jszip.min",
        "saveAs":                 "../external/fileSaver/FileSaver.min",
        "jquery.nicescroll.min":  "../external/jquery.nicescroll/dist/jquery.nicescroll.min",
        "fits":                   "../external/fits",
        "samp":                   "../external/samp",
        "gzip":                   "../external/gzip",
        "crc32":                  "../external/crc32",
        "deflate-js":             "../external/deflate",
        "inflate-js":             "../external/inflate",
        "wcs":                    "../external/wcs",
        "selectize":              "../external/selectizejs/selectize",
        "sifter":                 "../external/selectizejs/sifter",
        "microplugin":            "../external/selectizejs/microplugin",
        "flot":                   "../external/flot/jquery.flot.min",
        "flot.tooltip":           "../external/flot/jquery.flot.tooltip.min",
        "flot.axislabels":        "../external/flot/jquery.flot.axislabels",
        "loadmask":               "../external/loadmask/jquery.loadmask",
        "text" :                  "../node_modules/requirejs-plugins/lib/text",

        // Mizar Core requirements
        "gw"          :   "../../Mizar/src",
        "glMatrix"    :   "../../Mizar/external/glMatrix",
        "name_resolver":  "gw/NameResolver",

        // Mizar_Gui requirements
        "uws":                    "./uws",
        "gui":                    "./gui",
        "service" :               "./service",
        "MizarWidgetGui":         "./MizarWidgetGui",
        "provider":               "./provider",
        "tracker" :               "./gui/tracker",
        "reverse_name_resolver":  "./reverse_name_resolver",
        "templates":              "../templates",
        "data":                   "../data",
        "MizarCore" :             "./MizarCore"
    },
    shim: {
        'jquery': {
            deps: [],
            exports: 'jQuery'
        },
        'jquery.ui': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'jquery.ui.timepicker': {
            deps: ['jquery.ui'],
            exports: 'jQuery'
        },
        'underscore-min': {
            deps: ['jquery'],
            exports: '_',
            init : function() {
             return _.noConflict();
          }
        },
        'jquery.nicescroll.min': {
            deps: ['jquery'],
            exports: ''
        },
        'flot': {
            deps: ['jquery'],
            exports: '$.plot'
        },
        'flot.tooltip': {
            deps: ['flot']
        },
        'flot.axislabels': {
            deps: ['flot']
        },
        'loadmask': {
            deps: ['jquery']
        }
    },
    waitSeconds: 0
});

/**
 * Mizar widget Global main
 */
require(["./MizarWidget"], function (MizarWidget) {
    function initGuiAndLayers() {
    if (mizar.mode === "sky") {
            // Set different GUIs
            mizar.setAngleDistanceSkyGui(true);
            mizar.setSampGui(true);
            mizar.setShortenerUrlGui(true);
            mizar.setMollweideMapGui(true);
            mizar.setReverseNameResolverGui(true);
            mizar.setNameResolverGui(true);
            mizar.setCategoryGui(true);
            mizar.mizarWidgetGui.activatedContext.setCompassVisible("compassDiv",true);
            mizar.setShowCredits(true);
            mizar.setImageViewerGui(true);
            mizar.setSwitchTo2D(true);
            mizar.setExportGui(true);
        } else {
            // Set different GUIs
            mizar.setAngleDistanceSkyGui(false);
            mizar.setSampGui(false);
            mizar.setShortenerUrlGui(false);
            mizar.setMollweideMapGui(false);
            mizar.setReverseNameResolverGui(true);
            mizar.setNameResolverGui(true);
            mizar.setCategoryGui(true);
            mizar.mizarWidgetGui.activatedContext.setCompassVisible("compassDiv",false);
            mizar.setShowCredits(false);
            mizar.setImageViewerGui(true);
            mizar.setSwitchTo2D(true);
            mizar.setExportGui(false);
        }

        var atmosMarsLayer = {
            "category": "Other",
            "type": "atmosphere",
            "exposure": 1.4,
            "wavelength": [0.56, 0.66, 0.78],
            "name": "Atmosphere",
            "lightDir": [0, 1, 0],
            "visible": true
        };
        var coordLayer = {
            "category": "Other",
            "type": "tileWireframe",
            "name": "Coordinates Grid",
            "outline": true,
            "visible": true
        };

        var marsLayer = mizar.getLayer("Mars");
        mizar.addLayer(atmosMarsLayer, marsLayer);
        mizar.addLayer(coordLayer, marsLayer);
        mizar.addLayer({
           "category": "Test",
           "type": "DynamicOpenSearch",
           "dataType": "line",
           "name": "HST_test",
           "serviceUrl": "http://172.17.0.2/sitools/hst",
           "description": "Hubble Space Telescope (HST) is an orbiting astronomical observatory operating from the near-infrared into the ultraviolet. Launched in 1990 and scheduled to operate through 2010, HST carries and has carried a wide variety of instruments producing imaging, spectrographic, astrometric, and photometric data through both pointed and parallel observing programs. MAST is the primary archive and distribution center for HST data, distributing science, calibration, and engineering data to HST users and the astronomical community at large. Over 100 000 observations of more than 20 000 targets are available for retrieval from the Archive.",
           "visible": true,
           "minOrder": 4,
           "attribution": "HST data provided by <a href=\"http://hst.esac.esa.int\" target=\"_blank\"><img src=\"http://172.17.0.2/sitools/upload/esa.svg\" width='28' height='16'/></a>"
         });

    }

    mizarWidget = new MizarWidget('mizarWidget-div', {
        guiActivated: true,
        mode: "sky",
        debug: false,
        coordinateSystem:{
          geoideName:"Equatorial"
        },
        navigation: {
            "initTarget": [0, 0]
        },
        positionTracker: {
            position: "bottom"
        },
        stats: {
            visible: true
        },
        //sitoolsBaseUrl: 'http://172.17.0.2/sitools/',//'http://sitools.akka.eu:8080',
        //hipsServiceUrl: "http://aladin.unistra.fr/hips/globalhipslist?fmt=json&dataproduct_subtype=color",
        backgroundSurveysFiles : ["../data/backgroundSurveys.json"],
        additionalLayersFiles : [{
            layerName : "Mars",
            url : "../data/marsLayers.json"
        }],
        nameResolver: {
            zoomFov: 2,
            jsObject: "gw/NameResolver/CDSNameResolver"
        }
    });
    mizar = mizarWidget.getMizarGlobal();

    initGuiAndLayers();
});
