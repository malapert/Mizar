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
/*global define: false */

/**
 * Mizar widget
 */
define(["jquery", "underscore-min",

        // Gui
        "./gui/LayerManagerView", "./gui/BackgroundLayersView",
        "./gui/NameResolverView", "./gui/ReverseNameResolverView",
        "./gui/PickingManager", "./gui/FeaturePopup",
        "./gui/IFrame", "gw/Gui/Compass",
        "./gui/MollweideViewer", "./gui/ImageViewer",
        "service/Share", "service/Samp",
        "./gui/AdditionalLayersView", "./gui/ImageManager",

        // Gui
        "./gui/MeasureToolSky", "./gui/MeasureToolPlanet",
        "./gui/SwitchTo2D", "./gui/ExportTool",

        // Mizar_lite
        "gw/Context/PlanetContext",
        "gw/Context/SkyContext",
        "gw/Layer/LayerManager",
        "gw/Utils/Utils",
        "gw/Utils/UtilsCore",
        "gui/ImageManagerCore",
        "gui/dialog/AboutDialog",
        "gui/dialog/ErrorDialog",

        // GlobWeb
        "gw/Utils/Event",

        // Externals
        "jquery.ui", "flot",
        "flot.tooltip", "flot.axislabels"],
    function ($, _,
              LayerManagerView, BackgroundLayersView,
              NameResolverView, ReverseNameResolverView,
              PickingManager, FeaturePopup,
              IFrame, Compass,
              MollweideViewer, ImageViewer,
              Share, Samp,
              AdditionalLayersView, ImageManager,
              MeasureToolSky, MeasureToolPlanet,
              SwitchTo2D, ExportTool,
              PlanetContext, SkyContext,
              LayerManager, Utils, UtilsCore,ImageManagerCore, AboutDialog, ErrorDialog,
              Event) {

        /**
         *    Private variables
         */
        var parentElement;
        var options;
        var planetContext;
        var skyContext;
        var mizarCore;

        /**************************************************************************************************************/

        /**
         *    Mizar Widget GUI constructor
         */
        var MizarWidgetGui = function (div, globalOptions) {
            Event.prototype.constructor.call(this);

            this.mode = globalOptions.mode;

            parentElement = div;
            options = globalOptions.options;

            this.mizarGlobal = globalOptions.mizarGlobal;
            this.mizarCore = globalOptions.mizarGlobal.mizarCore;
            mizarCore = this.mizarCore;

            this.isMobile = globalOptions.isMobile;

            this.activatedContext = this.mizarCore.activatedContext;
            this.activatedContext.planet.coordinateSystem.type = globalOptions.options.coordSystem;
            skyContext = this.activatedContext;

            this.navigation = this.mizarCore.navigation;

            var self = this;

            self.subscribe('layer:fitsSupported', function (layerDesc) {
                self.addFitsEvent(layerDesc);
            });

            // Create data manager
            PickingManager.init(this.mizarCore, globalOptions.options);

            // Share configuration module init
            Share.init({
                mizar: this.mizarCore,
                navigation: this.navigation,
                configuration: globalOptions.options
            });

            // Initialize SAMP component
            // TODO : Bear in mind that a website may already implement specific SAMP logics, so check that
            // current samp component doesn't break existing SAMP functionality
            if (!this.isMobile) {
                var lm = this.mizarCore.getLayerManager();
                Samp.init(this.mizarCore, lm, ImageManagerCore, globalOptions.options);
            }

            this.addMouseEvents();

        };

        /**************************************************************************************************************/

        Utils.inherits(Event, MizarWidgetGui);

        /**************************************************************************************************************/

        /**
         * Register all mouse events
         */
        MizarWidgetGui.prototype.addMouseEvents = function () {
            // Fade hover styled image effect
            $("body").on("mouseenter", "span.defaultImg", function () {
                //stuff to do on mouseover
                $(this).stop().animate({"opacity": "0"}, 100);
                $(this).siblings('.hoverImg').stop().animate({"opacity": "1"}, 100);
            });
            $("body").on("mouseleave", "span.defaultImg", function () {
                //stuff to do on mouseleave
                $(this).stop().animate({"opacity": "1"}, 100);
                $(this).siblings('.hoverImg').stop().animate({"opacity": "0"}, 100);
            });

            // Close button event
            $('body').on("click", '.closeBtn', function () {
                switch ($(this).parent().attr("id")) {
                    case "externalIFrame":
                        IFrame.hide();
                        break;
                    case "selectedFeatureDiv":
                        FeaturePopup.hide();
                        break;
                    default:
                        $(this).parent().fadeOut(300);
                }
            });
        };

        /**************************************************************************************************************/

        /**
         * Add Fits event to layer if supported
         * @param layerDesc
         */
        MizarWidgetGui.prototype.addFitsEvent = function (layerDesc) {

            // Add onready event if FITS supported by layer
            if (layerDesc.fitsSupported) {
                // TODO : Move it..
                layerDesc.onready = function (fitsLayer) {
                    if (fitsLayer.format === "fits" && fitsLayer.levelZeroImage) {
                        if (fitsLayer.div) {
                            // Additional layer
                            // Using name as identifier, because we must know it before attachment to planet
                            // .. but identfier is assigned after layer creation.
                            var shortName = UtilsCore.formatId(fitsLayer.name);
                            $('#addFitsView_' + shortName).button("enable");
                            fitsLayer.div.setImage(fitsLayer.levelZeroImage);
                        }
                        else {
                            // Background fits layer
                            $('#fitsView').button("enable");
                            var backgroundDiv = BackgroundLayersView.getDiv();
                            backgroundDiv.setImage(fitsLayer.levelZeroImage);
                        }
                    }
                };
            }
        };

        /**************************************************************************************************************/


        /**
         *    Add/remove angle distance GUI
         */
        MizarWidgetGui.prototype.setAngleDistanceSkyGui = function (visible) {
            if (visible) {
                // Distance measure tool lazy initialization
                if (this.mode === "sky") {
                    if (!this.measureToolSky) {
                        this.measureToolSky = new MeasureToolSky({
                            planet: this.activatedContext.planet,
                            navigation: this.navigation,
                            isMobile: this.isMobile,
                            mode: this.mode
                        });
                    }
                }
            }
            this.activatedContext.setComponentVisibility("measureSkyContainer", visible);
        };

        /**************************************************************************************************************/

        /**
         *    Add/remove angle distance GUI
         */
        MizarWidgetGui.prototype.setAngleDistancePlanetGui = function (visible) {
            if (visible) {
                // Distance measure tool lazy initialization
                if (this.mode === "planet") {
                    if (!this.measureToolPlanet) {
                        this.measureToolPlanet = new MeasureToolPlanet({
                            planet: this.activatedContext.planet,
                            context: this.activatedContext,
                            navigation: this.navigation,
                            planetLayer: this.activatedContext.planetLayer,
                            isMobile: this.isMobile,
                            mode: this.mode
                        });
                    }
                }
            }
            this.activatedContext.setComponentVisibility("measureSkyContainer", visible);
        };

        /**************************************************************************************************************/

        /**
         *    Activate Switch To 2D
         */
        MizarWidgetGui.prototype.setSwitchTo2D = function (visible) {
            if (visible) {

                if (!this.switchTo2D) {
                    this.switchTo2D = new SwitchTo2D({
                        mizar: this,
                        planet: this.activatedContext.planet,
                        navigation: this.navigation,
                        isMobile: this.isMobile,
                        mode: this.mode
                    });
                }
            }
            this.activatedContext.setComponentVisibility("measureContainer", visible);
        };

        /**************************************************************************************************************/

        /**
         *    Add/remove samp GUI
         *    Only on desktop
         */
        MizarWidgetGui.prototype.setSampGui = function (visible) {
            if (!options.isMobile) {
                this.activatedContext.setComponentVisibility("sampContainer", visible);
            }
        };

        /**************************************************************************************************************/

        /**
         *    Add/remove shortener GUI
         */
        MizarWidgetGui.prototype.setShortenerUrlGui = function (visible) {
            this.activatedContext.setComponentVisibility("shareContainer", visible);
        };

        /**************************************************************************************************************/

        /**
         *    Add/remove 2d map GUI
         */
        MizarWidgetGui.prototype.setMollweideMapGui = function (visible) {
            if (visible) {
                // Mollweide viewer lazy initialization
                if (!this.mollweideViewer) {
                    this.mollweideViewer = new MollweideViewer({
                        planet: this.activatedContext.planet,
                        navigation: this.navigation,
                        mizarBaseUrl: options.mizarBaseUrl
                    });
                }
            }
            this.activatedContext.setComponentVisibility("2dMapContainer", visible);

        };

        /**************************************************************************************************************/

        /**
         *    Add/remove reverse name resolver GUI
         */
        MizarWidgetGui.prototype.setReverseNameResolverGui = function (visible) {
            if (visible) {
                ReverseNameResolverView.init(this.mizarCore, this.activatedContext);
            } else {
                ReverseNameResolverView.remove();
            }
        };

        /**************************************************************************************************************/

        /**
         *    Add/remove name resolver GUI
         */
        MizarWidgetGui.prototype.setNameResolverGui = function (visible) {
            if (visible) {
                NameResolverView.init(this.mizarCore);
            } else {
                NameResolverView.remove();
            }
            this.activatedContext.setComponentVisibility("searchDiv", visible);
        };

        /**************************************************************************************************************/

        /**
         *    Add/remove jQueryUI layer manager view
         */
        MizarWidgetGui.prototype.setCategoryGui = function (visible) {
            if (visible) {
                LayerManagerView.init(this.mizarCore, $.extend({element: $(parentElement).find("#categoryDiv")}, options));
            } else {
                LayerManagerView.remove();
            }
            this.activatedContext.setComponentVisibility("categoryDiv", visible);
        };

        /**************************************************************************************************************/

        /**
         *    Add/remove jQueryUI image viewer GUI
         */
        MizarWidgetGui.prototype.setImageViewerGui = function (visible) {
            if (!options.isMobile) {
                if (visible) {
                    ImageViewer.init(this.mizarCore);
                } else {
                    ImageViewer.remove();
                }
                this.activatedContext.setComponentVisibility("imageViewerDiv", visible);
            }
        };

        /**************************************************************************************************************/

        /**
         *    Add/remove jQueryUI Export GUI
         */
        MizarWidgetGui.prototype.setExportGui = function (visible) {
            if (visible) {
                this.exportTool = new ExportTool({
                    planet: this.activatedContext.planet,
                    navigation: this.navigation,
                    layers: this.mizarCore.getLayers("sky")
                });
            }

            this.activatedContext.setComponentVisibility("exportContainer", visible);
        };

        /**************************************************************************************************************/

        /**
         *    Add/remove position tracker GUI
         */
        MizarWidgetGui.prototype.setPositionTrackerGui = function (visible) {
            this.activatedContext.setComponentVisibility("posTracker", visible);
        };

        /**************************************************************************************************************/

        /**
         *    Set coordinate system
         *    @param newCoordSystem
         *        "EQ" or "GAL"(respectively equatorial or galactic)
         */
        MizarWidgetGui.prototype.setCoordinateSystem = function (newCoordSystem) {
            this.activatedContext.planet.coordinateSystem.type = newCoordSystem;

            if (this.mollweideViewer) {
                this.mollweideViewer.setCoordSystem(newCoordSystem);
            }

            // Publish modified event to update compass north
            this.navigation.publish('modified');
        };

        /**************************************************************************************************************/

        /**
         * Get measureToolPlanet
         * @returns {MeasureToolPlanet|*}
         */
        MizarWidgetGui.prototype.getMeasureToolPlanet = function () {
            return this.measureToolPlanet;
        };

        /**************************************************************************************************************/

        /**
         * Get measureToolSky
         * @returns {MeasureToolSky|*}
         */
        MizarWidgetGui.prototype.getMeasureToolSky = function () {
            return this.measureToolSky;
        };

        /**************************************************************************************************************/

        /**
         *    Toggle between planet/sky mode
         */
        MizarWidgetGui.prototype.toggleContext = function (gwLayer, isFlat, callback) {
            this.mizarCore.mode = (this.mizarCore.mode === "sky") ? "planet" : "sky";
            //this.mizar.mode = this.mizarCore.mode;

            if (this.mizarCore.mode === "sky") {
                // Hide planet
                planetContext.hide();

                // desactive the planet measure tool
                if (!_.isEmpty(this.measureToolPlanet) && this.measureToolPlanet.activated) {
                    this.measureToolPlanet.toggle();
                }

                this.mizarCore.activatedContext = skyContext;

                // Add smooth animation from planet context to sky context
                planetContext.navigation.toViewMatrix(this.mizarCore.oldVM,this.mizarCore.oldFov,
                  2000,function () {
                    // Show all additional layers
                    skyContext.showAdditionalLayers();
                    mizarCore.scene.renderContext.tileErrorTreshold = 1.5;
                    mizarCore.publish("mizarMode:toggle", gwLayer);

                    // Destroy planet context
                    planetContext.destroy();
                    // Show sky
                    skyContext.show();
                    mizarCore.scene.refresh();
                    if (callback) {
                        callback.call(mizarCore);
                    }
                });
            } else {
                // Hide sky
                this.activatedContext.hide();

                // Hide all additional layers
                this.activatedContext.hideAdditionalLayers();
                // Create planet context( with existing sky render context )
                var planetConfiguration = {
                    planetLayer: gwLayer,
                    projection: {geoideName:"WGS84"},
                    renderContext: this.mizarCore.scene.renderContext,
                    initTarget: options.navigation.initTarget,
                    reverseNameResolver: {
                        "baseUrl": gwLayer.reverseNameResolverURL	// TODO: define protocol for reverse name resolver
                    }
                };

                if (gwLayer.nameResolver !== undefined) {
                    planetConfiguration.nameResolver = {
                        "zoomFov": 200000, // in fact it must be distance, to be improved
                        "baseUrl": gwLayer.nameResolver.baseUrl,
                        "jsObject": gwLayer.nameResolver.jsObject
                    }
                }

                planetConfiguration.renderContext.shadersPath = "../../Mizar/shaders/";
                planetConfiguration = $.extend({}, options, planetConfiguration);
                if (!isFlat) {
                    isFlat = true;
                }
                planetContext = new PlanetContext(this.mizarCore.mizar, planetConfiguration);
                planetContext.setComponentVisibility("categoryDiv", true);
                planetContext.setComponentVisibility("searchDiv", true);
                planetContext.setComponentVisibility("posTracker", mizarCore.activatedContext.components.posTracker);
                planetContext.setComponentVisibility("elevTracker", mizarCore.activatedContext.components.posTracker);
                planetContext.setComponentVisibility("compassDiv", false);
                planetContext.setComponentVisibility("measurePlanetContainer", true);
                planetContext.setComponentVisibility("switch2DContainer", false);

                // Propagate user-defined wish for displaying credits window
                planetContext.credits = skyContext.credits;

                // Planet tile error treshold is less sensetive than sky's one
                this.mizarCore.scene.renderContext.tileErrorTreshold = 3;
                this.mizarCore.activatedContext = planetContext;
                // Store old view matrix & fov to be able to rollback to sky context
                this.mizarCore.oldVM = this.mizarCore.scene.renderContext.viewMatrix;
                this.mizarCore.oldFov = this.mizarCore.scene.renderContext.fov;

                if (!planetContext.getCoordinateSystem().isFlat) {
                    //Compute planet view matrix
                    var planetVM = mat4.create();
                    planetContext.navigation.computeInverseViewMatrix();
                    mat4.inverse(planetContext.navigation.inverseViewMatrix, planetVM);

                    // Add smooth animation from sky context to planet context
                    this.mizarCore.navigation.toViewMatrix(planetVM, 45, 2000, function () {
                        planetContext.show();
                        planetContext.planet.refresh();
                        mizarCore.publish("mizarMode:toggle", gwLayer);
                    });
                }
                else {
                    planetContext.show();
                    planetContext.planet.refresh();
                    this.mizarCore.publish("mizarMode:toggle", gwLayer);
                }

                if (!this.measureToolPlanet) {
                  this.measureToolPlanet = new MeasureToolPlanet({
                        context: planetContext,
                        isMobile: this.mizarCore.isMobile,
                        mode: this.mizarCore.mode
                    });
                } else {
                  this.measureToolPlanet.updateContext(planetContext);
                }

                // desactive the sky measure tool
                if (!_.isEmpty(this.measureToolSky) && this.measureToolSky.activated) {
                    this.measureToolSky.toogle();
                }

                //planetContext.planet.isSky = true;
                if (this.mizarCore.navigation.planet) {
                  this.mizarCore.navigation.planet.isSky = true;
                } else if (this.mizarCore.navigation.sky) {
                  this.mizarCore.navigation.sky.isSky = true;
                }

            }
            $('#selectedFeatureDiv').hide();
        };

        return MizarWidgetGui;
    });
