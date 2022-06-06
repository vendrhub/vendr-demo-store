(function () {

    'use strict';

    function vendrPageSize() {

        function link(scope, el, attr, ctrl) {
            scope.handleChange = function () {
                if (scope.onChange) {
                    scope.onChange({ pageSize: scope.pageSize })
                }
            }
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<select class="vendr-page-size" 
                ng-model="pageSize" 
                ng-options="size for size in pageSizes"
                ng-change="handleChange()">
            </select>`,
            scope: {
                pageSizes: '=',
                pageSize: '=',
                onChange: '&'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrPageSize', vendrPageSize);

}());