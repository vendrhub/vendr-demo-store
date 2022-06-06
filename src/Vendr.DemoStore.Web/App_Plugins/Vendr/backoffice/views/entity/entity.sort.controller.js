(function () {

    'use strict';

    function EntitySortController($scope, $rootScope, $location, $filter,
        navigationService, notificationsService, vendrEntityResource,
        vendrUtils) {
        
        var currentNode = $scope.currentNode;
        var tree = currentNode.metaData['tree'];
        var nodeType = currentNode.metaData['childNodeType'] || currentNode.nodeType;
        var storeId = currentNode.metaData['storeId'];
        var parentEntityId = vendrUtils.isGuid(currentNode.id) ? currentNode.id : null;
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
            vendrEntityResource.getEntities(nodeType, storeId, parentEntityId).then(function (items) {
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
            vendrEntityResource.sortEntities(nodeType, sortedIds, storeId, parentEntityId).then(function () {
                vm.saveButtonState = "success";
                notificationsService.success("Entities sorted", sortedIds.length + " entities sorted successfully");
                if (isListView) {
                    $rootScope.$broadcast("vendrEntitiesSorted", {
                        entityType: nodeType,
                        storeId: storeId,
                        parentId: parentEntityId
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

        vm.close = function () {
            navigationService.hideDialog();
        };

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.EntitySortController', EntitySortController);

}());