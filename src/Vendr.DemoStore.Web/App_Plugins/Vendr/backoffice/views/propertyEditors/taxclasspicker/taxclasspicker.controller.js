(function () {

    'use strict';

    function TaxClassPickerController($scope, $routeParams, editorService,
        vendrStoreResource, vendrTaxResource, vendrUtils)
    {
        // Figure out if we are in a config area or in settings where we can
        // parse the store ID from the querystring
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;
        var currentOrParentNodeId = compositeId.length > 1 ? compositeId[1] : compositeId[0];

        var dialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/dialogs/taxclasspicker.html',
            size: 'small',
            config: {
                storeId: -1
            },
            submit: function (model) {
                vm.model.value = model.id;
                vm.pickedItem = model;
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var vm = this;

        vm.model = $scope.model;
        vm.pickedItem = false;
        vm.loading = true;
        vm.store = null;

        vm.openPicker = function () {
            editorService.open(dialogOptions);
        };

        vm.removeItem = function () {
            vm.model.value = null;
            vm.pickedItem = false;
        };

        vm.openItem = function () {

        };

        var initStore = function (store, value) {
            vm.store = store;
            dialogOptions.config.storeId = store.id;
            if (value) {
                vendrTaxResource.getTaxClass(value).then(function (entity) {
                    vm.pickedItem = entity;
                    vm.loading = false;
                });
            } else {
                vm.loading = false;
            }
        };

        var init = function (value) {

            if (!storeId) {
                vendrStoreResource.getBasicStoreByNodeId(currentOrParentNodeId).then(function (store) {
                    initStore(store, value);
                });
            } else {
                vendrStoreResource.getBasicStore(storeId).then(function (store) {
                    initStore(store, value);
                });
            }

        };

        init(vm.model.value);
    }

    angular.module('vendr').controller('Vendr.Controllers.TaxClassPickerController', TaxClassPickerController);

}());