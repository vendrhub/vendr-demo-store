(function () {

    'use strict';

    function vendrCompile($compile) {

        function link(scope, el, attr, ctrl) {
            el.html(scope.template).show();
            $compile(el.contents())(scope);
        }

        var directive = {
            restrict: 'A',
            scope: {
                template: '<',
                model: '<',
                refScope: '<'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrCompile', vendrCompile);

}());