(function () {

    'use strict';

    function RepeatCustomerRatesWidgetController($scope, vendrAnalyticsResource, vendrDateHelper) {

        var vm = this;

        vm.loadData = function (timeframe) {
            return vendrAnalyticsResource.getRepeatCustomerRatesReport($scope.config.storeId,
                timeframe.dateRange.from, timeframe.dateRange.to,
                timeframe.compareTo ? timeframe.compareTo.from : undefined,
                timeframe.compareTo ? timeframe.compareTo.to : undefined,
                vendrDateHelper.getLocalTimezoneOffset()
            );
        }
    };

    angular.module('vendr').controller('Vendr.Controllers.RepeatCustomerRatesWidgetController', RepeatCustomerRatesWidgetController);

}());