(function () {

    'use strict';

    function StoreEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, userGroupsResource, usersResource,
        vendrStoreResource, vendrCurrencyResource, vendrCountryResource, vendrTaxResource,
        vendrOrderStatusResource, vendrEmailTemplateResource,
        vendrLicensingResource, vendrRouteCache, vendrActions) {

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
                'view': '/App_Plugins/Vendr/backoffice/views/store/subviews/settings.html',
                'active': true
            },
            {
                'name': 'Permissions',
                'alias': 'permissions',
                'icon': 'icon-lock',
                'view': '/App_Plugins/Vendr/backoffice/views/store/subviews/permissions.html'
            }
        ];

        vm.options = {
            currencies: [],
            countries: [],
            taxClasses: [],
            orderStatuses: [],
            emailTemplates: [],
            orderRoundingMethods: [
                { key: 'Unit', value: 'Unit' },
                { key: 'Line', value: 'Line' },
                { key: 'Total', value: 'Total' }
            ],
            giftCardActivationMethods: [
                { key: 'Manual', value: 'Manual' },
                { key: 'Automatic', value: 'Automatic' },
                { key: 'OrderStatus', value: 'Order Status' }
            ],
            userRoles: [],
            users: [],
            editorActions: []
        };

        vm.content = {};

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: id, entityType: 'Store' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrRouteCache.getOrFetch("vendrLicensingInfo",
                () => vendrLicensingResource.getLicensingInfo()).then(function (data) {
                    vm.licensingInfo = data;
                });

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
                        id: itm.id.toString(), // Umbraco members don't really have a key
                        name: itm.name
                    };

                    Object.defineProperty(user, "checked", {
                        get: function () {
                            return vm.content.allowedUsers
                                && vm.content.allowedUsers.indexOf(user.id) > -1;
                        },
                        set: function (value) {
                            if (!vm.content.allowedUsers)
                                vm.content.allowedUsers = [];
                            var idx = vm.content.allowedUsers.indexOf(user.id);
                            if (value) {
                                if (idx === -1) vm.content.allowedUsers.push(user.id);
                            } else {
                                if (idx !== -1) vm.content.allowedUsers.splice(idx, 1);
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

                vendrCurrencyResource.getCurrencies(id).then(function (currencies) {
                    vm.options.currencies = currencies;
                });

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
                vm.content.orderEditorConfig = "/App_Plugins/Vendr/config/order.editor.config.js";

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