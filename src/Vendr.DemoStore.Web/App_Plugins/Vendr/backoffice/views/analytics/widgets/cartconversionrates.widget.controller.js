(function () {

    'use strict';

    function CartConversionRatesWidgetController($scope, $rootScope, $timeout, vendrAnalyticsResource, vendrDateHelper) {

        var vm = this;

        vm.comparing = false;
        vm.data = {};

        vm.loadData = function (timeframe) {
            return vendrAnalyticsResource.getCartConversionRatesReport($scope.config.storeId,
                timeframe.dateRange.from, timeframe.dateRange.to,
                timeframe.compareTo ? timeframe.compareTo.from : undefined,
                timeframe.compareTo ? timeframe.compareTo.to : undefined,
                vendrDateHelper.getLocalTimezoneOffset()
            ).then(function (data) {

                    vm.data = data;
                    vm.comparing = timeframe.compareTo;

                    return data;
                });
        }
    };

    angular.module('vendr').controller('Vendr.Controllers.CartConversionRatesWidgetController', CartConversionRatesWidgetController);

}());