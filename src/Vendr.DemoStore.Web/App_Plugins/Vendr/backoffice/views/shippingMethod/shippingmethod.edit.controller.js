﻿(function () {

    'use strict';

    function ShippingMethodEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, treeService, navigationService, editorService,
        vendrUtils, vendrShippingMethodResource, vendrCountryResource, vendrCurrencyResource, vendrTaxResource, vendrActions) {

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
            taxClasses: [],
            currencies: [],
            countryRegions: [],
            editorActions: []
        };
        vm.content = {
            defaultPrices: []
        };

        vm.back = function () {
            $location.path("/settings/vendrsettings/shippingmethod-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.openCustomPricesDialog = function (countryRegion) {

            var isCountry = !countryRegion.countryId;
            var countryId = isCountry ? countryRegion.id : countryRegion.countryId;
            var regionId = isCountry ? null : countryRegion.id;

            var dialogConfig = {
                view: '/App_Plugins/Vendr/backoffice/views/dialogs/custompricingedit.html',
                size: 'small',
                config: {
                    currencies: vm.options.currencies,
                    countryRegion: countryRegion,
                    countryId: countryId,
                    regionId: regionId,
                    name: countryRegion.name,
                    prices: vm.content.prices.filter(function (itm) {
                        return itm.countryId === countryId && itm.regionId === regionId;
                    })
                },
                submit: function (model) {

                    // Get all prices excluding ones for this country/region
                    var prices = vm.content.prices.filter(function (itm) {
                        return !(itm.countryId === countryId && itm.regionId === regionId);
                    });

                    // Add country region prices back in
                    if (model && model.length > 0) {
                        model.forEach(function (itm) {
                            itm.countryId = countryId;
                            itm.regionId = regionId;
                            prices.push(itm);
                        });
                    }

                    // Update the content model
                    vm.content.prices = prices;

                    // Close the dialog
                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            };

            editorService.open(dialogConfig);

        };

        vm.buildDefaultPrices = function () {

            var defaultPrices = [];

            vm.options.currencies.forEach(function (currency) {

                var defaultPrice = {
                    currencyCode: currency.code,
                    currencyId: currency.id
                };

                var findFun = function (itm) {
                    return itm.currencyId === defaultPrice.currencyId
                        && (!itm.countryId || itm.countryId === null)
                        && (!itm.regionId || itm.regionId === null);
                };

                Object.defineProperty(defaultPrice, "value", {
                    get: function () {
                        if (!vm.content.prices) return '';
                        var itm = vm.content.prices.find(findFun);
                        return itm ? itm.value : '';
                    },
                    set: function (value) {
                        if (!vm.content.prices)
                            vm.content.prices = [];
                        var idx = vm.content.prices.findIndex(findFun);
                        if (value !== "" && !isNaN(value)) {
                            if (idx === -1) {
                                vm.content.prices.push({
                                    currencyId: defaultPrice.currencyId,
                                    countryId: null,
                                    regionId: null,
                                    value: value
                                });
                            } else {
                                vm.content.prices[idx].value = value;
                            }
                        } else {
                            if (idx !== -1) vm.content.prices.splice(idx, 1);
                        }
                    }
                });

                defaultPrices.push(defaultPrice);

            });

            vm.content.defaultPrices = defaultPrices;
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'ShippingMethod' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrTaxResource.getTaxClasses(storeId).then(function (taxClasses) {
                vm.options.taxClasses = taxClasses;
            });

            vendrCurrencyResource.getCurrencies(storeId).then(function (currencies) {
                vm.options.currencies = currencies;
            });

            vendrCountryResource.getCountriesWithRegions(storeId).then(function (countries) {

                countries.forEach(function (country) {

                    var countryFindFn = function (itm) {
                        return itm.countryId === country.id && (!itm.regionId || itm.regionId === null);
                    };

                    Object.defineProperty(country, "checked", {
                        get: function () {
                            return vm.content.allowedCountryRegions
                                && vm.content.allowedCountryRegions.findIndex(countryFindFn) > -1;
                        },
                        set: function (value) {
                            if (!vm.content.allowedCountryRegions)
                                vm.content.allowedCountryRegions = [];
                            var idx = vm.content.allowedCountryRegions.findIndex(countryFindFn);
                            if (value) {
                                if (idx === -1) vm.content.allowedCountryRegions.push({
                                    countryId: country.id,
                                    regionId: null
                                });
                            } else {
                                if (idx !== -1) vm.content.allowedCountryRegions.splice(idx, 1);
                                if (country.regions && country.regions.length > 0) {
                                    country.regions.forEach(function (region) {
                                        region.checked = false;
                                    });
                                }
                            }
                        }
                    });

                    Object.defineProperty(country, "description", {
                        get: function () {
                            if (!country.checked) return '';
                            if (!vm.content.prices || vm.content.prices.length === 0) return '';
                            var prices = vm.content.prices.filter(countryFindFn).map(function (itm) {
                                var currency = vm.options.currencies.find(function (itm2) {
                                    return itm2.id === itm.currencyId;
                                });
                                return (currency ? currency.code : itm.currencyId) + " " + Number(itm.value).toFixed(2);
                            });
                            return prices.join(" | ");
                        }
                    });

                    if (country.regions && country.regions.length > 0) {

                        country.regions.forEach(function (region) {

                            var countryRegionFindFn = function (itm) {
                                return itm.countryId === region.countryId && itm.regionId === region.id;
                            };

                            Object.defineProperty(region, "checked", {
                                get: function () {
                                    return vm.content.allowedCountryRegions
                                        && vm.content.allowedCountryRegions.findIndex(countryRegionFindFn) > -1;
                                },
                                set: function (value) {
                                    if (!vm.content.allowedCountryRegions)
                                        vm.content.allowedCountryRegions = [];
                                    var idx = vm.content.allowedCountryRegions.findIndex(countryRegionFindFn);
                                    if (value) {
                                        if (idx === -1) vm.content.allowedCountryRegions.push({
                                            countryId: region.countryId,
                                            regionId: region.id
                                        });
                                    } else {
                                        if (idx !== -1) vm.content.allowedCountryRegions.splice(idx, 1);
                                    }
                                }
                            });

                            Object.defineProperty(region, "description", {
                                get: function () {
                                    if (!region.checked) return '';
                                    if (!vm.content.prices || vm.content.prices.length === 0) return '';
                                    var prices = vm.content.prices.filter(countryRegionFindFn).map(function (itm) {
                                        var currency = vm.options.currencies.find(function (itm2) {
                                            return itm2.id === itm.currencyId;
                                        });
                                        return (currency ? currency.code : itm.currencyId) + " " + Number(itm.value).toFixed(2);
                                    });
                                    return prices.join(" | ");
                                }
                            });

                        });

                    }

                });

                vm.options.countryRegions = countries;
            });

            if (create) {

                vendrShippingMethodResource.createShippingMethod(storeId).then(function (shippingMethod) {
                    vm.ready(shippingMethod);
                });

            } else {

                vendrShippingMethodResource.getShippingMethod(id).then(function (shippingMethod) {
                    vm.ready(shippingMethod);
                });

            }
        };

        vm.ready = function (model) {

            // Format values
            if (model.prices) {
                model.prices.forEach(function (itm) {
                    itm.value = itm.value || itm.value === 0 ? Number(itm.value).toFixed(2) : '';
                });
            }

            // Sync editor
            vm.page.loading = false;
            vm.content = model;
            editorState.set(vm.content);

            // Sync tree / breadcrumb
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

                vendrShippingMethodResource.saveShippingMethod(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/shippingmethod-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save shipping method " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        // We need to rebuild the default prices whenever the countries / content items change
        // so watch them and rebuild when this happens
        $scope.$watchGroup(['vm.content', 'vm.options.currencies'], function () {
            if (vm.content && vm.content.storeId && vm.options.currencies && vm.options.currencies.length > 0) {
                vm.buildDefaultPrices();
            }
        });

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'ShippingMethod' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.ShippingMethodEditController', ShippingMethodEditController);

}());