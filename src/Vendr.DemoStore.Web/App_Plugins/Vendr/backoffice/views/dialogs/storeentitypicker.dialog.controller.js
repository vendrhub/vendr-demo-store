(function () {

    'use strict';

    function StoreEntityPickerDialogController($scope, vendrEntityResource)
    {
        var defaultConfig = {
            title: "Select Entity",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.config.title = "Select "+ vm.config.entityType.replace(/([A-Z])/g, ' $1');

        vm.store = undefined;
        vm.currentStore = undefined;

        vm.loadItems = function (storeId) {
            if (storeId) {
                return vendrEntityResource.getEntities(vm.config.entityType, storeId);
            } else if (vm.config.storeId === -1) {
                return vendrEntityResource.getEntities("Store").then(function (stores) {
                    if (stores.length == 1) {
                        vm.config.storeId = stores[0].id;
                        vm.store = stores[0];
                        return vm.loadItems();
                    } else {
                        return stores;
                    }
                });
            } else {
                return vendrEntityResource.getEntities(vm.config.entityType, vm.config.storeId);
            }
        };

        vm.back = function (scope) {
            vm.currentStore = undefined;
            scope.reset();
            scope.loadItems();
        };

        vm.select = function (item, scope) {
            if (vm.config.storeId === -1 && !vm.currentStore) {
                vm.currentStore = item;
                scope.reset();
                scope.loadItems(item.id);
            } else {
                $scope.model.value = item;
                $scope.model.value.store = vm.currentStore ?? vm.store;
                if ($scope.model.submit) {
                    $scope.model.submit($scope.model.value);
                }
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.StoreEntityPickerDialogController', StoreEntityPickerDialogController);

}());