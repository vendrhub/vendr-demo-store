(function () {

    'use strict';

    function ExportTemplatePickerDialogController($scope,
        vendrExportTemplateResource)
    {
        var defaultConfig = {
            title: "Select an Export Template",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrExportTemplateResource.getExportTemplates(vm.config.storeId, vm.config.category);
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function () {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.ExportTemplatePickerDialogController', ExportTemplatePickerDialogController);

}());