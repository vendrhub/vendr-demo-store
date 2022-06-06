(function () {

    'use strict';

    function vendrToggle() {

        function link(scope, el, attr, ctrl) {

            scope.toggle = function () {
                scope.checked = !scope.checked;
                if (scope.onChange) {
                    scope.onChange({ 'checked': scope.checked });
                }
            };

        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/App_Plugins/Vendr/backoffice/views/directives/vendr-toggle.html',
            scope: {
                checked: '=',
                name: "<",
                description: "<",
                onChange: "&",
                checkedActionLabel: "<",
                onCheckedAction: "&"
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrToggle', vendrToggle);

}());