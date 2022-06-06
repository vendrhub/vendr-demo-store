(function () {

    'use strict';

    function SendEmailDialogController($scope, formHelper, vendrOrderResource, languageResource) {

        var cfg = $scope.model.config;

        var vm = this;

        vm.page = {};
        vm.page.name = "Send Email '" + cfg.emailTemplateName + "'";
        vm.page.saveButtonState = 'init';
        vm.page.loading = true;

        vm.model = {};
        vm.options = {
            languages: []
        };

        vm.init = function () {
            vm.model.emailTemplateId = cfg.emailTemplateId;
            vm.model.emailTemplateName = cfg.emailTemplateName;
            vm.model.orderId = cfg.orderId;
            vm.model.onError = function () {
                vm.page.saveButtonState = 'error';
            };

            languageResource.getAll().then(function (languages) {
                vm.options.languages = languages;
                if (vm.model.orderId) {
                    vendrOrderResource.getOrderEmailConfig(vm.model.orderId).then(function (result) {
                        vm.model.to = result.email;
                        vm.model.languageIsoCode = result.languageIsoCode;
                        vm.page.loading = false;
                    });
                } else {
                    vm.page.loading = false;
                }
            });
        };

        vm.save = function () {
            if (formHelper.submitForm({ scope: $scope })) {
                vm.page.saveButtonState = "busy";
                $scope.model.submit(vm.model);
            }
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.SendEmailDialogController', SendEmailDialogController);

}());