(function () {

    'use strict';

    function StorePickerDialogController($scope,
        vendrStoreResource)
    {
        var defaultConfig = {
            title: "Select Store",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrStoreResource.getStores();
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

    angular.module('vendr').controller('Vendr.Controllers.StorePickerDialogController', StorePickerDialogController);

}());