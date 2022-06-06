(function () {

    'use strict';

    function CurrencyEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrCurrencyResource, vendrCultureResource, vendrCountryResource, vendrActions) {

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

        vm.options = {
            cultures: [],
            countries: [],
            editorActions: [],
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/currency-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Currency' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrCultureResource.getCultures().then(function (cultures) {
                vm.options.cultures = cultures;
            });

            vendrCountryResource.getCountries(storeId).then(function (countries) {

                countries.forEach(function (country) {

                    Object.defineProperty(country, "checked", {
                        get: function () {
                            return vm.content.allowedCountries
                                && vm.content.allowedCountries.findIndex(function (itm) {
                                    return itm.countryId === country.id;
                                }) > -1;
                        },
                        set: function (value) {
                            if (!vm.content.allowedCountries)
                                vm.content.allowedCountries = [];
                            var idx = vm.content.allowedCountries.findIndex(function (itm) {
                                return itm.countryId === country.id;
                            });
                            if (value) {
                                if (idx === -1) vm.content.allowedCountries.push({ countryId: country.id });
                            } else {
                                if (idx !== -1) vm.content.allowedCountries.splice(idx, 1);
                            }
                        }
                    });

                });

                vm.options.countries = countries;

            });

            if (create) {

                vendrCurrencyResource.createCurrency(storeId).then(function (currency) {
                    vm.ready(currency);
                });

            } else {

                vendrCurrencyResource.getCurrency(id).then(function (currency) {
                    vm.ready(currency);
                });

            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

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

                vendrCurrencyResource.saveCurrency(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/currency-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save currency " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'Currency' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.CurrencyEditController', CurrencyEditController);

}());