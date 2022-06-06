(function () {

    'use strict';

    function vendrTableController($interpolate, $sce, iconHelper) {

        var vm = this;

        vm.clickItem = function (item, $index, $event) {
            if (vm.onClick && !($event.metaKey || $event.ctrlKey)) {
                vm.onClick({ item: item, $index: $index, $event: $event });
                $event.preventDefault();
            }
            $event.stopPropagation();
        };

        vm.selectItem = function (item, $index, $event) {
            if (vm.onSelect) {
                vm.onSelect({ item: item, $index: $index, $event: $event });
                $event.stopPropagation();
            }
        };

        vm.selectAll = function ($event) {
            if (vm.onSelectAll) {
                vm.onSelectAll({ $event: $event });
            }
        };

        vm.isSelectedAll = function () {
            if (vm.onSelectedAll && vm.items && vm.items.length > 0) {
                return vm.onSelectedAll();
            }
        };

        vm.isSortDirection = function (col, direction) {
            if (vm.onSortingDirection) {
                return vm.onSortingDirection({ col: col, direction: direction });
            }
        };

        vm.sort = function (field, allow, isSystem) {
            if (vm.onSort) {
                vm.onSort({ field: field, allow: allow, isSystem: isSystem });
            }
        };

        vm.getIcon = function (entry) {
            return iconHelper.convertFromLegacyIcon(entry.icon);
        };

        vm.renderTemplate = function (template, model) {
            var exp = $interpolate(template);
            return $sce.trustAsHtml(exp(model));
        };
    }

    var component = {
        templateUrl: '/App_Plugins/Vendr/backoffice/views/directives/vendr-table.html',
        controller: vendrTableController,
        controllerAs: 'vm',
        bindings: {
            items: '<',
            itemProperties: '<',
            allowSelectAll: '<',
            allowSorting: '<',
            onSelect: '&',
            onClick: '&',
            onSelectAll: '&',
            onSelectedAll: '&',
            onSortingDirection: '&',
            onSort: '&'
        }
    };

    angular.module('vendr.directives').component('vendrTable', component);

}());