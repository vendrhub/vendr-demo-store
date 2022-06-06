(function () {

    'use strict';

    function vendrToggleList($routeParams, listViewHelper, angularHelper) {

        function link(scope, el, attr, ctrl) {

            Object.defineProperty(scope, "allChecked", {
                get: function () {
                    return scope.ngModel.every(function (itm) {
                        return itm.checked && (!itm[scope.itemsKey || 'items'] || itm[scope.itemsKey || 'items'].every(function(itm2) {
                            return itm2.checked;
                        }));
                    });
                },
                set: function (value) {
                    scope.ngModel.forEach(function (itm) {
                        itm.checked = value;
                        if (itm[scope.itemsKey || 'items']) {
                            itm[scope.itemsKey || 'items'].forEach(function (itm2) {
                                itm2.checked = value;
                            });
                        }
                    });
                }
            });

        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/App_Plugins/Vendr/backoffice/views/directives/vendr-toggle-list.html',
            scope: {
                ngModel: '=',
                toggleAll: '=',
                itemsKey: '@',
                checkedActionLabel: '<',
                onCheckedAction: '<'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrToggleList', vendrToggleList);

}());