define(['../Renderer/FeatureStyle'], function (FeatureStyle) {

    /**************************************************************************************************************/

    /** @constructor
     KMLParser constructor
     */
    var KMLParser = (
      function () {
        var featureCollection = {
            type: "FeatureCollection",
            features: []
        };

        var styles = {};

        var parseColor = /^(\w{2})(\w{2})(\w{2})(\w{2})$/;

        /*
         * Parse a color string
         * @param color_string : the color string
         * @return the color
         */
        var fromStringToColor = function (color_string) {
            var match = parseColor.exec(color_string);
            if (match) {
                return [parseInt(match[4], 16) / 255.0, parseInt(match[3], 16) / 255.0, parseInt(match[2], 16) / 255.0, parseInt(match[1], 16) / 255.0];
            }

            return [1.0, 1.0, 1.0, 1.0];
        };

        /*
         * Parse coordinates, split them and return an array of coordinates in GeoJSON format
         * @param coordsText : the text node value for coordinates
         */
        var parseCoordinates = function (coordsText) {
            var coordinates = [];
            // Trim the coordinates, then split them
            var coords = coordsText.trim().split(/[\s,]+/);
            for (var i = 0; i < coords.length; i += 3) {
                coordinates.push([parseFloat(coords[i]), parseFloat(coords[i + 1]), parseFloat(coords[i + 2])]);
            }
            return coordinates;
        };

        /*
         * Parse KML geometry, return a GeoJSON geometry
         * @param node : a candiate node for geoemtry
         */
        var checkAndParseGeometry = function (node, style) {
          var extrude,outerBoundary,coordNode;

            switch (node.nodeName) {
                case "MultiGeometry":
                {
                    var geoms = [];

                    var children = node.childNodes;
                    for (var i = 0; i < children.length; i++) {
                        var geometry = checkAndParseGeometry(children[i], style);
                        if (geometry) {
                            geoms.push(geometry);
                        }
                    }

                    return {type: "GeometryCollection", geometries: geoms};
                }
                    break;
                case "LineString":
                {
                    coordNode = node.getElementsByTagName("coordinates");
                    if (coordNode.length === 1) {
                        return {
                            type: "LineString",
                            coordinates: parseCoordinates(coordNode[0].textContent)
                        };
                    }
                }
                    break;
                case "Polygon":
                {
                    // Take into accout extresion
                    extrude = node.getElementsByTagName("extrude");
                    if (extrude.length === 1) {
                        style.extrude = parseInt(extrude[0].childNodes[0].nodeValue) !== 0;
                    }

                    // TODO : check how to manage fill property
                    if (style) {
                        style.fill = true;
                    }

                    // TODO : manage holes
                    outerBoundary = node.getElementsByTagName("outerBoundaryIs");
                    coordNode = outerBoundary[0].getElementsByTagName("coordinates");
                    if (coordNode.length === 1) {
                        return {
                            type: "Polygon",
                            coordinates: [parseCoordinates(coordNode[0].textContent)]
                        };
                    }
                }
                    break;
                case "Point":
                {
                    coordNode = node.getElementsByTagName("coordinates");
                    if (coordNode.length === 1) {
                        var coord = coordNode[0].textContent.split(",");
                        return {
                            type: "Point",
                            coordinates: [parseFloat(coord[0]), parseFloat(coord[1])]
                        };
                    }
                }
                    break;
            }

            return null;
        };

        /*
         * Parse poly style
         */
        var parsePolyStyle = function (node, style) {
            var child = node.firstElementChild;
            while (child) {
                switch (child.nodeName) {
                    case "color":
                        style.fillColor = fromStringToColor(child.childNodes[0].nodeValue);
                        break;
                }
                child = child.nextElementSibling;
            }
        };

        /*
         * Parse line style
         */
        var parseLineStyle = function (node, style) {
            var child = node.firstElementChild;
            while (child) {
                switch (child.nodeName) {
                    case "color":
                        style.strokeColor = fromStringToColor(child.childNodes[0].nodeValue);
                        break;
                    case "width":
                        style.strokeWidth = parseFloat(child.childNodes[0].nodeValue);
                        break;
                }
                child = child.nextElementSibling;
            }
        };

        /*
         * Parse icon style
         */
        var parseIconStyle = function (node, style) {
            var child = node.firstElementChild;
            while (child) {
                switch (child.nodeName) {
                    case "color":
                        //style.strokeColor = fromStringToColor( child.childNodes[0].nodeValue );
                        break;
                    case "Icon":
                        if (child.firstElementChild) {
                            style.iconUrl = child.firstElementChild.childNodes[0].nodeValue;
                        } else {
                            style.iconUrl = null;
                        }
                        break;
                }
                child = child.nextElementSibling;
            }
        };

        /*
         * Parse label style
         */
        var parseLabelStyle = function (node, style) {
            var child = node.firstElementChild;
            while (child) {
                switch (child.nodeName) {
                    case "color":
                        var labelColor = fromStringToColor(child.textContent.trim());
                        if (labelColor[3] === 0) {
                            style.label = null;
                            style.textColor = labelColor;
                        }
                        break;
                    /*case "Icon":
                     if ( child.firstElementChild )
                     style.iconUrl = child.firstElementChild.childNodes[0].nodeValue;
                     else
                     style.iconUrl = null;
                     break;*/
                }
                child = child.nextElementSibling;
            }
        };

        /*
         * Parse style
         */
        var parseStyle = function (node, parentStyle) {
            var id = '#' + node.getAttribute("id");

            var style = new FeatureStyle(parentStyle);
            styles[id] = style;

            // Iterate through child to manage all different style element
            var child = node.firstElementChild;
            while (child) {
                switch (child.nodeName) {
                    case "PolyStyle":
                        parsePolyStyle(child, style);
                        break;
                    case "LineStyle":
                        parseLineStyle(child, style);
                        break;
                    case "IconStyle":
                        parseIconStyle(child, style);
                        break;
                    case "LabelStyle":
                        parseLabelStyle(child, style);
                        break;
                }
                child = child.nextElementSibling;
            }

            return style;
        };

        /*
         * Parse placemark
         */
        var parsePlacemark = function (node) {
            // Create a feature
            var feature = {
                type: "Feature",
                properties: {},
                geometry: null
            };

            var shareStyle = false;
            var style,id;
            var child = node.firstElementChild;
            while (child) {
                switch (child.nodeName) {
                    case "name":
                        feature.properties.name = child.childNodes[0].nodeValue;
                        break;
                    case "styleUrl":
                    {
                        id = child.childNodes[0].nodeValue;
                        if (styles.hasOwnProperty(id)) {
                            feature.properties.style = styles[id];
                            shareStyle = true;
                        }
                    }
                        break;
                    case "Style":
                    {
                        style = parseStyle(child, feature.properties.name, feature.properties.style);
                        if (style) {
                            feature.properties.style = style;
                        }
                    }
                        break;
                    default:
                        // Try with geometry
                        if (feature.geometry === null) {
                            feature.geometry = checkAndParseGeometry(child, style);
                        }
                }
                child = child.nextElementSibling;
            }

            if (feature.geometry) {
                // Manage the fact that labels are always active with KML
                style = feature.properties.style;
                if (style && style.textColor[3] > 0.0 && feature.geometry.type === "Point") {
                    if (shareStyle) {
                        style = feature.properties.style = new FeatureStyle(style);
                    }
                    style.label = feature.properties.name;
                }

                featureCollection.features.push(feature);
            }
        };

        /*
         * Parse Document or folder
         */
        var parseDocumentOrFolder = function (node) {
            var child = node.firstElementChild;
            var vis;
            while (child) {
                switch (child.nodeName) {
                    case "visibility":
                        vis = parseInt(child.textContent);
                        if (vis === 0) {
                            return;
                        }
                        break;
                    case "Style":
                        parseStyle(child);
                        break;
                    default:
                        checkAndParseFeature(child);
                }
                child = child.nextElementSibling;
            }
        };

        /*
         * Parse feature
         */
        var checkAndParseFeature = function (node) {
            switch (node.nodeName) {
                case "Style":
                    parseStyle(node);
                    break;
                case "Placemark":
                    parsePlacemark(node);
                    break;
                case "Document":
                case "Folder":
                    parseDocumentOrFolder(node);
                    break;
            }
        };


        /*
         * Parse a KML document
         */
        var parse = function (doc) {
            var root = doc.documentElement;
            var child = root.firstElementChild;
            while (child) {
                checkAndParseFeature(child);
                child = child.nextElementSibling;
            }

            return featureCollection;
        };

        return {parse: parse};
    })();

    return KMLParser;

});
