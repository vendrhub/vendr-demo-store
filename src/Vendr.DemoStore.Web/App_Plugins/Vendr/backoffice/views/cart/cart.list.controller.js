(function () {

    'use strict';

    function CartListController($scope, $rootScope, $location, $routeParams, $q, $timeout,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrCartResource, vendrRouteCache, vendrLocalStorage,
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
                    name: 'Cart Status',
                    alias: 'cartStatuses',
                    localStorageKey: 'store_' + storeId + '_cartStatusFilter',
                    getFilterOptions: function () {
                        return $q.resolve([
                            { id: 'empty', name: 'Empty', color: 'grey' },
                            { id: 'stale', name: 'Stale', color: 'deep-purple' },
                            { id: 'inprogress', name: 'In Progress', color: 'light-blue' },
                            { id: 'convertable', name: 'Convertable', color: 'green' },
                            { id: 'abandoned', name: 'Abandoned', color: 'orange' }
                        ]);
                    }
                }
            ],
            bulkActions: [],
            advancedFilters: [],
            items: [],
            itemProperties: [
                { alias: 'name', template: '<span class="vendr-table-cell-value--multiline"><span>{{ customerFullName || "Unknown" }}</span><span class="vendr-table-cell-label">#{{cartNumber}}</span></span>' },
                { alias: 'email', header: 'Email', template: '{{ customerEmail || "Unknown" }}' },
                { alias: 'createDate', header: 'Created', template: "{{ createDate  | date : 'MMMM d, yyyy h:mm a' }}" },
                { alias: 'updateDate', header: 'Modified', template: "{{ updateDate  | date : 'MMMM d, yyyy h:mm a' }}" },
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

            // Force search of unfinalized orders
            opts.isFinalized = false;

            // Apply filters
            vm.options.filters.forEach(fltr => {
                if (fltr.value && fltr.value.length > 0) {
                    opts[fltr.alias] = fltr.value;
                } else {
                    delete opts[fltr.alias];
                }
            });

            // Perform search
            vendrCartResource.searchCarts(storeId, opts).then(function (entities) {
                entities.items.forEach(function (itm) {
                    itm.routePath = '/commerce/vendr/cart-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                vm.page.loading = false;
                if (callback) {
                    callback();
                }
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'Cart' }).then(result => {
                vm.options.bulkActions = result;
            });

            vendrCartResource.getCartAdvancedFilters().then(result => {
                vm.options.advancedFilters = result;    
            });

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",5", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);

                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Cart',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    $rootScope.$broadcast("vendrReloadTableViewItems", {
                        pageNumber: 1
                    });

                });
                
            });

        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if ((args.entityType === 'Cart' || args.entityType === 'Order') && args.storeId === storeId) {
                vm.page.loading = true;
                $rootScope.$broadcast("vendrReloadTableViewItems", {
                    pageNumber: 1
                });
            } 
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.CartListController', CartListController);

}());