(function () {

    'use strict';

    function CountryCreateController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService,
        vendrUtils, vendrCountryResource) {

        var storeId = $scope.currentNode.metaData['storeId'];
        
        var vm = this;

        vm.options = {
            presets: [],
            selectPreset: false
        };

        vm.init = function () {

            vendrCountryResource.getIso3166CountryRegions().then(function (data) {
                vm.options.presets = data;
            });

        };

        vm.createNew = function () {
            $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, -1]))
                .search("preset", "false");
            navigationService.hideMenu();
        };

        vm.createNewFromPreset = function (preset) {
            $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, -1]))
                .search("preset", "true")
                .search("code", preset.code)
                .search("name", preset.name);
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

    angular.module('vendr').controller('Vendr.Controllers.CountryCreateController', CountryCreateController);

}());
(function () {

    'use strict';

    function CountryEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrCountryResource, vendrCurrencyResource, vendrShippingMethodResource, vendrPaymentMethodResource) {

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
                'view': '/app_plugins/vendr/views/country/subviews/settings.html',
                'active': !$routeParams["view"] || $routeParams["view"] === 'settings'
            }
        ];

        if (!create) {
            vm.page.navigation.push({
                'name': 'Regions',
                'alias': 'regions',
                'icon': 'icon-flag-alt',
                'view': '/app_plugins/vendr/views/country/subviews/regions.html',
                'active': $routeParams["view"] === 'regions'
            });
        }

        vm.options = {
            currencies: [],
            shippingMethods: [],
            paymentMethods: []
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/country-list/" + vendrUtils.createCompositeId([storeId])).search({});
        };

        vm.init = function () {

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
(function () {

    'use strict';

    function CountryListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrCountryResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrCountryResource.deleteCountry(bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") +"?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                { alias: 'code', header: 'ISO Code' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrCountryResource.getCountries(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/country-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",5", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Country',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Country' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.CountryListController', CountryListController);

}());
(function () {

    'use strict';

    function CurrencyEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrCurrencyResource, vendrCultureResource, vendrCountryResource) {

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
            countries: []
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/currency-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

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
(function () {

    'use strict';

    function CurrencyListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrCurrencyResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrCurrencyResource.deleteCurrency(bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") +"?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                { alias: 'code', header: 'ISO Code' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrCurrencyResource.getCurrencies(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/currency-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",6", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Currency',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Currency' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.CurrencyListController', CurrencyListController);

}());
(function () {

    'use strict';

    function CommerceDashboardController($scope, $routeParams, $location,
        assetsService, dashboardResource) {

        assetsService.loadCss(dashboardResource.getRemoteDashboardCssUrl("content"), $scope);

    };

    angular.module('vendr').controller('Vendr.Controllers.CommerceDashboardController', CommerceDashboardController);

}());
(function () {

    'use strict';

    function CustomPricingEditDialogController($scope) {

        var cfg = $scope.model.config;

        var vm = this;

        vm.page = {};
        vm.page.name = cfg.name;
        vm.page.saveButtonState = 'init';

        vm.content = {
            customPrices: []
        };

        vm.init = function () {

            var customPrices = [];

            cfg.currencies.forEach(function (currency) {

                // Prices should be pre-filtered by country region at this point
                // so we should be ok to just find by currency id
                var price = cfg.prices.find(function (itm) {
                    return itm.currencyId === currency.id;
                });

                var customPrice = {
                    currencyCode: currency.code,
                    currencyId: currency.id,
                    value: price ? price.value : ''
                };

                customPrices.push(customPrice);

            });

            vm.customPrices = customPrices;

        };

        vm.save = function () {

            var model = [];

            vm.customPrices.forEach(function (customPrice) {
                if (customPrice.value || customPrice.value === 0) {
                    model.push({
                        currencyId: customPrice.currencyId,
                        value: customPrice.value
                    });
                }
            });
            
            $scope.model.submit(model);
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.CustomPricingEditDialogController', CustomPricingEditDialogController);

}());
(function () {

    'use strict';

    function DictionaryEditDialogController($scope, $timeout, editorState,
        notificationsService, formHelper, contentEditingHelper,
        vendrDictionaryResource, languageResource) {

        var cfg = $scope.model.config;
        var id = cfg.id;
        var create = id === '-1';

        var vm = this;

        vm.page = {};
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';

        vm.options = {};
        vm.content = {};

        vm.nameDirty = false;

        vm.init = function () {

            if (!create) {

                vendrDictionaryResource.getDictionaryItemById(id).then(function (entity) {
                    vm.ready(entity);
                });

            } else {

                var template = {
                    id: -1,
                    name: cfg.name,
                    translations: []
                };

                languageResource.getAll().then(function (languages) {
                    languages.forEach(function (itm) {
                        template.translations.push({
                            isoCode: itm.culture,
                            languageId: itm.id,
                            displayName: itm.name,
                            translation: cfg.value || ''
                        });
                    });
                });

                vm.ready(template);
            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            //share state
            editorState.set(vm.content);
        };

        vm.save = function () {

            var doSave = function (model, nameDirty) {
                model.nameIsDirty = nameDirty;
                return vendrDictionaryResource.saveDictionaryItem(model).then(function (data) {
                        formHelper.resetForm({ scope: $scope, notifications: data.notifications });
                        vm.page.saveButtonState = "success";
                        $timeout(function () {
                            $scope.model.submit({ key: data.name });
                        }, 500);
                    },
                    function (err) {
                        vm.page.saveButtonState = "error";
                        contentEditingHelper.handleSaveError({
                            redirectOnFailure: false,
                            err: err
                        });
                        notificationsService.error(err.data.message || err.data.Message);
                    });
            };

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                // Umbraco expects dictionary items to exist before we can
                // post save, so we have to call create first
                if (create) {
                    vendrDictionaryResource.createDictionaryItem(cfg.parentId, vm.content.name).then(function (entity) {
                        vm.content.id = entity.id;
                        vm.content.key = entity.key;
                        vm.content.parentId = entity.parentId;
                        vm.nameDirty = false;
                        doSave(vm.content, vm.nameDirty);
                    });
                } else {
                    doSave(vm.content, vm.nameDirty);
                }
            }

        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();

        $scope.$watch("vm.content.name", function (newVal, oldVal) {
            //when the value changes, we need to set the name dirty
            if (newVal && (newVal !== oldVal) && typeof (oldVal) !== "undefined") {
                vm.nameDirty = true;
            }
        });
    }

    angular.module('vendr').controller('Vendr.Controllers.DictionaryEditDialogController', DictionaryEditDialogController);

}());
(function () {

    'use strict';

    function DiscountRewardProviderPickerDialogController($scope, $q,
        vendrDiscountResource, vendrRouteCache)
    {
        var defaultConfig = {
            title: "Select Reward",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function () {
            return vendrRouteCache.getOrFetch("discountRewardProviderDefs", function () {
                return vendrDiscountResource.getDiscountRewardProviderDefinitions();
            });
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.DiscountRewardProviderPickerDialogController', DiscountRewardProviderPickerDialogController);

}());
(function () {

    'use strict';

    function DiscountRuleProviderPickerDialogController($scope, $q,
        vendrDiscountResource, vendrRouteCache)
    {
        var defaultConfig = {
            title: "Select Rule",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function () {
            return vendrRouteCache.getOrFetch("discountRuleProviderDefs", function () {
                return vendrDiscountResource.getDiscountRuleProviderDefinitions();
            });
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.DiscountRuleProviderPickerDialogController', DiscountRuleProviderPickerDialogController);

}());
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
            return vendrEmailTemplateResource.getEmailTemplates(vm.config.storeId, vm.config.onlySendable);
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
(function () {

    'use strict';

    function OrderStatusPickerDialogController($scope,
        vendrOrderStatusResource)
    {
        var defaultConfig = {
            title: "Select an Order Status",
            enableFilter: true,
            orderBy: "sortOrder"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrOrderStatusResource.getOrderStatuses(vm.config.storeId);
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.OrderStatusPickerDialogController', OrderStatusPickerDialogController);

}());
(function () {

    'use strict';

    function SettingsEditorDialogController($scope, formHelper)
    {
        var cfg = $scope.model.config;

        var vm = this;

        vm.loading = true;

        vm.page = {};
        vm.page.name = cfg.name;
        vm.page.saveButtonState = 'init';

        vm.settings = angular.copy(cfg.settings);
        vm.options = {
            settingDefinitions: []
        };

        vm.init = function () {
            cfg.loadSettingDefinitions().then(function (settingDefinitions) {

                var defs = settingDefinitions.map((itm) => angular.copy(itm));

                // Remap setting definitions into an Umbraco property model
                defs.forEach(function (itm) {

                    itm.alias = itm.key;
                    itm.label = itm.name;

                    Object.defineProperty(itm, "value", {
                        get: function () {
                            return vm.settings[itm.alias];
                        },
                        set: function (value) {
                            vm.settings[itm.alias] = value;
                        }
                    });

                });

                vm.options.settingDefinitions = defs;

                vm.loading = false;
            });
        };

        vm.save = function () {
            if (formHelper.submitForm({ scope: $scope })) {
                $scope.model.submit(vm.settings);
            }
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.SettingsEditorDialogController', SettingsEditorDialogController);

}());
(function () {

    'use strict';

    function StoreEntityPickerDialogController($scope, vendrEntityResource)
    {
        var defaultConfig = {
            title: "Select Entity",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.config.title = "Select "+ vm.config.entityType.replace(/([A-Z])/g, ' $1');

        vm.loadItems = function() {
            return vendrEntityResource.getEntities(vm.config.entityType, vm.config.storeId);
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.StoreEntityPickerDialogController', StoreEntityPickerDialogController);

}());
(function () {

    'use strict';

    function StorePickerDialogController($scope,
        vendrStoreResource)
    {
        var defaultConfig = {
            title: "Select Store",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrStoreResource.getStores();
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.StorePickerDialogController', StorePickerDialogController);

}());
(function () {

    'use strict';

    function TaxClassPickerDialogController($scope,
        vendrTaxResource)
    {
        var defaultConfig = {
            title: "Select Tax Class",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrTaxResource.getTaxClasses(vm.config.storeId);
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.TaxClassPickerDialogController', TaxClassPickerDialogController);

}());
(function () {

    'use strict';

    function DiscountEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService, dateHelper, userService,
        vendrUtils, vendrDiscountResource, vendrStoreResource, vendrRouteCache) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var storeAlias = storeId; // Set store alias to id for now as a fallback
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

        vm.currentUser = null;

        vm.content = {};
        vm.localStartDate = null;
        vm.localExpiryDate = null;
        vm.options = {
            discountTypes: ['Automatic', 'Code']
        };

        vm.back = function () {
            $location.path("/commerce/vendr/discount-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.addDiscountCode = function () {
            vm.content.codes = vm.content.codes || [];
            vm.content.codes.push({ id: vendrUtils.generateGuid(), code: '', usageLimit: '' });
        };

        vm.removeDiscountCode = function (itm, idx) {
            vm.content.codes = vm.content.codes || [];
            vm.content.codes.splice(idx, 1);
        };

        vm.startDatePickerConfig = {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true
        };
        vm.startDatePickerSetup = function (instance) {
            vm.startDatePickerInstance = instance;
        };
        vm.startDatePickerChange = function (dateStr, instance) {
            if (dateStr) {
                // Convert dates to server timezone
                var serverTime = dateHelper.convertToServerStringTime(moment(dateStr), Umbraco.Sys.ServerVariables.application.serverTimeOffset);
                vm.content.startDate = serverTime;
                // Limit expiry date
                vm.expiryDatePickerInstance.set("minDate", dateStr);
            }
        };
        vm.clearStartDate = function () {
            vm.startDatePickerInstance.clear();
            vm.content.startDate = null;
            vm.expiryDatePickerInstance.set("minDate", null);
        };

        vm.expiryDatePickerConfig = {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true
        };
        vm.expiryDatePickerSetup = function (instance) {
            vm.expiryDatePickerInstance = instance;
        };
        vm.expiryDatePickerChange = function (dateStr, instance) {
            if (dateStr) {
                // Convert dates to server timezone
                var serverTime = dateHelper.convertToServerStringTime(moment(dateStr), Umbraco.Sys.ServerVariables.application.serverTimeOffset);
                vm.content.expiryDate = serverTime;
                // Limit expiry date
                vm.startDatePickerInstance.set("maxDate", dateStr);
            }
        };
        vm.clearExpiryDate = function () {
            vm.expiryDatePickerInstance.clear();
            vm.content.expiryDate = null;
            vm.startDatePickerInstance.set("maxDate", null);
        };

        vm.init = function () {

            vendrRouteCache.getOrFetch("currentStore", function () {
                return vendrStoreResource.getBasicStore(storeId);
            })
            .then(function (store) {
                storeAlias = store.alias;
            });
            
            userService.getCurrentUser().then(function (currentUser) {
                vm.currentUser = currentUser;

                if (create) {

                    vendrDiscountResource.createDiscount(storeId).then(function (discount) {
                        vm.ready(discount);
                    });

                } else {

                    vendrDiscountResource.getDiscount(id).then(function (discount) {
                        vm.ready(discount);
                    });

                }

            });
        };

        vm.ready = function (model) {
            vm.page.loading = false;

            // Prepare model
            model.rewards = model.rewards || [];

            vm.content = model;

            // sync state
            editorState.set(vm.content);

            // Localize dates
            if (vm.content.startDate)
                vm.localStartDate = dateHelper.getLocalDate(vm.content.startDate, vm.currentUser.locale, "YYYY-MM-DD HH:mm");

            if (vm.content.expiryDate)
                vm.localExpiryDate = dateHelper.getLocalDate(vm.content.expiryDate, vm.currentUser.locale, "YYYY-MM-DD HH:mm");



            var pathToSync = create ? vm.content.path : vm.content.path.slice(0, -1);
            navigationService.syncTree({ tree: "vendr", path: pathToSync, forceReload: true }).then(function (syncArgs) {
                if (!create) {
                    treeService.getChildren({ node: syncArgs.node }).then(function (children) {
                        var node = children.find(function (itm) {
                            return itm.id === id;
                        });
                        vm.page.menu.currentNode = node;
                        vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(node);
                    });
                } else {
                    vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                    vm.page.breadcrumb.items.push({ name: 'Untitled' });
                }
            });
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrDiscountResource.saveDiscount(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/commerce/vendr/discount-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save discount " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'Discount' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.DiscountEditController', DiscountEditController);

}());
(function () {

    'use strict';

    function DiscountListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrDiscountResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrDiscountResource.deleteDiscount(bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") +"?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                { alias: 'name', template: '<span class="vendr-table-cell-value--multiline"><span>{{name}}</span>{{ blockFurtherDiscounts ? \'<span class="vendr-table-cell-label" style="font-size: 12px;"><i class="fa fa-minus-circle color-red"></i> Blocks all further discounts if applied</span>\' : \'\' }}{{ blockIfPreviousDiscounts ? \'<span class="vendr-table-cell-label" style="font-size: 12px;"><i class="fa fa-chevron-circle-up color-orange"></i> Is not applied if previous discounts already apply</span></span>\' : \'\' }}' },
                { alias: 'type', header: 'Type', template: '<span class="umb-badge umb-badge--xs vendr-bg--{{ typeColor }}">{{ type }}</span>' },
                { alias: 'status', header: 'Status', template: '<span class="umb-badge umb-badge--xs vendr-bg--{{ statusColor }}">{{ status }}</span>' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrDiscountResource.getDiscounts(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/commerce/vendr/discount-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",2", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Discount',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Discount' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.DiscountListController', DiscountListController);

}());
(function () {

    'use strict';

    function EmailTemplateEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrEmailTemplateResource, vendrStoreResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var storeAlias = storeId; // Set store alias to id for now as a fallback
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
            dictionaryInputOptions: {
                containerKey: "Vendr",
                generateKey: function (fldName) {
                    return "vendr_" + storeAlias.toLowerCase() + "_emailtemplate_" + (vm.content.alias || scope.$id).toLowerCase() + "_" + fldName.toLowerCase();
                }
            }
        };

        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/emailtemplate-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

            vendrStoreResource.getStoreAlias(storeId).then(function (alias) {
                storeAlias = alias;
            });

            if (create) {

                vendrEmailTemplateResource.createEmailTemplate(storeId).then(function (emailTemplate) {
                    vm.ready(emailTemplate);
                });

            } else {

                vendrEmailTemplateResource.getEmailTemplate(id).then(function (emailTemplate) {
                    vm.ready(emailTemplate);
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

                vendrEmailTemplateResource.saveEmailTemplate(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/emailtemplate-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save email template " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'EmailTemplate' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.EmailTemplateEditController', EmailTemplateEditController);

}());
(function () {

    'use strict';

    function EmailTemplateListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrEmailTemplateResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrEmailTemplateResource.deleteEmailTemplate(bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") +"?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                // { alias: 'defaultTaxRate', header: 'Default Tax Rate' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrEmailTemplateResource.getEmailTemplates(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/emailtemplate-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",8", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Email Template',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'EmailTemplate' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.EmailTemplateListController', EmailTemplateListController);

}());
(function () {
     
    'use strict';

    function EntityDeleteController($scope, $rootScope, $location,
        treeService, navigationService, notificationsService , editorState,
        vendrUtils, vendrEntityResource) {

        var currentNode = $scope.currentNode;
        var tree = currentNode.metaData['tree'];
        var nodeType = currentNode.nodeType;
        var storeId = currentNode.metaData['storeId'];
        var parentId = currentNode.parentId;
        var id = currentNode.id;

        var vm = this;
        vm.saveButtonState = 'init';
        vm.currentNode = currentNode;

        vm.performDelete = function () {

            // Prevent double clicking casuing additional delete requests
            vm.saveButtonState = 'busy';

            // Update node UI to show something is happening
            vm.currentNode.loading = true;

            // Reset the error message
            vm.error = null;

            // Perform the delete
            vendrEntityResource.deleteEntity(nodeType, id, storeId, parentId)
                .then(function () {

                    // Stop tree node animation
                    vm.currentNode.loading = false;

                    // Remove the node from the tree
                    try {
                        treeService.removeNode(vm.currentNode);
                    } catch (err) {
                        // If there is an error, the tree probably doesn't show children
                    }

                    // Close the menu
                    navigationService.hideMenu();

                    // Show notification
                    notificationsService.success("Entity deleted", "Entity '" + currentNode.name + "' successfully deleted");

                    // Notify views
                    $rootScope.$broadcast("vendrEntityDeleted", {
                        entityType: nodeType,
                        entityId: id,
                        storeId: storeId,
                        parentId: parentId
                    });

                    // If we have deleted a store, then regardless, navigate back to tree root
                    var editing = editorState.getCurrent();
                    if (nodeType === 'Store' && storeId === editing.storeId) {
                        $location.path("/settings/vendrsettings/view-settings/");
                    }

                }, function (err) {

                    // Stop tree node animation
                    vm.currentNode.loading = false;

                    // Set the error object
                    vm.error = err;

                    // Set not busy
                    vm.saveButtonState = 'error';
                });
        };

        vm.cancel = function () {
            navigationService.hideDialog();
        };

    };

    angular.module('vendr').controller('Vendr.Controllers.EntityDeleteController', EntityDeleteController);

}());
(function () {

    'use strict';

    function EntitySortController($scope, $rootScope, $location, $filter,
        navigationService, notificationsService, vendrEntityResource) {
        
        var currentNode = $scope.currentNode;
        var tree = currentNode.metaData['tree'];
        var nodeType = currentNode.metaData['childNodeType'] || currentNode.nodeType;
        var storeId = currentNode.metaData['storeId'];
        var id = currentNode.id;
        var isListView = currentNode.metaData['isListView'];

        var vm = this;

        vm.loading = false;
        vm.saveButtonState = "init";

        vm.sortOrder = {};
        vm.sortableOptions = {
            distance: 10,
            tolerance: "pointer",
            opacity: 0.7,
            scroll: true,
            cursor: "move",
            helper: function (e, ui) {
                // keep the correct width of each table cell when sorting
                ui.children().each(function () {
                    $(this).width($(this).width());
                });
                return ui;
            },
            update: function () {
                // clear the sort order when drag and drop is used
                vm.sortOrder.column = "";
                vm.sortOrder.reverse = false;
            }
        };

        vm.children = [];

        vm.init = function () {
            vm.loading = true;
            vendrEntityResource.getEntities(nodeType, storeId, id).then(function (items) {
                vm.children = items;
                vm.loading = false;
            });
        };

        vm.sort = function (column) {
            // reverse if it is already ordered by that column
            if (vm.sortOrder.column === column) {
                vm.sortOrder.reverse = !vm.sortOrder.reverse;
            } else {
                vm.sortOrder.column = column;
                vm.sortOrder.reverse = false;
            }
            vm.children = $filter('orderBy')(vm.children, vm.sortOrder.column, vm.sortOrder.reverse);
        };

        vm.save = function () {

            vm.saveButtonState = "busy";

            var sortedIds = _.map(vm.children, function (child) { return child.id; });
            vendrEntityResource.sortEntities(nodeType, sortedIds, storeId, id).then(function () {
                vm.saveButtonState = "success";
                notificationsService.success("Entities sorted", sortedIds.length + " entities sorted successfully");
                if (isListView) {
                    $rootScope.$broadcast("vendrEntitiesSorted", {
                        entityType: nodeType,
                        storeId: storeId,
                        parentId: id
                    });
                } else {
                    navigationService.syncTree({ tree: tree, path: currentNode.path, forceReload: true })
                        .then(() => navigationService.reloadNode(currentNode));
                }
                navigationService.hideDialog();
            }, function (error) {
                vm.error = error;
                vm.saveButtonState = "error";
           });

        };

        vm.cancel = function () {
            navigationService.hideDialog();
        };

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.EntitySortController', EntitySortController);

}());
(function () {

    'use strict';

    function GiftCardListController($scope, $rootScope, $routeParams, vendrUtils) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);

        $scope.storeId = compositeId[0];

    };

    angular.module('vendr').controller('Vendr.Controllers.GiftCardListController', GiftCardListController);

}());
(function () {

    'use strict';

    function OrderStatusEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrOrderStatusResource) {

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

        vm.options = {};
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/orderstatus-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

            if (create) {

                vendrOrderStatusResource.createOrderStatus(storeId).then(function (orderStatus) {
                    vm.ready(orderStatus);
                });

            } else {

                vendrOrderStatusResource.getOrderStatus(id).then(function (orderStatus) {
                    vm.ready(orderStatus);
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

                vendrOrderStatusResource.saveOrderStatus(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/orderstatus-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save order status " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'OrderStatus' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.OrderStatusEditController', OrderStatusEditController);

}());
(function () {

    'use strict';

    function OrderStatusListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrOrderStatusResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrOrderStatusResource.deleteOrderStatus(bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") +"?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                { alias: 'color', header: 'Color', template: '<span class="vendr-color-swatch vendr-bg--{{color}}" title="Color: {{color}}"></span>' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrOrderStatusResource.getOrderStatuses(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/orderstatus-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",2", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Order Status',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'OrderStatus' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.OrderStatusListController', OrderStatusListController);

}());
(function () {

    'use strict';

    function EditCustomerDetailsController($scope, vendrOrderResource,
        vendrCountryResource)
    {
        var order = $scope.model.config.order;

        var vm = this;
        vm.title = "Edit Customer Details";
        vm.editorConfig = $scope.model.config.editorConfig;
        vm.content = {
            customerFirstName: order.customerFirstName,
            customerLastName: order.customerLastName,
            customerEmail: order.customerEmail,
            paymentCountryId: order.paymentCountryId,
            paymentCountry: order.paymentCountry,
            paymentRegionId: order.paymentCountryId,
            paymentRegion: order.paymentRegion,
            shippingCountryId: order.shippingCountryId,
            shippingCountry: order.shippingCountry,
            shippingRegionId: order.paymentCountryId,
            shippingRegion: order.paymentCountry,
            properties: {}
        };

        ensureProperties(vm.editorConfig.customer);
        ensureProperties(vm.editorConfig.billing);
        ensureProperties(vm.editorConfig.shipping);

        vm.options = {
            countries: [],
            shippingSameAsBilling: vm.editorConfig.shipping.sameAsBilling && vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value == vm.editorConfig.shipping.sameAsBilling.trueValue
        };

        vm.toggleShippingSameAsBilling = function () {
            if (vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value == vm.editorConfig.shipping.sameAsBilling.trueValue) {
                vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value = vm.editorConfig.shipping.sameAsBilling.falseValue;
            } else {
                vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value = vm.editorConfig.shipping.sameAsBilling.trueValue;
            }
            vm.options.shippingSameAsBilling = vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value == vm.editorConfig.shipping.sameAsBilling.trueValue;
        };

        vm.save = function () {
            if ($scope.model.submit) {
                $scope.model.submit(vm.content);
            }
        };

        vm.cancel = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };

        function ensureProperties (cfg) {
            for (const prop in cfg) {
                var alias = cfg[prop].alias;
                vm.content.properties[alias] = order.properties[alias] || { value: "", isReadOnly: false, isServerSideOnly: false };
            }
        }
    }

    angular.module('vendr').controller('Vendr.Controllers.EditCustomerDetailsController', EditCustomerDetailsController);

}());
(function () {

    'use strict';

    function EditPropertiesController($scope)
    {
        var order = $scope.model.config.order;
        var orderLine = $scope.model.config.orderLine;
        var content = orderLine || order;

        var vm = this;
        vm.title = "Edit Properties";
        vm.editorConfig = $scope.model.config.editorConfig;
        vm.content = {
            properties: []
        };

        mapProperties(vm.editorConfig.properties);
        
        vm.save = function () {
            if ($scope.model.submit) {
                $scope.model.submit(vm.content);
            }
        };

        vm.cancel = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };

        function mapProperties (cfg) {
            for (const cfgKey in cfg) {

                var alias = cfg[cfgKey].alias;

                var prop = content.properties[alias] || { value: "", isReadOnly: false, isServerSideOnly: false };

                var property = {
                    alias: alias,
                    label: cfg[cfgKey].label || alias,
                    description: cfg[cfgKey].description,
                    config: cfg[cfgKey].config || {},
                    view: cfg[cfgKey].view || 'textbox',

                    value: prop.value,
                    isReadOnly: prop.isReadOnly,
                    isServerSideOnly: prop.isServerSideOnly
                };

                // Push some additional config into the property config
                property.config.storeId = $scope.model.config.orderId;
                property.config.orderId = $scope.model.config.orderId;
                property.config.orderLineId = $scope.model.config.orderLineId;

                if (prop.isReadOnly || cfg[cfgKey].isReadOnly) { // isServerSideOnly?
                    property.view = "readonlyvalue";
                }

                if (property.view === 'dropdown') {
                    property.view = '/app_plugins/vendr/views/propertyeditors/dropdown/dropdown.html';
                }

                vm.content.properties.push(property);
            }
        }
    }

    angular.module('vendr').controller('Vendr.Controllers.EditPropertiesController', EditPropertiesController);

}());
(function () {

    'use strict';

    function TransactionInfoDialogController($scope, vendrOrderResource)
    {
        var vm = this;

        vm.title = "Transaction Info";
        vm.properties = [];

        vendrOrderResource.getOrderTransactionInfo($scope.model.config.orderId).then(function (data) {
            vm.properties = data;
        });

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.TransactionInfoDialogController', TransactionInfoDialogController);

}());
(function () {

    'use strict';

    function OrderEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, editorService, localizationService, notificationsService, navigationService,
        vendrUtils, vendrOrderResource, vendrStoreResource, vendrEmailResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);

        var storeId = compositeId[0];
        var id = compositeId[1];

        var changeStatusDialogOptions = {
            view: '/app_plugins/vendr/views/dialogs/orderstatuspicker.html',
            size: 'small',
            config: {
                storeId: storeId
            },
            submit: function(model) {
                vendrOrderResource.changeOrderStatus(id, model.id).then(function(order) {
                    vm.content.orderStatusId = order.orderStatusId;
                    vm.content.orderStatus = order.orderStatus;
                    notificationsService.success("Status Changed", "Order status successfully changed to " + model.name + ".");
                    editorService.close();
                }).catch(function(e) {
                    notificationsService.error("Error Changing Status", "Unabled to change status to " + model.name + ". Please check the error log for details.");
                });
            },
            close: function() {
                editorService.close();
            }
        };

        var sendEmailDialogOptions = {
            view: '/app_plugins/vendr/views/dialogs/emailtemplatepicker.html',
            size: 'small',
            config: {
                storeId: storeId,
                onlySendable: true
            },
            submit: function(model) {
                vendrEmailResource.sendEmail(model.id, id).then(function() {
                    notificationsService.success("Email Sent", model.name + " email successfully sent.");
                    editorService.close();
                }).catch(function(e) {
                    notificationsService.error("Error Sending Email", "Unabled to send " + model.name + " email. Please check the error log for details.");
                });
            },
            close: function() {
                editorService.close();
            }
        };

        var transactionInfoDialogOptions = {
            view: '/app_plugins/vendr/views/order/dialogs/transactioninfo.html',
            size: 'small',
            config: {
                storeId: storeId,
                orderId: id
            },
            close: function () {
                editorService.close();
            }
        };

        var editCustomerDetailsDialogOptions = {
            view: '/app_plugins/vendr/views/order/dialogs/editcustomerdetails.html',
            config: {
                storeId: storeId,
                orderId: id
            },
            submit: function (model) {

                // Copy model values back over
                vm.content.customerFirstName = model.customerFirstName;
                vm.content.customerLastName = model.customerLastName;
                vm.content.customerEmail = model.customerEmail;

                for (var key in model.properties) {
                    var prop = model.properties[key];
                    if (prop.value) {
                        vm.content.properties[key] = prop;
                    } else {
                        delete vm.content.properties[key];
                    }
                }

                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var editPropertiesDialogOptions = {
            view: '/app_plugins/vendr/views/order/dialogs/editproperties.html',
            size: 'small',
            config: {
                storeId: storeId,
                orderId: id
            },
            close: function () {
                editorService.close();
            }
        };

        var vm = this;

        vm.page = {};
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';
        vm.page.editView = false;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.cancelPaymentButtonState = 'init';
        vm.capturePaymentButtonState = 'init';
        vm.refundPaymentButtonState = 'init';

        vm.options = {
            expandedBundles: []
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/commerce/vendr/order-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.bundleIsExpanded = function (id) {
            return vm.options.expandedBundles.findIndex(function (v) {
                return v === id;
            }) >= 0;
        };

        vm.toggleBundle = function (id) {
            var idx = vm.options.expandedBundles.findIndex(function (v) {
                return v === id;
            });
            if (idx >= 0) {
                vm.options.expandedBundles.splice(idx, 1);
            } else {
                vm.options.expandedBundles.push(id);
            }
        };

        vm.hasEditableOrderLineProperties = function (orderLine) {
            if (!vm.editorConfig.orderLine.properties)
                return false;

            var editablePropertyConfigs = vm.editorConfig.orderLine.properties
                .filter(function (c) {
                    return c.showInEditor !== false;
                });

            if (editablePropertyConfigs.length === 0)
                return false;

            return true;
        };

        vm.editOrderLineProperties = function (orderLine) {
            editPropertiesDialogOptions.config.order = vm.content;
            editPropertiesDialogOptions.config.orderLineId = orderLine.id;
            editPropertiesDialogOptions.config.orderLine = orderLine;
            editPropertiesDialogOptions.config.editorConfig = {
                properties: vm.editorConfig.orderLine.properties
            };
            editPropertiesDialogOptions.submit = function (model) {
                model.properties.forEach(function (itm, idx) {
                    orderLine.properties[itm.alias] = {
                        value: itm.value,
                        isReadOnly: itm.isReadOnly,
                        isServerSideOnly: itm.isServerSideOnly
                    };
                });
                editorService.close();
            };
            editorService.open(editPropertiesDialogOptions);
        };

        vm.hasEditableOrderProperties = function () {
            if (!vm.editorConfig.additionalInfo)
                return false;

            var editablePropertyConfigs = vm.editorConfig.additionalInfo
                .filter(function (c) {
                    return c.showInEditor !== false;
                });

            if (editablePropertyConfigs.length === 0)
                return false;

            return true;
        };

        vm.editOrderProperties = function () {
            editPropertiesDialogOptions.config.order = vm.content;
            editPropertiesDialogOptions.config.orderLineId = undefined;
            editPropertiesDialogOptions.config.orderLine = undefined;
            editPropertiesDialogOptions.config.editorConfig = {
                properties: vm.editorConfig.additionalInfo
            };
            editPropertiesDialogOptions.submit = function (model) {
                model.properties.forEach(function (itm, idx) {
                    vm.content.properties[itm.alias] = {
                        value: itm.value,
                        isReadOnly: itm.isReadOnly,
                        isServerSideOnly: itm.isServerSideOnly
                    };
                });
                editorService.close();
            };
            editorService.open(editPropertiesDialogOptions);
        };

        vm.copySuccess = function (description) {
            notificationsService.success("Copy Successful", description + " successfully copied to the clipboard.");
        };

        vm.init = function () {
            vendrStoreResource.getStoreOrderEditorConfig(storeId).then(function (config) {
                vm.editorConfig = config;
                vm.editorConfig.view = vm.editorConfig.view || '/app_plugins/vendr/views/order/subviews/edit.html';
                vendrOrderResource.getOrder(id).then(function(order) {

                    // Ensure notes properties
                    if (vm.editorConfig.notes.customerNotes && !order.properties[vm.editorConfig.notes.customerNotes.alias]) {
                        order.properties[vm.editorConfig.notes.customerNotes.alias] = { value: "" };
                    }
                    if (vm.editorConfig.notes.internalNotes && !order.properties[vm.editorConfig.notes.internalNotes.alias]) {
                        order.properties[vm.editorConfig.notes.internalNotes.alias] = { value: "" };
                    }

                    vm.ready(order);
                });
            });
        };

        //vm.viewOnMap = function (postcode) {
        //    editorService.open({
        //        title: "Map",
        //        view: "/app_plugins/vendr/views/dialogs/iframe.html",
        //        submit: function (model) {
        //            editorService.close();
        //        },
        //        close: function () {
        //            editorService.close();
        //        }
        //    });
        //};

        vm.viewTransactionInfo = function () {
            editorService.open(transactionInfoDialogOptions);
        };

        vm.cancelPayment = function () {
            vm.cancelPaymentButtonState = 'busy';
            vendrOrderResource.cancelPayment(id).then(function(order) {
                vm.content.paymentStatus = order.paymentStatus;
                vm.cancelPaymentButtonState = 'success';
                notificationsService.success("Payment Cancelled", "Pending payment successfully cancelled.");
            }, function (err) {
                vm.cancelPaymentButtonState = 'error';
            });
        };

        vm.capturePayment = function () {
            vm.capturePaymentButtonState = 'busy';
            vendrOrderResource.capturePayment(id).then(function(order) {
                vm.content.paymentStatus = order.paymentStatus;
                vm.capturePaymentButtonState = 'success';
                notificationsService.success("Payment Captured", "Pending payment successfully captured.");
            }, function (err) {
                    vm.capturePaymentButtonState = 'error';
            });
        };

        vm.refundPayment = function () {
            vm.refundPaymentButtonState = 'busy';
            vendrOrderResource.refundPayment(id).then(function(order) {
                vm.content.paymentStatus = order.paymentStatus;
                vm.refundPaymentButtonState = 'success';
                notificationsService.success("Payment Refunded", "Captured payment successfully refunded.");
            }, function (err) {
                vm.refundPaymentButtonState = 'error';
            });
        };

        vm.changeStatus = function() {
            editorService.open(changeStatusDialogOptions);
        };

        vm.sendEmail = function() {
            editorService.open(sendEmailDialogOptions);
        };

        vm.editCustomerDetails = function () {
            editCustomerDetailsDialogOptions.config.order = vm.content;
            editCustomerDetailsDialogOptions.config.editorConfig = vm.editorConfig;
            editorService.open(editCustomerDetailsDialogOptions);
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            // sync state
            editorState.set(vm.content);
             
            var pathToSync = vm.content.path.slice(0, -1);
            navigationService.syncTree({ tree: "vendr", path: pathToSync, forceReload: true }).then(function (syncArgs) {

                var orderOrCartNumber = '#' + (vm.content.orderNumber || vm.content.cartNumber);

                // Fake a current node
                // This is used in the header to generate the actions menu
                var application = syncArgs.node.metaData.application;
                var tree = syncArgs.node.metaData.tree;
                vm.page.menu.currentNode = {
                    id: id,
                    name: orderOrCartNumber,
                    nodeType: "Order",
                    menuUrl: "/umbraco/backoffice/Vendr/StoresTree/GetMenu?application=" + application + "&tree=" + tree + "&nodeType=Order&storeId=" + storeId + "&id=" + id,
                    metaData: {
                        tree: tree,
                        storeId: storeId
                    }
                };

                // Build breadcrumb for parent then append current node
                var breadcrumb = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                breadcrumb.push({ name: orderOrCartNumber, routePath: "" });
                vm.page.breadcrumb.items = breadcrumb;

            });
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrOrderResource.saveOrder(vm.content).then(function(saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    vm.ready(saved);

                }, function(err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save order",
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'Order' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.OrderEditController', OrderEditController);

}());
(function () {

    'use strict';

    function OrderListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrOrderResource, vendrOrderStatusResource, vendrRouteCache, vendrLocalStorage) {
        
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            filters: [
                {
                    name: 'Order Status',
                    alias: 'orderStatusIds',
                    localStorageKey: 'store_' + storeId + '_orderStatusFilter',
                    getFilterOptions: function () {
                        return vendrRouteCache.getOrFetch("store_" + storeId + "_orderStatuses", function () {
                            return vendrOrderStatusResource.getOrderStatuses(storeId);
                        })
                        .then(function (items) {
                            return items.map(function (itm) {
                                return {
                                    id: itm.id,
                                    name: itm.name,
                                    color: itm.color
                                };
                            });
                        });
                    }
                },
                {
                    name: 'Payment Status',
                    alias: 'paymentStatuses',
                    localStorageKey: 'store_' + storeId + '_paymentStatusFilter',
                    getFilterOptions: function () {
                        return $q.resolve([
                            { id: 1, name: 'Authorized', color: 'light-blue' },
                            { id: 2, name: 'Captured', color: 'green' },
                            { id: 3, name: 'Cancelled', color: 'grey' },
                            { id: 4, name: 'Refunded', color: 'orange' },
                            { id: 200, name: 'Error', color: 'red' }
                        ]);
                    }
                }
            ],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrOrderResource.deleteOrder(bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") +"?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                { alias: 'name', template: '<span class="vendr-table-cell-value--multiline"><span>{{customerFullName}}</span><span class="vendr-table-cell-label">#{{orderNumber}}</span></span>' },
                { alias: 'finalizedDate', header: 'Date', template: "{{ finalizedDate  | date : 'MMMM d, yyyy h:mm a' }}" },
                { alias: 'orderStatusId', header: 'Order Status', align: 'right', template: '<span class="umb-badge umb-badge--xs vendr-bg--{{ orderStatus.color }}" title="Order Status: {{ orderStatus.name }}">{{ orderStatus.name }}</span>' },
                { alias: 'paymentStatus', header: 'Payment Status', align: 'right', template: '<span class="umb-badge umb-badge--xs vendr-badge--{{ paymentStatus.toLowerCase() }}">{{paymentStatus}}</span>' },
                { alias: 'payment', header: 'Payment', align: 'right', template: '<span class="vendr-table-cell-value--multiline"><strong>{{totalPrice}}</strong><span>{{paymentMethod.name}}</span></span>' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.options.filters.forEach(fltr => {
            Object.defineProperty(fltr, "value", {
                get: function () {
                    return vendrLocalStorage.get(fltr.localStorageKey) || [];
                },
                set: function (value) {
                    vendrLocalStorage.set(fltr.localStorageKey, value);
                }
            });
        });

        vm.loadItems = function (opts, callback) {

            // Apply filters
            vm.options.filters.forEach(fltr => {
                if (fltr.value && fltr.value.length > 0) {
                    opts[fltr.alias] = fltr.value;
                } else {
                    delete opts[fltr.alias];
                }
            });

            // Perform search
            vendrOrderResource.searchOrders(storeId, opts).then(function (entities) {
                entities.items.forEach(function (itm) {
                    itm.routePath = '/commerce/vendr/order-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) {
                    callback();
                }
            });
        };

        vm.init = function () {

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",1", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                vm.loadItems({
                    pageNumber: 1
                }, function () {
                    vm.page.loading = false;
                });
            });

        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Order' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.OrderListController', OrderListController);

}());
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
(function () {

    'use strict';

    function PaymentMethodEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, treeService, navigationService, editorService,
        vendrUtils, vendrPaymentMethodResource, vendrCountryResource, vendrCurrencyResource, vendrTaxResource, vendrStoreResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var storeAlias = storeId; // Set store alias to id for now as a fallback
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
            paymentProviderScaffold: [],
            paymentProviderProperties: [],
            advancedPaymentProviderProperties: [],
            advancedPaymentProviderPropertiesShown: false
        };
        vm.content = {
            defaultPrices: []
        };

        vm.back = function () {
            $location.path("/settings/vendrsettings/paymentmethod-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.toggleAdvancedPaymentProviderProperties = function () {
            vm.options.advancedPaymentProviderPropertiesShown = !vm.options.advancedPaymentProviderPropertiesShown;
        };

        vm.openCustomPricesDialog = function (countryRegion) {

            var isCountry = !countryRegion.countryId;
            var countryId = isCountry ? countryRegion.id : countryRegion.countryId;
            var regionId = isCountry ? null : countryRegion.id;

            var dialogConfig = {
                view: '/app_plugins/vendr/views/dialogs/custompricingedit.html',
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

                var findFunc = function (itm) {
                    return itm.currencyId === defaultPrice.currencyId
                        && (!itm.countryId || itm.countryId === null)
                        && (!itm.regionId || itm.regionId === null);
                };

                Object.defineProperty(defaultPrice, "value", {
                    get: function () {
                        if (!vm.content.prices) return '';
                        var itm = vm.content.prices.find(findFunc);
                        return itm ? itm.value : '';
                    },
                    set: function (value) {
                        if (!vm.content.prices)
                            vm.content.prices = [];
                        var idx = vm.content.prices.findIndex(findFunc);
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

        vm.buildPaymentProviderSettingProperties = function (paymentMethod) {
            vendrPaymentMethodResource.getPaymentProviderScaffold(paymentMethod.paymentProviderAlias).then(function (scaffold) {
                vm.options.paymentProviderScaffold = scaffold;

                var allProperties = (scaffold.settingDefinitions || []).map(function (itm) {

                    var property = {
                        alias: itm.key,
                        label: itm.name,
                        description: itm.description,
                        config: itm.config,
                        view: itm.view,
                        isAdvanced: itm.isAdvanced
                    };

                    if (!itm.view || itm.view === 'dictionaryinput') {
                        property.view = '/app_plugins/vendr/views/propertyeditors/dictionaryinput/dictionaryinput.html';
                        property.config = {
                            containerKey: 'Vendr',
                            keyPrefix: "vendr_" + storeAlias.toLowerCase() + "_paymentmethod_" + (vm.content.alias || $scope.$id)
                        };
                    } else if (!itm.view || itm.view === 'dropdown') {
                        property.view = '/app_plugins/vendr/views/propertyeditors/dropdown/dropdown.html';
                    }

                    Object.defineProperty(property, "value", {
                        get: function () {
                            return vm.content.paymentProviderSettings[itm.key];
                        },
                        set: function (value) {
                            vm.content.paymentProviderSettings[itm.key] = value;                            
                        }
                    });

                    return property;
                });

                vm.options.paymentProviderProperties = allProperties.filter(function (itm) {
                    return !itm.isAdvanced;
                });

                vm.options.advancedPaymentProviderProperties = allProperties.filter(function (itm) {
                    return itm.isAdvanced;
                });
            });
        };

        vm.init = function () {

            vendrStoreResource.getStoreAlias(storeId).then(function (alias) {
                storeAlias = alias;
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

                vendrPaymentMethodResource.createPaymentMethod(storeId, $routeParams.type).then(function (paymentMethod) {
                    vm.buildPaymentProviderSettingProperties(paymentMethod);
                    vm.ready(paymentMethod);
                });

            } else {

                vendrPaymentMethodResource.getPaymentMethod(id).then(function (paymentMethod) {
                    vm.buildPaymentProviderSettingProperties(paymentMethod);
                    vm.ready(paymentMethod);
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

                vendrPaymentMethodResource.savePaymentMethod(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/paymentmethod-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save payment method " + vm.content.name,
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
            if (args.entityType === 'PaymentMethod' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.PaymentMethodEditController', PaymentMethodEditController);

}());
(function () {

    'use strict';

    function PaymentMethodListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrPaymentMethodResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrPaymentMethodResource.deletePaymentMethod(bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") +"?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                { alias: 'sku', header: 'SKU' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrPaymentMethodResource.getPaymentMethods(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/paymentmethod-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",4", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Payment Method',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });

        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'PaymentMethod' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.PaymentMethodListController', PaymentMethodListController);

}());
(function () {

    'use strict';

    function ConditionalInputController($scope, $timeout)
    {
        var vm = this;

        vm.property = {
            alias: $scope.model.alias + "_conitional",
            view: $scope.model.config.propertyView,
            config: $scope.model.config.propertyConfig
        };

        Object.defineProperty(vm.property, "value", {
            get: function () {
                return $scope.model.value;
            },
            set: function (value) {
                $scope.model.value = value;
                toggleProperties();
            }
        });

        function toggleProperties()
        {
            if ($scope.model.value in $scope.model.config.map) {
                doToggleProperties($scope.model.config.map[$scope.model.value]);
            }
            else if ("default" in $scope.model.config.map) {
                doToggleProperties($scope.model.config.map["default"]);
            }
        }

        function doToggleProperties(config) {

            var $inputEl = $("div[data-element='property-" + $scope.model.alias + "']");
            var form = $inputEl.closest("form");

            var hiddenContainer = $(form).find("> .cih");
            if (hiddenContainer.length === 0) {
                $(form).append("<div class='cih' style='display: none;'></div>");
                hiddenContainer = $(form).find("> .cih");
            }

            config.show.forEach(function (toShow) {
                var $s = $("div[data-element='property-" + toShow + "']");
                if ($s.closest(".cih").length > 0) {
                    $(form).find(".property-" + toShow + "-placeholder").after($s);
                    $(form).find(".property-" + toShow + "-placeholder").remove();
                }
            });

            config.hide.forEach(function (toHide) {
                var $s = $("div[data-element='property-" + toHide + "']");
                if ($s.closest(".cih").length === 0) {
                    $s.after("<span class='property-" + toHide + "-placeholder'></span>");
                    hiddenContainer.append($s);
                }
            });

        }

        $timeout(function () {
            toggleProperties();
        }, 10);
        
    }

    angular.module('vendr').controller('Vendr.Controllers.ConditionalInputController', ConditionalInputController);

}());
(function () {

    'use strict';

    function DictionaryInputController($scope) {

        var vm = this;
        
        vm.model = $scope.model;
        
        vm.generateKey = function () {
            return ($scope.model.config.keyPrefix + "_" + $scope.model.alias).toLowerCase();
        };

    }

    angular.module('vendr').controller('Vendr.Controllers.DictionaryInputController', DictionaryInputController);

}());
(function () {

    'use strict';

    function PricesIncludeTaxController($scope, $routeParams, vendrStoreResource, vendrUtils, vendrRouteCache)
    {
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;

        var vm = this;

        vm.property = {
            alias: $scope.model.alias + "_wrapped",
            view: "boolean",
            config: $scope.model.config
        };

        Object.defineProperty(vm.property, "value", {
            get: function () {
                return $scope.model.value;
            },
            set: function (value) {
                $scope.model.value = value;
            }
        });

        if ($scope.model.value == null && storeId) {
            vendrRouteCache.getOrFetch("currentStore", () => vendrStoreResource.getBasicStore(storeId)).then(function (store) {
                vm.property.value = store.pricesIncludeTax;
            });
        }

    }

    angular.module('vendr').controller('Vendr.Controllers.PricesIncludeTaxController', PricesIncludeTaxController);

}());
(function () {

    'use strict';

    function PriceController($scope, $routeParams, vendrStoreResource,
        vendrCurrencyResource, vendrUtils, vendrRouteCache)
    {
        // Figure out if we are in a config area or in settings where we can
        // parse the store ID from the querystring
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;
        var currentOrParentNodeId = compositeId.length > 1 ? compositeId[1] : compositeId[0];

        var vm = this;

        vm.model = $scope.model;

        vm.loading = true;
        vm.store = null;
        vm.prices = null;

        var initStore = function (store, value) {
            if (store) {
                vm.store = store;
                vendrRouteCache.getOrFetch("store_"+ store.id +"_currencies", function () {
                    return vendrCurrencyResource.getCurrencies(vm.store.id);
                })
                .then(function (currencies) {
                    var prices = [];
                    currencies.forEach(function (currency) {
                        prices.push({
                            currencyId: currency.id,
                            currencyCode: currency.code,
                            value: value && value[currency.id] ? value[currency.id] : ''
                        });
                    });
                    vm.prices = prices;
                    vm.loading = false;
                });
            } else {
                vm.store = null;
                vm.prices = null;
                vm.loading = false;
            }
        };

        var init = function (value) {

            vendrRouteCache.getOrFetch("currentStore", function () {
                if (!storeId) {
                    return vendrStoreResource.getBasicStoreByNodeId(currentOrParentNodeId);
                } else {
                    return vendrStoreResource.getBasicStore(storeId);
                }
            })
            .then(function (store) {
                initStore(store, value);
            });

        };

        // Here we declare a special method which will be called whenever the value has changed from the server
        // this is instead of doing a watch on the model.value = faster
        $scope.model.onValueChanged = function (newVal, oldVal) {
            //console.log(newVal);
        };
        
        var unsubscribe = [
            $scope.$on("formSubmitting", function () {
                if (!vm.loading && vm.store && vm.prices) {

                    var value = {};

                    vm.prices.forEach(function (price) {
                        if (price.value !== "" && !isNaN(price.value)) {
                            value[price.currencyId] = price.value;
                        }
                    });

                    if (_.isEmpty(value))
                        value = undefined;

                    $scope.model.value = value;
                }
            }),
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

        init($scope.model.value);
    }

    angular.module('vendr').controller('Vendr.Controllers.PriceController', PriceController);

}());
(function () {

    'use strict';

    function StockController($scope, editorState, vendrProductResource)
    {
        var currentNode = editorState.getCurrent();
        var productReference = currentNode.id > 0 ? currentNode.key : undefined;

        var vm = this;

        vm.model = $scope.model;

        // We don't use any stored stock value as we fetch it from
        // the product service every time. We only use the stored
        // value as a means to pass the value to an event handler
        // to update the stock value on save
        vm.model.value = 0;

        vm.loading = true;
        
        var init = function () {
            if (productReference) {
                vendrProductResource.getStock(productReference).then(function (stock) {
                    vm.model.value = stock || 0;
                    vm.loading = false;
                });
            } else {
                vm.loading = false;
            }
        };

        init();
    }

    angular.module('vendr').controller('Vendr.Controllers.StockController', StockController);

}());
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

        var dialogOptions = {
            view: '/app_plugins/vendr/views/dialogs/storeentitypicker.html',
            size: 'small',
            config: {
                storeId: -1,
                entityType: entityType
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
            if (store) {
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
                vendrStoreResource.getBasicStoreByNodeId(currentOrParentNodeId).then(function (store) {
                    initStore(store, value);
                });
            } else {
                vendrStoreResource.getBasicStore(storeId).then(function (store) {
                    initStore(store, value);
                });
            }

        };

        //$scope.model.onValueChanged = function (newVal, oldVal) {
        //    //console.log(newVal);
        //};

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
(function () {

    'use strict';

    function StorePickerController($scope, editorService,
        vendrStoreResource)
    {
        var dialogOptions = {
            view: '/app_plugins/vendr/views/dialogs/storepicker.html',
            size: 'small',
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

        if (vm.model.value) {
            vendrStoreResource.getBasicStore(vm.model.value).then(function (store) {
                vm.pickedItem = store;
            });
        }

        vm.openPicker = function () {
            editorService.open(dialogOptions);
        };

        vm.removeItem = function () {
            vm.model.value = null;
            vm.pickedItem = false;
        };

        vm.openItem = function () {
            
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.StorePickerController', StorePickerController);

}());
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
            view: '/app_plugins/vendr/views/dialogs/taxclasspicker.html',
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
(function () {

    'use strict';

    function UmbracoMemberGroupsPickerController($scope, editorService, memberGroupResource) 
    {
        $scope.pickGroup = function() {
            editorService.memberGroupPicker({
                multiPicker: true,
                submit: function (model) {
                    var selectedGroupIds = _.map(model.selectedMemberGroups
                        ? model.selectedMemberGroups
                        : [model.selectedMemberGroup],
                        function(id) { return parseInt(id) }
                    );
                    memberGroupResource.getByIds(selectedGroupIds).then(function (selectedGroups) {
                        $scope.model.value = $scope.model.value || [];
                        _.each(selectedGroups, function(group) {
                            var foundIndex = $scope.model.value.findIndex(function (itm) {
                                return itm == group.name;
                            });
                            if (foundIndex == -1){
                                $scope.model.value.push(group.name);
                            }
                        });
                    });
                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            });
        }

        $scope.removeGroup = function (group) {
            var foundIndex = $scope.model.value.findIndex(function (itm) {
                return itm == group;
            });
            if (foundIndex > -1){
                $scope.model.value.splice(foundIndex, 1);
            }
        }
    }

    angular.module('vendr').controller('Vendr.Controllers.UmbracoMemberGroupsPickerController', UmbracoMemberGroupsPickerController);

}());
(function () {

    'use strict';

    function RegionEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrCountryResource, vendrShippingMethodResource, vendrPaymentMethodResource) {

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
            paymentMethods: []
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, countryId]))
                .search("view", "regions");
        };

        vm.init = function () {
            
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
(function () {

    'use strict';

    // NB: The country region list is different to other lists as this
    // list is shown as a content app within the country editor and thus
    // a lot of chrome already exists within that view

    function RegionListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrCountryResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var countryId = compositeId[1];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.options = {
            createActions: [],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrCountryResource.deleteRegion(bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") +"?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                { alias: 'code', header: 'Code' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath).search({});
            }
        };

        vm.init = function () {
            if ($scope.model.page.menu.currentNode) {
                vm.initFromNode($scope.model.page.menu.currentNode);
            } else {
                var destroyWatcher = $scope.$watch("model.page.menu.currentNode", function (newValue) {
                    if (newValue) {
                        vm.initFromNode(newValue);
                        destroyWatcher();
                    }
                });
            }
        };

        vm.loadItems = function (callback) {
            vendrCountryResource.getRegions(storeId, countryId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/region-edit/' + vendrUtils.createCompositeId([storeId, countryId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.initFromNode = function () {

            treeService.getMenu({ treeNode: $scope.model.page.menu.currentNode }).then(function (menu) {

                var currentSection = appState.getSectionState("currentSection");
                var currentNode = $scope.model.page.menu.currentNode;

                var createMenuAction = menu.menuItems.find(function (itm) {
                    return itm.alias === 'create';
                });

                if (createMenuAction) {
                    vm.options.createActions.push({
                        name: 'Create Region',
                        doAction: function () {
                            appState.setMenuState("currentNode", currentNode);
                            navigationService.executeMenuAction(createMenuAction,
                                currentNode,
                                currentSection);
                        }
                    });
                }

                vm.loadItems(function () {
                    vm.page.loading = false;
                });

            });

        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Region' && args.storeId === storeId && args.parentId === countryId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.RegionListController', RegionListController);

}());
(function () {

    'use strict';

    function SettingsViewController($scope, $rootScope, $routeParams, navigationService, vendrUtils) {
        navigationService.syncTree({ tree: "vendrsettings", path: ["-1"], forceReload: false, activate: true });
        $scope.vendrInfo = vendrUtils.getSettings("vendrInfo");
    };

    angular.module('vendr').controller('Vendr.Controllers.SettingsViewController', SettingsViewController);

}());
(function () {

    'use strict';

    function ShippingMethodEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, treeService, navigationService, editorService,
        vendrUtils, vendrShippingMethodResource, vendrCountryResource, vendrCurrencyResource, vendrTaxResource) {

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
            countryRegions: []
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
                view: '/app_plugins/vendr/views/dialogs/custompricingedit.html',
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
(function () {

    'use strict';

    function ShippingMethodListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrShippingMethodResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrShippingMethodResource.deleteShippingMethod(bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") +"?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                { alias: 'sku', header: 'SKU' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrShippingMethodResource.getShippingMethods(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/shippingmethod-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",3", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Shipping Method',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'ShippingMethod' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.ShippingMethodListController', ShippingMethodListController);

}());
(function () {

    'use strict';

    function StoreEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, userGroupsResource, usersResource,
        vendrStoreResource, vendrCountryResource, vendrTaxResource,
        vendrOrderStatusResource, vendrEmailTemplateResource) {

        var id = $routeParams.id;
        var create = id === '-1';

        var vm = this;

        vm.page = { };
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.navigation = [
            {
                'name': 'Settings',
                'alias': 'settings',
                'icon': 'icon-settings',
                'view': '/app_plugins/vendr/views/store/subviews/settings.html',
                'active': true
            },
            {
                'name': 'Permissions',
                'alias': 'permissions',
                'icon': 'icon-lock',
                'view': '/app_plugins/vendr/views/store/subviews/permissions.html'
            }
        ];

        vm.options = {
            countries: [],
            taxClasses: [],
            orderStatuses: [],
            emailTemplates: [],
            userRoles: [],
            users: []
        };

        vm.content = {};

        vm.init = function () {
                       
            userGroupsResource.getUserGroups().then(function (userGroups) {
                vm.options.userRoles = userGroups.map(function (itm) {

                    var userRole = {
                        alias: itm.alias,
                        name: itm.name
                    };

                    Object.defineProperty(userRole, "checked", {
                        get: function () {
                            return vm.content.allowedUserRoles
                                && vm.content.allowedUserRoles.indexOf(userRole.alias) > -1;
                        },
                        set: function (value) {
                            if (!vm.content.allowedUserRoles)
                                vm.content.allowedUserRoles = [];
                            var idx = vm.content.allowedUserRoles.indexOf(userRole.alias);
                            if (value) {
                                if (idx === -1) vm.content.allowedUserRoles.push(userRole.alias);
                            } else {
                                if (idx !== -1) vm.content.allowedUserRoles.splice(idx, 1);
                            }
                        }
                    });

                    return userRole;
                });
            });

            usersResource.getPagedResults({ pageSize: 1000 }).then(function (pagedUsers) {
                vm.options.users = pagedUsers.items.map(function (itm) {

                    var user = {
                        id: itm.id.toString(),
                        name: itm.name
                    };

                    Object.defineProperty(user, "checked", {
                        get: function () {
                            return vm.content.allowedUserIds
                                && vm.content.allowedUserIds.indexOf(user.id) > -1;
                        },
                        set: function (value) {
                            if (!vm.content.allowedUserIds)
                                vm.content.allowedUserIds = [];
                            var idx = vm.content.allowedUserIds.indexOf(user.id);
                            if (value) {
                                if (idx === -1) vm.content.allowedUserIds.push(user.id);
                            } else {
                                if (idx !== -1) vm.content.allowedUserIds.splice(idx, 1);
                            }
                        }
                    });

                    return user;
                });
            });

            if (create) {

                vendrStoreResource.createStore().then(function (store) {
                    vm.ready(store);
                });

            } else {

                vendrCountryResource.getCountries(id).then(function (countries) {
                    vm.options.countries = countries;
                });

                vendrTaxResource.getTaxClasses(id).then(function (taxClasses) {
                    vm.options.taxClasses = taxClasses;
                });

                vendrOrderStatusResource.getOrderStatuses(id).then(function (orderStatuses) {
                    vm.options.orderStatuses = orderStatuses;
                });

                vendrEmailTemplateResource.getEmailTemplates(id).then(function (emailTemplates) {
                    vm.options.emailTemplates = emailTemplates;
                });

                vendrStoreResource.getStore(id).then(function (store) {
                    vm.ready(store);
                });

            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            if (!vm.content.orderEditorConfig || vm.content.orderEditorConfig === "")
                vm.content.orderEditorConfig = "/app_plugins/vendr/config/order.editor.config.js";

            // sync state
            editorState.set(vm.content);

            if (!create) {
                navigationService.syncTree({ tree: "vendrsettings", path: vm.content.path, forceReload: true }).then(function (syncArgs) {
                    vm.page.menu.currentNode = syncArgs.node;
                });
            }
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrStoreResource.saveStore(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";
                    
                    if (create) {
                        $location.path("/settings/vendrsettings/store-edit/" + saved.id);
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save store " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.StoreEditController', StoreEditController);

}());
(function () {

    'use strict';

    function TaxClassEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, treeService, navigationService,
        vendrUtils, vendrTaxResource, vendrCountryResource) {

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
            countryRegions: []
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/taxclass-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

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
(function () {

    'use strict';

    function TaxClassListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrTaxResource) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrTaxResource.deleteTaxClass(bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") +"?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                { alias: 'defaultTaxRate', header: 'Default Tax Rate' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrTaxResource.getTaxClasses(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.defaultTaxRate = itm.defaultTaxRate + "%";
                    itm.routePath = '/settings/vendrsettings/taxclass-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",7", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Tax Class',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'TaxClass' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.TaxClassListController', TaxClassListController);

}());
