(function () {

    'use strict';

    function RegionEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrCountryResource, vendrShippingMethodResource, vendrPaymentMethodResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var countryId = compositeId[1];
        var id = compositeId[2];
        var create = id === '-1';

        var vm = this;

        vm.page = {};
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            isCreate: create,
            shippingMethods: [],
            paymentMethods: [],
            editorActions: []
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, countryId]))
                .search("view", "regions");
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Region' }).then(result => {
                vm.options.editorActions = result;
            });
            
            vendrShippingMethodResource.getShippingMethods(storeId).then(function (shippingMethods) {
                if (create)
                    shippingMethods.splice(0, 0, { name: 'Inherit', id: '' });
                vm.options.shippingMethods = shippingMethods;
            });

            vendrPaymentMethodResource.getPaymentMethods(storeId).then(function (paymentMethods) {
                if (create)
                    paymentMethods.splice(0, 0, { name: 'Inherit', id: '' });
                vm.options.paymentMethods = paymentMethods;
            });

            if (create) {

                vendrCountryResource.createRegion(storeId, countryId).then(function (model) {
                    vm.ready(model);
                });

            } else {

                vendrCountryResource.getRegion(id).then(function (model) {
                    vm.ready(model);
                });

            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            // sync state
            editorState.set(vm.content);

            // The country regions are edited within the country editor so it means we have to go
            // a few level back to sync, and then navigate back to get the decendants to get
            // the actual menu node to sync to. This is all pretty nasty though and we should 
            // probably look for an alternative option (maybe a custom API controller)
            var pathToSync = create ? vm.content.path.slice(0, -1) : vm.content.path.slice(0, -2);
            navigationService.syncTree({ tree: "vendrsettings", path: pathToSync, forceReload: true }).then(function (syncArgs) {
                treeService.getChildren({ node: syncArgs.node }).then(function (nodes) {
                    var countryNode = nodes.find(function (itm) {
                        return itm.id === countryId;
                    });
                    if (!create) {
                        treeService.getChildren({ node: countryNode }).then(function (nodes2) {
                            var node = nodes2.find(function (itm) {
                                return itm.id === id;
                            });
                            vm.page.menu.currentNode = node;
                            vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(node);
                        });
                    } else {
                        vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(countryNode);
                        vm.page.breadcrumb.items.push({ name: 'Untitled' });
                    }
                });
            });
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrCountryResource.saveRegion(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/region-edit/" + vendrUtils.createCompositeId([storeId, countryId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save region " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'Region' && args.storeId === storeId && args.parentId === countryId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.RegionEditController', RegionEditController);

}());