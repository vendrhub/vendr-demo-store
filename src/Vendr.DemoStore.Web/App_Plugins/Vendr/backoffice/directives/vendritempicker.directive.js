(function () {

    'use strict';

    function vendrItemPicker() {

        function link(scope, el, attr, ctrl) {

            scope.loading = true;
            scope.title = scope.config.title;
            scope.filter = {
                enabled: scope.config.enableFilter,
                term: ""
            };
            scope.items = [];

            scope.init = function() {
                scope.loadItems();
            };

            scope.reset = function () {
                scope.filter.term = "";
            };

            scope.loadItems = function (parentId) {
                scope.items = [];
                scope.loading = true;
                scope.onLoadItems({ parentId: parentId }).then(function (data) {
                    scope.items = data;
                    scope.loading = false;
                });
            };

            scope.back = function () {
                scope.onBack({ scope: scope });
            };

            scope.select = function(item) {
                scope.onSelect({ item: item, scope: scope });
            };

            scope.close = function() {
                scope.onClose();
            };

            scope.init();
        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/App_Plugins/Vendr/backoffice/views/directives/vendr-item-picker.html',
            scope: {
                config: '=',
                parentItem: '=',
                onBack: '&',
                onLoadItems: '&',
                onSelect: '&',
                onClose: '&'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrItemPicker', vendrItemPicker);

}());