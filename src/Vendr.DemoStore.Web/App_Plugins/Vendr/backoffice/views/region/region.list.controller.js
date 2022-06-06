(function () {

    'use strict';

    // NB: The country region list is different to other lists as this
    // list is shown as a content app within the country editor and thus
    // a lot of chrome already exists within that view

    function RegionListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrCountryResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var countryId = compositeId[1];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'code', header: 'Code' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath).search({});
            }
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'Region' }).then(result => {
                vm.options.bulkActions = result;
            });

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