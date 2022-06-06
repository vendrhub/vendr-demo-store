(function () {

    'use strict';

    function OrderListController($scope, $rootScope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrOrderResource, vendrOrderStatusResource, vendrRouteCache, vendrLocalStorage,
        vendrActions) {

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
                            { id: 5, name: 'Pending', color: 'deep-purple' },
                            { id: 200, name: 'Error', color: 'red' }
                        ]);
                    }
                }
            ],
            bulkActions: [],
            advancedFilters: [],
            items: [],
            itemProperties: [
                { alias: 'name', template: '<span class="vendr-table-cell-value--multiline"><span>{{customerFullName}}</span><span class="vendr-table-cell-label">#{{orderNumber}}</span></span>' },
                { alias: 'finalizedDate', header: 'Date', template: "{{ finalizedDate  | date : 'MMMM d, yyyy h:mm a' }}" },
                { alias: 'orderStatusId', header: 'Order Status', align: 'right', template: '<span class="vendr-badge umb-badge umb-badge--xs vendr-bg--{{ orderStatus.color }} truncate" title="Order Status: {{ orderStatus.name }}">{{ orderStatus.name }}</span>' },
                { alias: 'paymentStatus', header: 'Payment Status', align: 'right', template: '<span class="vendr-badge umb-badge umb-badge--xs vendr-badge--{{ paymentStatus.toLowerCase() }} truncate">{{paymentStatusName}}</span>' },
                { alias: 'payment', header: 'Payment', align: 'right', template: '<span class="vendr-table-cell-value--multiline"><strong>{{transactionAmount}}</strong><span>{{paymentMethod.name}}</span></span>' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        var hasFilterRouteParams = false;

        vm.options.filters.forEach(fltr => {
            Object.defineProperty(fltr, "value", {
                get: function () {
                    return vendrLocalStorage.get(fltr.localStorageKey) || [];
                },
                set: function (value) {
                    vendrLocalStorage.set(fltr.localStorageKey, value);
                }
            });

            // Initially just check to see if any of the filter are in the route params
            // as if they are, we will reset filters accordingly in a moment, but we
            // need to know if any params exist as we'll wipe out anything that isn't
            // in the querystring
            if ($routeParams[fltr.alias])
                hasFilterRouteParams = true;
        });

        // If we have some filters in the querystring then
        // set the filter values by default, wiping out any
        // cached value they previously had
        if (hasFilterRouteParams) {
            vm.options.filters.forEach(fltr => {
                if ($routeParams[fltr.alias]) {
                    fltr.value = $routeParams[fltr.alias].split(",");
                    $location.search(fltr.alias, null);
                } else {
                    fltr.value = [];
                }
            });
        }

        vm.loadItems = function (opts, callback) {

            if (typeof opts === "function") {
                callback = opts;
                opts = undefined;
            }

            if (!opts) {
                opts = {
                    pageNumber: 1
                };
            }

            // Rename pageSize to itemsPerPage
            opts.itemsPerPage = opts.pageSize;

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
                vm.page.loading = false;
                if (callback) {
                    callback();
                }
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'Order' }).then(result => {
                vm.options.bulkActions = result;
            });

            vendrOrderResource.getOrderAdvancedFilters().then(result => {
                vm.options.advancedFilters = result;
            });

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",1", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                $rootScope.$broadcast("vendrReloadTableViewItems", {
                    pageNumber: 1
                });
            });

        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Order' && args.storeId === storeId) {
                vm.page.loading = true;
                $rootScope.$broadcast("vendrReloadTableViewItems", {
                    pageNumber: 1
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.OrderListController', OrderListController);

}());