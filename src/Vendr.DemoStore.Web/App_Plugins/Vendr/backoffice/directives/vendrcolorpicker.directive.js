(function () {

    'use strict';

    function vendrColorPicker() {

        function link(scope, el, attr, ctrl) {

            scope.internalSelectedColor = false;

            // NB: The initial space is important!
            // The umbraco swatch-picker component prefixes class name
            // with 'btn-' so we start with a space to break this.
            var classPrefix = " vendr-bg--";

            scope.colors = [
                //{ name: "Black", value: "color-black" },
                { name: "Grey", value: classPrefix + "grey" },
                { name: "Brown", value: classPrefix + "brown" },
                { name: "Blue", value: classPrefix + "blue" },
                { name: "Light Blue", value: classPrefix + "light-blue" },
                { name: "Indigo", value: classPrefix + "indigo" },
                { name: "Purple", value: classPrefix + "purple" },
                { name: "Deep Purple", value: classPrefix + "deep-purple" },
                { name: "Cyan", value: classPrefix + "cyan" },
                { name: "Green", value: classPrefix + "green" },
                { name: "Light Green", value: classPrefix + "light-green" },
                { name: "Lime", value: classPrefix + "lime" },
                { name: "Yellow", value: classPrefix + "yellow" },
                { name: "Amber", value: classPrefix + "amber" },
                { name: "Orange", value: classPrefix + "orange" },
                { name: "Deep Orange", value: classPrefix + "deep-orange" },
                { name: "Red", value: classPrefix + "red" },
                { name: "Pink", value: classPrefix + "pink" }
            ];

            if (scope.selectedColor) {
                var found = _.find(scope.colors, function (c) {
                    return c.value === classPrefix + scope.selectedColor;
                });
                if (found) {
                    scope.internalSelectedColor = found;
                }
            }

            scope.internalOnSelect = function (value) {
                var color = value.value.replace(classPrefix, '');
                scope.selectedColor = color;
                if (scope.onSelect) {
                    scope.onSelect({ color: color });
                }
            };
        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/App_Plugins/Vendr/backoffice/views/directives/vendr-color-picker.html',
            scope: {
                selectedColor: '=',
                onSelect: '&'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrColorPicker', vendrColorPicker);

}());