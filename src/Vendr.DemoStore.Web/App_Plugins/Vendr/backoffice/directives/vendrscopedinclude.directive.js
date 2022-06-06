(function () {

    'use strict';

    function vendrScopedInclude() {

        var directive = {
            restrict: 'E',
            replace: true,
            template: '<ng-include src="view"></ng-include>',
            scope: {
                view: '=',
                model: '='
            }
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrScopedInclude', vendrScopedInclude);

}());