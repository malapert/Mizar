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
 *    Date parameter types
 *    Implemented by Concrete Parameters Type such as geometry parameter, number & string parameter...
 */
define(["jquery", "underscore-min", "../../Utils", "./AbstractParameter", "../../selectize"],
    function ($, _, Utils, AbstractParameter, selectize) {

        var minDateParameterTemplate = '<select name="minField" data-placeholder="" style="width:inherit">';
        var maxDateParameterTemplate = '<select name="maxField" data-placeholder="" style="width:inherit">';
        var dateOptionTemplate = _.template('<option name="string_option_<%=param.key%>" value="<%=param.value%>" ><%=param.value%></option>');

        /**
         *   Abstract Parameter constructor
         */
        var SelectDateBetweenParameterType = function (options) {

            AbstractParameter.prototype.constructor.call(this, options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractParameter, SelectDateBetweenParameterType);

        /**************************************************************************************************************/

        SelectDateBetweenParameterType.prototype.convertParametersToHTML = function (parameter) {
            //var parametersHTML = '<div name="' + parameter.name + '"><label>' + parameter.name + ' : </label>';
            //parametersHTML += '<div style="width:220px; display: flex;"><label class="numberBetween">from </label>' + minDateParameterTemplate;
            //parametersHTML += '<label class="numberBetween"> to </label>';
            //parametersHTML += minDateParameterTemplate + '</div>';
            //parametersHTML += '</div>';

            var parametersHTML = '<div name="' + parameter.name + '"><label>' + parameter.label + ' : </label><div style="width:300px; display: flex;">';

            var minNumberBetween = minDateParameterTemplate;
            var maxNumberBetween = maxDateParameterTemplate;

            _.each(parameter.values, function (p) {
                if (p.field == "minField") {
                    minNumberBetween += dateOptionTemplate({param: p});
                } else {
                    maxNumberBetween += dateOptionTemplate({param: p});
                }
            });
            parametersHTML += '<label class="numberBetween">from </label>' + minNumberBetween + '</select><label class="numberBetween"> to </label>' + maxNumberBetween + '</select></div></div>';

            return parametersHTML;
        };

        SelectDateBetweenParameterType.prototype.bindEventsParameters = function (parameter) {

            var minSelectField = $('div [name=' + parameter.name + '] select[name="minField"]');
            minSelectField.selectize({
                create: true,
                maxItems: 1,
                createFilter: new RegExp(/^((0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])|(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01]))[- /.](19|20)?\d\d$/g),
                allowEmptyOption: true,
                //onOptionAdd: this.checkAddedMaxOptionType
            });

            var maxSelectField = $('div [name=' + parameter.name + '] select[name="maxField"]');
            maxSelectField.selectize({
                create: true,
                maxItems: 1,
                createFilter: new RegExp(/^((0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])|(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01]))[- /.](19|20)?\d\d$/g),
                allowEmptyOption: true,
                //onOptionAdd: this.checkAddedMaxOptionType
            });

        };

        return SelectDateBetweenParameterType;
    });
