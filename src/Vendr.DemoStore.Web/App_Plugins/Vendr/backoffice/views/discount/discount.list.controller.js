(function () {

    'use strict';

    function DiscountListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrDiscountResource, vendrActions) {

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
                { alias: 'name', template: '<span class="vendr-table-cell-value--multiline"><span>{{name}}</span>{{ blockFurtherDiscounts ? \'<span class="vendr-table-cell-label" style="font-size: 12px;"><i class="fa fa-minus-circle color-red" aria-hidden="true"></i> Blocks all further discounts if applied</span>\' : \'\' }}{{ blockIfPreviousDiscounts ? \'<span class="vendr-table-cell-label" style="font-size: 12px;"><i class="fa fa-chevron-circle-up color-orange"></i> Is not applied if previous discounts already apply</span></span>\' : \'\' }}' },
                { alias: 'type', header: 'Type', template: '<span class="vendr-badge umb-badge umb-badge--xs vendr-bg--{{ typeColor }} truncate">{{ type }}</span>' },
                { alias: 'status', header: 'Status', template: '<span class="vendr-badge umb-badge umb-badge--xs vendr-bg--{{ statusColor }} truncate">{{ status }}</span>' }
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

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'Discount' }).then(result => {
                vm.options.bulkActions = result;
            });

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