/**
 * PickingManager module
 */
define(["../Renderer/FeatureStyle", "../Layer/OpenSearchLayer", "../Utils/Utils","../Utils/UtilsCore"],
    function (FeatureStyle, OpenSearchLayer, Utils,UtilsCore) {

        var mizar;
        var sky;

        var pickableLayers = [];
        var selection = [];
        var stackSelectionIndex = -1;

        var selectedStyle = new FeatureStyle({
            strokeColor: [1.0, 1.0, 0.0, 1.0],
            fillColor: [1.0, 1.0, 0.0, 1.0],
            zIndex: 1
        });

        /**************************************************************************************************************/

        /**
         *    Add pickable layer to the pickableLayers list
         *    @function addPickableLayer
         *    @param {Layer} layer
         */
        function addPickableLayer(layer) {
            if (pickableLayers.indexOf(layer) === -1) {
                pickableLayers.push(layer);
            }
            else {
                console.log("WARN:" + layer.name + " has been already added");
            }
        }

        /**************************************************************************************************************/

        /**
         *    Remove pickable layers
         *    @param {Layer} layer
         */
        function removePickableLayer(layer) {
            for (var i = 0; i < pickableLayers.length; i++) {
                if (layer.id === pickableLayers[i].id) {
                    pickableLayers.splice(i, 1);
                }
            }
        }

        /**************************************************************************************************************/

        /**
         * Get the list of pickable layers
         * @returns {Array} pickableLayers
         */
        function getPickableLayers() {
            return pickableLayers;
        }

        /**************************************************************************************************************/

        /**
         *    Revert style of selected feature
         */
        function blurSelectedFeature() {
            var selectedData = this.getSelection()[this.stackSelectionIndex];
            if (selectedData) {
                var style = new FeatureStyle(selectedData.feature.properties.style);
                switch (selectedData.feature.geometry.type) {
                    case "LineString":
                    case "MultiLineString":
                    case "Polygon":
                    case "MultiPolygon":
                        style.strokeColor = selectedData.layer.style.strokeColor;
                        break;
                    case "Point":
                        // Use stroke color while reverting
                        style.fillColor = selectedData.feature.properties.style.strokeColor;
                        break;
                    default:
                        break;
                }
                style.zIndex = selectedData.layer.style.zIndex;
                selectedData.layer.modifyFeatureStyle(selectedData.feature, style);
            }
        }

        /**************************************************************************************************************/

        /**
         *    Apply selected style to the feature by the given index in selection array
         *
         *    @param index Index of feature in selection array
         *    @param options
         *        <li>isExclusive : Boolean indicating if the focus is exclusive</li>
         *        <li>color : Highlight color</li>
         */
        function focusFeatureByIndex(index, options) {
            if (options && options.isExclusive) {
                blurSelection();
            }

            // Update highlight color
            var strokeColor = options.color ? FeatureStyle.fromStringToColor(options.color) : this.selectedStyle.strokeColor;
            var fillColor = options.color ? FeatureStyle.fromStringToColor(options.color) : this.selectedStyle.fillColor;

            var selectedData = this.getSelection()[index];
            if (selectedData) {
                this.stackSelectionIndex = index;
                var style = new FeatureStyle(selectedData.feature.properties.style);
                switch (selectedData.feature.geometry.type) {
                    case "LineString":
                    case "MultiLineString":
                    case "Polygon":
                    case "MultiPolygon":
                        style.strokeColor = strokeColor;
                        break;
                    case "Point":
                        style.fillColor = fillColor;
                        break;
                    default:
                        break;
                }
                style.zIndex = this.selectedStyle.zIndex;
                selectedData.layer.modifyFeatureStyle(selectedData.feature, style);
            }
            sky.refresh();
        }

        /**************************************************************************************************************/

        /**
         * Get the current selection
         * @returns {Array}
         */
        function getSelection() {
            return selection;
        }

        /**************************************************************************************************************/

        /**
         *    Revert style of selection
         */
        function blurSelection() {
            for (var i = 0; i < this.getSelection().length; i++) {
                var selectedData = this.getSelection()[i];
                var style = new FeatureStyle(selectedData.feature.properties.style);
                switch (selectedData.feature.geometry.type) {
                    case "LineString":
                    case "MultiLineString":
                    case "Polygon":
                    case "MultiPolygon":
                        style.strokeColor = selectedData.layer.style.strokeColor;
                        break;
                    case "Point":
                        // Use stroke color while reverting
                        style.fillColor = selectedData.feature.properties.style.strokeColor;
                        break;
                    default:
                        break;
                }
                style.zIndex = selectedData.layer.style.zIndex;

                if (selectedData.layer.planet) {
                    // Layer is still attached to globe
                    selectedData.layer.modifyFeatureStyle(selectedData.feature, style);
                }
            }
        }

        /**************************************************************************************************************/

        /**
         *    Apply style to selection
         *    @param {Array} newSelection selection of data
         */
        function focusSelection(newSelection) {
            var style;
            for (var i = 0; i < newSelection.length; i++) {
                var selectedData = newSelection[i];

                if (selectedData.feature.properties.style) {
                    style = new FeatureStyle(selectedData.feature.properties.style);
                }
                else {
                    style = new FeatureStyle(selectedData.layer.style);
                }

                switch (selectedData.feature.geometry.type) {
                    case "LineString":
                    case "MultiLineString":
                    case "Polygon":
                    case "MultiPolygon":
                        style.strokeColor = this.selectedStyle.strokeColor;
                        break;
                    case "Point":
                        style.fillColor = this.selectedStyle.fillColor;
                        break;
                    default:
                        break;
                }
                style.zIndex = this.selectedStyle.zIndex;
                selectedData.layer.modifyFeatureStyle(selectedData.feature, style);
            }
        }

        /**************************************************************************************************************/

        /**
         *    Clear selection
         */
        function clearSelection() {
            this.blurSelection();
            this.setSelection([]);
        }

        /**************************************************************************************************************/

        /**
         * Check if a geometry crosses the date line
         * @param {Array} pickPoint
         * @param {Array}coords
         * @returns {Array} coords
         */
        function fixDateLine(pickPoint, coords) {
            var crossDateLine = false;
            var startLon = coords[0][0];
            for (var i = 1; i < coords.length && !crossDateLine; i++) {
                var deltaLon = Math.abs(coords[i][0] - startLon);
                if (deltaLon > 180) {
                    // DateLine!
                    crossDateLine = true;
                }
            }
            var n;
            if (crossDateLine) {
                var fixCoords = [];

                if (pickPoint[0] < 0.0) {
                    // Ensure coordinates are always negative
                    for (n = 0; n < coords.length; n++) {
                        if (coords[n][0] > 0) {
                            fixCoords[n] = [coords[n][0] - 360, coords[n][1]];
                        } else {
                            fixCoords[n] = [coords[n][0], coords[n][1]];
                        }
                    }
                }
                else {
                    // Ensure coordinates are always positive
                    for (n = 0; n < coords.length; n++) {
                        if (coords[n][0] < 0) {
                            fixCoords[n] = [coords[n][0] + 360, coords[n][1]];
                        } else {
                            fixCoords[n] = [coords[n][0], coords[n][1]];
                        }
                    }
                }

                return fixCoords;
            }
            else {
                return coords;
            }
        }

        /**************************************************************************************************************/

        /**
         * Picking test for feature depending on its geometry type
         * @param {Object} feature
         * @param {Array} pickPoint
         * @returns {Boolean} isPicked
         */
        function featureIsPicked(feature, pickPoint) {
            var i,j,p;
            var feat,featNext,ring;
            switch (feature.geometry.type) {
                case "LineString":
                    for (i = 0; i < feature.geometry.coordinates.length - 1; i++) {
                        feat = feature.geometry.coordinates[i];
                        featNext = feature.geometry.coordinates[i + 1];
                        if (UtilsCore.pointInLine(pickPoint, feat, featNext)) {
                            return true;
                        }
                    }
                    //var ring = this.fixDateLine(pickPoint, feature['geometry']['coordinates'][0]);
                    break;
                case "MultiLineString":
                    for (i = 0; i < feature.geometry.coordinates.length; i++) {
                        for (j = 0; j < feature.geometry.coordinates[i].length - 1; j++) {
                            feat = feature.geometry.coordinates[i][j];
                            featNext = feature.geometry.coordinates[i][j + 1];
                            if (UtilsCore.pointInLine(pickPoint, feat, featNext)) {
                                return true;
                            }
                        }
                    }
                    break;
                case "Polygon":
                    ring = this.fixDateLine(pickPoint, feature.geometry.coordinates[0]);
                    return UtilsCore.pointInRing(pickPoint, ring);
                case "MultiPolygon":
                    for (p = 0; p < feature.geometry.coordinates.length; p++) {
                        ring = this.fixDateLine(pickPoint, feature.geometry.coordinates[p][0]);
                        if (UtilsCore.pointInRing(pickPoint, ring)) {
                            return true;
                        }
                    }
                    return false;
                case "Point":
                    var point = feature.geometry.coordinates;
                    // Do not pick the labeled features
                    var isLabel = feature.properties.style && feature.properties.style.label;
                    return UtilsCore.pointInSphere(pickPoint, point, feature.geometry._bucket.textureHeight) && !isLabel;
                default:
                    console.log("Picking for " + feature.geometry.type + " is not implemented yet");
                    return false;
            }
        }

        /**************************************************************************************************************/

        /**
         * Compute the selection at the picking point
         * @param {Array} pickPoint
         * @return {Array} newSelection
         */
        function computePickSelection(pickPoint) {

            if (!pickPoint) {
                return [];
            }
            var i,j,feature;
            var newSelection = [];
            for (i = 0; i < this.getPickableLayers().length; i++) {
                var selectedTile = sky.tileManager.getVisibleTile(pickPoint[0], pickPoint[1]);
                var pickableLayer = this.getPickableLayers()[i];
                if (pickableLayer.getVisible() && pickableLayer.planet === mizar.activatedContext.planet) {
                    if (pickableLayer instanceof OpenSearchLayer) {
                        // Extension using layer
                        // Search for features in each tile
                        var tile = selectedTile;
                        var tileData = tile.extension[pickableLayer.extId];

                        if (!tileData || tileData.state !== OpenSearchLayer.TileState.LOADED) {
                            while (tile.parent && (!tileData || tileData.state !== OpenSearchLayer.TileState.LOADED)) {
                                tile = tile.parent;
                                tileData = tile.extension[pickableLayer.extId];
                            }
                        }

                        if (tileData) {
                            for (j = 0; j < tileData.featureIds.length; j++) {
                                feature = pickableLayer.features[pickableLayer.featuresSet[tileData.featureIds[j]].index];
                                if (this.featureIsPicked(feature, pickPoint)) {
                                    newSelection.push({feature: feature, layer: pickableLayer});
                                }
                            }
                        }
                    }
                    else {
                        // Vector layer
                        // Search for picked features
                        for (j = 0; j < pickableLayer.features.length; j++) {
                            feature = pickableLayer.features[j];
                            if (this.featureIsPicked(feature, pickPoint)) {
                                newSelection.push({feature: feature, layer: pickableLayer});
                            }
                        }
                    }
                }

                // Add selected tile to selection to be able to make the requests by tile
                // (actually used for asteroids search)
                newSelection.selectedTile = selectedTile;
            }

            return newSelection;
        }

        /**************************************************************************************************************/

        /**
         * Set selection list with passed selection
         * @param {Array} sel selection
         */
        function setSelection(sel) {
            selection = sel;
            return selection;
        }

        /**************************************************************************************************************/

        /**
         *    Highlight the given feature
         *
         *    @param featureData
         *        Feature data is an object composed by feature and its layer
         *    @param options
         *        Focus feature options(isExclusive and color)
         *
         *    // TODO : maybe it's more intelligent to store layer reference on feature ?
         */
        function highlightObservation(featureData, options) {
            selection.push(featureData);
            focusFeatureByIndex(selection - 1, options);
        }

        /**************************************************************************************************************/

        return {
            selectedStyle: selectedStyle,
            stackSelectionIndex: stackSelectionIndex,
            init: function (m) {
                mizar = m;
                sky = m.scene;
            },
            addPickableLayer: addPickableLayer,
            removePickableLayer: removePickableLayer,
            getPickableLayers: getPickableLayers,
            blurSelectedFeature: blurSelectedFeature,
            focusFeatureByIndex: focusFeatureByIndex,
            getSelection: getSelection,
            blurSelection: blurSelection,
            focusSelection: focusSelection,
            clearSelection: clearSelection,
            fixDateLine: fixDateLine,
            featureIsPicked: featureIsPicked,
            computePickSelection: computePickSelection,
            setSelection: setSelection,
            highlightObservation: highlightObservation
        };
    });
