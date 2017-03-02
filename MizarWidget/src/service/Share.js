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
 * Share url module : creating url with current navigation properties
 */
define(["jquery", "service/ShareCore", "gui/dialog/ErrorDialog"],
    function ($, ShareCore, ErrorDialog) {

        function init(options) {

            ShareCore.init(options);

            $('#share').on('click', function () {
                var url = ShareCore.generateURL();
                $('#shareInput').val(url);
                $(this).fadeOut(300, function () {
                    $(this).next().fadeIn();
                    $('#shareInput').select();
                });
            });

            $('#shareClear').on('click', function () {
                $(this).parent().fadeOut(300, function () {
                    $("#share").fadeIn();
                });
            });

            $('#share').hover(function () {
                $(this).animate({left: '-10px'}, 100);
            }, function () {
                $(this).animate({left: '-20px'}, 100);
            });
        }

        return {
            init: init
        };

    });
