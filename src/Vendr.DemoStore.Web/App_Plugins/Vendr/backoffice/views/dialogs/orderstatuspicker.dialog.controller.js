(function () {

    'use strict';

    function OrderStatusPickerDialogController($scope,
        vendrOrderStatusResource)
    {
        var defaultConfig = {
            title: "Select an Order Status",
            enableFilter: true,
            orderBy: "sortOrder"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrOrderStatusResource.getOrderStatuses(vm.config.storeId);
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.OrderStatusPickerDialogController', OrderStatusPickerDialogController);

}());