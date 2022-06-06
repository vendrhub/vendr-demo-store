(function () {

    'use strict';

    function PaymentMethodCreateController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService,
        vendrUtils, vendrPaymentMethodResource) {

        var storeId = $scope.currentNode.metaData['storeId'];

        var vm = this;

        vm.options = {
            paymentProviderTypes: []
        };

        vm.init = function () {

            vendrPaymentMethodResource.getPaymentProviderDefinitions().then(function (data) {
                vm.options.paymentProviderTypes = data;
            });

        };

        vm.createNewOfType = function (type) {
            $location.path("/settings/vendrsettings/paymentmethod-edit/" + vendrUtils.createCompositeId([storeId, -1]))
                .search("type", type.alias);
            navigationService.hideMenu();
        };

        vm.selectPreset = function () {
            vm.options.selectPreset = true;
        };

        vm.close = function () {
            navigationService.hideDialog(true);
        };

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.PaymentMethodCreateController', PaymentMethodCreateController);

}());