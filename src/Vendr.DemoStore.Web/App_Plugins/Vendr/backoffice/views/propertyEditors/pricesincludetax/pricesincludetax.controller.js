(function () {

    'use strict';

    function PricesIncludeTaxController($scope, $routeParams, vendrStoreResource, vendrUtils, vendrRouteCache)
    {
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;

        var vm = this;

        vm.property = {
            alias: $scope.model.alias + "_wrapped",
            view: "boolean",
            config: $scope.model.config
        };

        Object.defineProperty(vm.property, "value", {
            get: function () {
                return $scope.model.value;
            },
            set: function (value) {
                $scope.model.value = value;
            }
        });

        if ($scope.model.value == null && storeId) {
            vendrRouteCache.getOrFetch("currentStore", () => vendrStoreResource.getBasicStore(storeId)).then(function (store) {
                vm.property.value = store.pricesIncludeTax;
            });
        }

    }

    angular.module('vendr').controller('Vendr.Controllers.PricesIncludeTaxController', PricesIncludeTaxController);

}());