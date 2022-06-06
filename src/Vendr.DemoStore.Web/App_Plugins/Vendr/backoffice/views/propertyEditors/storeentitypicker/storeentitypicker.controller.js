(function () {

    'use strict';

    function StoreEntityPickerController($scope, $routeParams, editorService,
        vendrStoreResource, vendrEntityResource, vendrUtils, vendrRouteCache)
    {
        // Figure out if we are in a config area or in settings where we can
        // parse the store ID from the querystring
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;
        var currentOrParentNodeId = compositeId.length > 1 ? compositeId[1] : compositeId[0];
        var entityType = $scope.model.config.entityType;
        var storeConfig = $scope.model.config.storeConfig || { storeMode: 'Search' };

        if (storeConfig.storeMode === 'All')
            storeId = -1;

        if (storeConfig.storeMode === 'Explicit')
            storeId = storeConfig.storeId;

        var dialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/dialogs/storeentitypicker.html',
            size: 'small',
            config: {
                storeId: -1,
                entityType: entityType
            },
            submit: function (model) {
                if (model.store) {
                    vm.store = model.store;
                }
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
        vm.showStoreInName = storeConfig.storeMode === 'All';

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
            if (store && storeConfig.storeMode !== 'All') {
                dialogOptions.config.storeId = store.id;
            }
            if (value) {
                vendrEntityResource.getEntity(entityType, value).then(function (entity) {
                    vm.pickedItem = entity;
                    vm.loading = false;
                });
            } else {
                vm.loading = false;
            }
        };

        var init = function (value) {

            if (!storeId) {
                // Search for Store ID
                vendrStoreResource.getBasicStoreByNodeId(currentOrParentNodeId).then(function (store) {
                    initStore(store, value);
                });
            } else if (storeId !== -1) {
                // Explicit store
                vendrStoreResource.getBasicStore(storeId).then(function (store) {
                    initStore(store, value);
                });
            } else if (value) {
                vendrEntityResource.getStoreByEntityId(entityType, value).then(function (store) {
                    initStore(store, value);
                });
            } else {
                // All store
                initStore({ id: -1 }, value);
            }

        };

        var unsubscribe = [
            $scope.$on("formSubmitted", function () {
                init($scope.model.value);
            })
        ];

        // When the element is disposed we need to unsubscribe!
        // NOTE: this is very important otherwise if this is part of a modal, the listener still exists because the dom
        // element might still be there even after the modal has been hidden.
        $scope.$on('$destroy', function () {
            unsubscribe.forEach(function (u) {
                u();
            });
        });

        init(vm.model.value);
    }

    angular.module('vendr').controller('Vendr.Controllers.StoreEntityPickerController', StoreEntityPickerController);

}());