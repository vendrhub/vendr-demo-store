(function () {

    'use strict';

    function TopSellingProductsWidgetController($scope, $rootScope, $timeout, vendrAnalyticsResource, vendrDateHelper) {

        var vm = this;

        vm.loading = true;
        vm.comparing = false;
        vm.timeframe = $scope.timeframe;
        vm.data = {};

        vm.init = function () {

            vm.loading = true;

            $timeout(function () {
                $rootScope.$broadcast("VendrAnalyticsWidgetChanged", $scope.config);
            }, 1);

            vendrAnalyticsResource.getTopSellingProductsReport($scope.config.storeId,
                vm.timeframe.dateRange.from, vm.timeframe.dateRange.to,
                vm.timeframe.compareTo ? vm.timeframe.compareTo.from : undefined,
                vm.timeframe.compareTo ? vm.timeframe.compareTo.to : undefined,
                vendrDateHelper.getLocalTimezoneOffset()
            ).then(function (data) {

                    vm.data = data;

                    vm.comparing = vm.timeframe.compareTo;
                    vm.loading = false;

                    $timeout(function () {
                        $rootScope.$broadcast("VendrAnalyticsWidgetChanged", $scope.config);
                    }, 1);

                });
        }

        vm.init();

        $rootScope.$on("VendrAnalyticsTimeframeChanged", function (evt, timeframe) {
            vm.timeframe = timeframe;
            vm.init();
        });
    };

    angular.module('vendr').controller('Vendr.Controllers.TopSellingProductsWidgetController', TopSellingProductsWidgetController);

}());