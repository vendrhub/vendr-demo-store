(function () {

    'use strict';

    function ProductAttributeListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrProductAttributeResource, vendrActions) {

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
                { alias: 'alias', header: 'Alias' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrProductAttributeResource.getProductAttributes(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/commerce/vendr/productattribute-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'ProductAttribute' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",10,11", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Product Attribute',
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
            if (args.entityType === 'ProductAttribute' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.ProductAttributeListController', ProductAttributeListController);

}());