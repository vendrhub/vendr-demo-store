(function () {

    'use strict';

    function CountryEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrCountryResource, vendrCurrencyResource, vendrShippingMethodResource, vendrPaymentMethodResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var id = compositeId[1];
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

        vm.page.navigation = [
            {
                'name': 'Settings',
                'alias': 'settings',
                'icon': 'icon-settings',
                'view': '/App_Plugins/Vendr/backoffice/views/country/subviews/settings.html',
                'active': !$routeParams["view"] || $routeParams["view"] === 'settings'
            }
        ];

        if (!create) {
            vm.page.navigation.push({
                'name': 'Regions',
                'alias': 'regions',
                'icon': 'icon-flag-alt',
                'view': '/App_Plugins/Vendr/backoffice/views/country/subviews/regions.html',
                'active': $routeParams["view"] === 'regions'
            });
        }

        vm.options = {
            currencies: [],
            shippingMethods: [],
            paymentMethods: [],
            editorActions: [],
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/country-list/" + vendrUtils.createCompositeId([storeId])).search({});
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Country' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrCurrencyResource.getCurrencies(storeId).then(function (currencies) {
                vm.options.currencies = currencies;
            });

            vendrShippingMethodResource.getShippingMethods(storeId).then(function (shippingMethods) {
                vm.options.shippingMethods = shippingMethods;
            });

            vendrPaymentMethodResource.getPaymentMethods(storeId).then(function (paymentMethods) {
                vm.options.paymentMethods = paymentMethods;
            });

            if (create) {

                vendrCountryResource.createCountry(storeId).then(function (country) {
                    vm.ready(country);
                });

            } else {

                vendrCountryResource.getCountry(id).then(function (country) {
                    vm.ready(country);
                });

            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            if (create && $routeParams['preset'] === 'true') {
                vm.content.name = $routeParams['name'];
                vm.content.code = $routeParams['code'];
                vm.content.presetIsoCode = $routeParams['code'];
            }

            // sync state
            editorState.set(vm.content);

            var pathToSync = create ? vm.content.path : vm.content.path.slice(0, -1);
            navigationService.syncTree({ tree: "vendrsettings", path: pathToSync, forceReload: true }).then(function (syncArgs) {
                if (!create) {
                    treeService.getChildren({ node: syncArgs.node }).then(function (children) {
                        var node = children.find(function (itm) {
                            return itm.id === id;
                        });
                        vm.page.menu.currentNode = node;
                        vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(node);
                    });
                } else {
                    vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                    vm.page.breadcrumb.items.push({ name: 'Untitled' });
                }
            });
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrCountryResource.saveCountry(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save country " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'Country' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.CountryEditController', CountryEditController);

}());