(function () {

    'use strict';

    function ElementTypePickerDialogController($scope,
        elementTypeResource)
    {
        var defaultConfig = {
            title: "Select an Element Type",
            enableFilter: true,
            orderBy: "sortOrder"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return elementTypeResource.getAll().then(function (data) {
                return data.map(function (itm) {
                    return {
                        id: itm.key,
                        name: itm.name,
                        icon: itm.icon
                    }
                });
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

    angular.module('vendr').controller('Vendr.Controllers.ElementTypePickerDialogController', ElementTypePickerDialogController);

}());