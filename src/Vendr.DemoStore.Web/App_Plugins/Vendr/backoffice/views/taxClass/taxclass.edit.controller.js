(function () {

    'use strict';

    function TaxClassEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, treeService, navigationService,
        vendrUtils, vendrTaxResource, vendrCountryResource, vendrActions) {

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
            countryRegions: [],
            editorActions: []
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/taxclass-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'TaxClass' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrCountryResource.getCountriesWithRegions(storeId).then(function (countries) {
                countries.forEach(function (country) {

                    Object.defineProperty(country, "taxRate", {
                        get: function () {
                            if (!vm.content.countryRegionTaxRates)
                                return "";

                            var idx = vm.content.countryRegionTaxRates.findIndex(function (itm) {
                                return itm.countryId === country.id && !itm.regionId;
                            });

                            return idx > -1 ? vm.content.countryRegionTaxRates[idx].taxRate : "";
                        },
                        set: function (value) {
                            if (!vm.content.countryRegionTaxRates)
                                vm.content.countryRegionTaxRates = [];

                            var idx = vm.content.countryRegionTaxRates.findIndex(function (itm) {
                                return itm.countryId === country.id && !itm.regionId;
                            });

                            if (idx > -1) {
                                if (value) {
                                    vm.content.countryRegionTaxRates[idx].taxRate = value;
                                } else {
                                    vm.content.countryRegionTaxRates.splice(idx, 1);
                                }
                            } else {
                                vm.content.countryRegionTaxRates.push({ countryId: country.id, regionId: null, taxRate: value });
                            }
                        }
                    });

                    country.regions = country.regions || [];
                    country.regions.forEach(function (region) {

                        Object.defineProperty(region, "taxRate", {
                            get: function () {
                                if (!vm.content.countryRegionTaxRates)
                                    return "";

                                var idx = vm.content.countryRegionTaxRates.findIndex(function (itm) {
                                    return itm.countryId === country.id && itm.regionId === region.id;
                                });

                                return idx > -1 ? vm.content.countryRegionTaxRates[idx].taxRate : "";
                            },
                            set: function (value) {
                                if (!vm.content.countryRegionTaxRates)
                                    vm.content.countryRegionTaxRates = [];

                                var idx = vm.content.countryRegionTaxRates.findIndex(function (itm) {
                                    return itm.countryId === country.id && itm.regionId === region.id;
                                });

                                if (idx > -1) {
                                    if (value) {
                                        vm.content.countryRegionTaxRates[idx].taxRate = value;
                                    } else {
                                        vm.content.countryRegionTaxRates.splice(idx, 1);
                                    }
                                } else {
                                    vm.content.countryRegionTaxRates.push({ countryId: country.id, regionId: region.id, taxRate: value });
                                }
                            }
                        });

                    });

                    vm.options.countryRegions = countries;
                });
            });

            if (create) {

                vendrTaxResource.createTaxClass(storeId).then(function (taxClass) {
                    vm.ready(taxClass);
                });

            } else {

                vendrTaxResource.getTaxClass(id).then(function (taxClass) {
                    vm.ready(taxClass);
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

                vendrTaxResource.saveTaxClass(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/taxclass-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save tax class " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'TaxClass' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.TaxClassEditController', TaxClassEditController);

}());