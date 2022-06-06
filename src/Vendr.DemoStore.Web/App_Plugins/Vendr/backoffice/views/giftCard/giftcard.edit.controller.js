(function () {

    'use strict';

    function GiftCardEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, editorService, notificationsService, navigationService, treeService, dateHelper, userService,
        vendrUtils, vendrGiftCardResource, vendrStoreResource, vendrEmailResource, vendrCurrencyResource, vendrRouteCache, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var storeAlias = storeId; // Set store alias to id for now as a fallback
        var id = compositeId[1];
        var create = id === '-1';

        var vm = this;

        vm.create = create;

        vm.page = {};
        vm.page.name = create ? 'Create Gift Card' : 'Edit Gift Card';
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
            currencies: [],
            currencyCodes: {},
            editorActions: [],
        };

        vm.back = function () {
            $location.path("/commerce/vendr/giftcard-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.syncOriginalAmountWithRemainingAmount = function () {
            if (create) {
                vm.content.remainingAmount = vm.content.originalAmount;
            }
        };
        vm.generateCode = function () {
            vendrGiftCardResource.generateGiftCardCode(storeId).then(function (giftCardCode) {
                vm.content.code = giftCardCode;
            });
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
            }
        };
        vm.clearExpiryDate = function () {
            vm.expiryDatePickerInstance.clear();
            vm.content.expiryDate = null;
        };

        vm.sendEmail = function () {
            editorService.open(pickEmailTemplateDialogOptions);
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'GiftCard' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrRouteCache.getOrFetch("currentStore", function () {
                return vendrStoreResource.getBasicStore(storeId);
            })
            .then(function (store) {
                storeAlias = store.alias;
            });

            vendrCurrencyResource.getCurrencies(storeId).then(function (currencies) {
                vm.options.currencies = currencies;
                vm.options.currencyCodes = currencies.reduce((obj, item) => {
                    obj[item.id] = item.code;
                    return obj;
                }, {});
            });

            userService.getCurrentUser().then(function (currentUser) {
                vm.currentUser = currentUser;

                if (create) {

                    vendrGiftCardResource.createGiftCard(storeId).then(function (giftCard) {
                        vm.ready(giftCard);
                    });

                } else {

                    vendrGiftCardResource.getGiftCard(id).then(function (giftCard) {
                        vm.ready(giftCard);
                    });

                }

            });
        };

        vm.ready = function (model) {
            vm.page.loading = false;

            // Prepare model
            vm.content = model;

            // sync state
            editorState.set(vm.content);

            // Localize dates
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

                vendrGiftCardResource.saveGiftCard(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/commerce/vendr/giftcard-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save gift card " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'GiftCard' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.GiftCardEditController', GiftCardEditController);

}());