(function () {

    'use strict';

    function CommerceDashboardController($scope, $routeParams, $location, vendrStoreResource) {

        var vm = this;

        vm.loading = true;
        vm.stores = [];

        vm.goToStore = function (storeId) {
            $location.path("/commerce/vendr/store-view/" + storeId);
        }

        vendrStoreResource.getStoreSummariesForCurrentUser().then(function (stores) {

            vm.stores = stores;

            if (vm.stores.length == 1) {
                vm.goToStore(vm.stores[0].id);
                //vm.loading = false;
            } else {
                vm.loading = false;
            }

        });

    };

    angular.module('vendr').controller('Vendr.Controllers.CommerceDashboardController', CommerceDashboardController);

}());