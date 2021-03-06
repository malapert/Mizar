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
 * Name resolver module : search object name from its coordinates
 * TODO : move _handleMouseDown&Up to View ?
 */
define(["jquery", "gw/Tiling/HEALPixBase"], function ($, HEALPixBase) {

    var mizar;
    var context;

    var reverseNameResolverImplementation = null;

    return {
        init: function (m, context) {
            mizar = m;
            this.setContext(context);
        },

        /**************************************************************************************************************/

        /**
         *    Send request to reverse name resolver service for the given point
         *    @param geoPick    Geographic position of point of interest
         *    @param options
         *        <li>success: Function called on success with the response of server as argument</li>
         *        <li>error: Function called on error with the xhr object as argument</li>
         */
        sendRequest: function (geoPick, options) {
            var self = this;
            // TODO: depending on context, send the request
            // Currently only sky context is handled
            if (mizar.mode == "sky") {
                var equatorialCoordinates = [];
                context.globe.coordinateSystem.fromGeoToEquatorial(geoPick, equatorialCoordinates);

                // Format to equatorial coordinates
                equatorialCoordinates[0] = equatorialCoordinates[0].replace("h ", ":");
                equatorialCoordinates[0] = equatorialCoordinates[0].replace("m ", ":");
                equatorialCoordinates[0] = equatorialCoordinates[0].replace("s", "");

                equatorialCoordinates[1] = equatorialCoordinates[1].replace("° ", ":");
                equatorialCoordinates[1] = equatorialCoordinates[1].replace("' ", ":");
                equatorialCoordinates[1] = equatorialCoordinates[1].replace("\"", "");

                // Find max order
                var maxOrder = 3;
                context.globe.tileManager.visitTiles(function (tile) {
                    if (maxOrder < tile.order) maxOrder = tile.order;
                });

                options.maxOrder = maxOrder;
                options.equatorialCoordinates = equatorialCoordinates;
                options.context = context;

                if (reverseNameResolverImplementation) {
                    reverseNameResolverImplementation.handle(options);
                } else {
                    alert("No reserve name resolver found");
                }

                //var requestUrl = context.configuration.reverseNameResolver.baseUrl + '/EQUATORIAL/' + equatorialCoordinates[0] + " " + equatorialCoordinates[1] + ";" + maxOrder;

            }
            else {
                console.error("Not implemented yet");
                if (options && options.error)
                    options.error();
            }
        },

        /**************************************************************************************************************/

        /**
         *    Set new context
         */
        setContext: function (ctx) {
            context = ctx;

            //instantiate reverse name resolver nameResolverImplementation object
            var reverseNameResolverClass;
            if (context.configuration.nameResolver != undefined) {
                reverseNameResolverClass = require(context.configuration.reverseNameResolver.jsObject);
            }
            else {
                //Use default reverse name resolver if none defined...
                reverseNameResolverClass = require("./reverse_name_resolver/DefaultNameResolver");
            }

            reverseNameResolverImplementation = new reverseNameResolverClass(context);
        }
    };

});
