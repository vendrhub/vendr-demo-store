(function () {

    'use strict';

    function GiftCardListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrGiftCardResource, vendrActions) {

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
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'name', template: '<span class="vendr-table-cell-value--multiline"><span><strong>{{code}}<strong></span>{{ orderNumber ? \'<span class="vendr-table-cell-label">#\'+ orderNumber +\'</span>\' : \'\' }}</span>' },
                { alias: 'remainingAmountFormatted', header: 'Remaining', template: '<span class="vendr-table-cell-value--multiline"><span><strong>{{remainingAmountFormatted}}</strong> of {{ originalAmountFormatted }}</span><span class="vendr-progress-bar mt-5" style="width: 100%;max-width: 200px;"><span  class="vendr-progress-bar__bar" style="width: {{ (100 / originalAmount) * remainingAmount }}%;"></span></span></span>' },
                { alias: 'status', header: 'Status', template: '<span class="vendr-badge umb-badge umb-badge--xs vendr-bg--{{ statusColor }} truncate">{{ status }}</span>' },
                { alias: 'createDate', header: 'Create Date', template: "{{ createDate  | date : 'MMMM d, yyyy h: mm a' }}" }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (opts, callback) {
            opts.itemsPerPage = opts.pageSize;
            vendrGiftCardResource.searchGiftCards(storeId, opts).then(function (entities) {
                entities.items.forEach(function (itm) {
                    itm.routePath = '/commerce/vendr/giftcard-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'GiftCard' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",3", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Gift Card',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems({
                        pageNumber: 1
                    }, function () {
                        vm.page.loading = false;
                    });

                });
            });

        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'GiftCard' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems({
                    pageNumber: 1
                }, function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.GiftCardListController', GiftCardListController);

}());