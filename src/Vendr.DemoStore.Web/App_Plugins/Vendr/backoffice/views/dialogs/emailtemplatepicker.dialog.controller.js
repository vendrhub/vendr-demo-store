(function () {

    'use strict';

    function EmailTemplatePickerDialogController($scope,
        vendrEmailTemplateResource)
    {
        var defaultConfig = {
            title: "Select an Email Template",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrEmailTemplateResource.getEmailTemplates(vm.config.storeId, vm.config.category);
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

    angular.module('vendr').controller('Vendr.Controllers.EmailTemplatePickerDialogController', EmailTemplatePickerDialogController);

}());