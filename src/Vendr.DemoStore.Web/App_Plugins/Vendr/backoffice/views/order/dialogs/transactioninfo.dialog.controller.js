(function () {

    'use strict';

    function TransactionInfoDialogController($scope, vendrOrderResource)
    {
        var vm = this;

        vm.title = "Transaction Info";
        vm.properties = [];

        vendrOrderResource.getOrderTransactionInfo($scope.model.config.orderId).then(function (data) {
            vm.properties = data;
        });

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.TransactionInfoDialogController', TransactionInfoDialogController);

}());