(function () {

    'use strict';

    function DiscountRewardProviderPickerDialogController($scope, $q,
        vendrDiscountResource, vendrRouteCache)
    {
        var defaultConfig = {
            title: "Select Reward",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function () {
            return vendrRouteCache.getOrFetch("discountRewardProviderDefs", function () {
                return vendrDiscountResource.getDiscountRewardProviderDefinitions();
            });
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

    angular.module('vendr').controller('Vendr.Controllers.DiscountRewardProviderPickerDialogController', DiscountRewardProviderPickerDialogController);

}());