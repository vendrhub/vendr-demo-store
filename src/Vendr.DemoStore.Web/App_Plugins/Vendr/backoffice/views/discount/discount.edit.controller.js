(function () {

    'use strict';

    function DiscountEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService, dateHelper, userService,
        vendrUtils, vendrDiscountResource, vendrStoreResource, vendrRouteCache, vendrActions) {

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
            discountTypes: ['Automatic', 'Code'],
            editorActions: [],
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

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Discount' }).then(result => {
                vm.options.editorActions = result;
            });

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