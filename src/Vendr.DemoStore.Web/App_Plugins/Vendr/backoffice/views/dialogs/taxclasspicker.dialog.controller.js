(function () {

    'use strict';

    function TaxClassPickerDialogController($scope,
        vendrTaxResource)
    {
        var defaultConfig = {
            title: "Select Tax Class",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrTaxResource.getTaxClasses(vm.config.storeId);
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

    angular.module('vendr').controller('Vendr.Controllers.TaxClassPickerDialogController', TaxClassPickerDialogController);

}());