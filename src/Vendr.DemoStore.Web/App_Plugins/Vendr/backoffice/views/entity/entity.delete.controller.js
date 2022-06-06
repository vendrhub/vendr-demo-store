(function () {
     
    'use strict';

    function EntityDeleteController($scope, $rootScope, $location,
        treeService, navigationService, notificationsService , editorState,
        vendrUtils, vendrEntityResource) {

        var currentNode = $scope.currentNode;
        var tree = currentNode.metaData['tree'];
        var nodeType = currentNode.nodeType;
        var storeId = currentNode.metaData['storeId'];
        var parentId = currentNode.parentId;
        var id = currentNode.id;

        var vm = this;
        vm.saveButtonState = 'init';
        vm.currentNode = currentNode;

        vm.performDelete = function () {

            // Prevent double clicking casuing additional delete requests
            vm.saveButtonState = 'busy';

            // Update node UI to show something is happening
            vm.currentNode.loading = true;

            // Reset the error message
            vm.error = null;

            // Perform the delete
            vendrEntityResource.deleteEntity(nodeType, id, storeId, parentId)
                .then(function () {

                    // Stop tree node animation
                    vm.currentNode.loading = false;

                    // Remove the node from the tree
                    try {
                        treeService.removeNode(vm.currentNode);
                    } catch (err) {
                        // If there is an error, the tree probably doesn't show children
                    }

                    // Close the menu
                    navigationService.hideMenu();

                    // Show notification
                    notificationsService.success("Entity deleted", "Entity '" + currentNode.name + "' successfully deleted");

                    // Notify views
                    $rootScope.$broadcast("vendrEntityDeleted", {
                        entityType: nodeType,
                        entityId: id,
                        storeId: storeId,
                        parentId: parentId
                    });

                    // If we have deleted a store, then regardless, navigate back to tree root
                    var editing = editorState.getCurrent();
                    if (nodeType === 'Store' && storeId === editing.storeId) {
                        $location.path("/settings/vendrsettings/settings-view/");
                    }

                }, function (err) {

                    // Stop tree node animation
                    vm.currentNode.loading = false;

                    // Set the error object
                    vm.error = err;

                    // Set not busy
                    vm.saveButtonState = 'error';
                });
        };

        vm.cancel = function () {
            navigationService.hideDialog();
        };

    };

    angular.module('vendr').controller('Vendr.Controllers.EntityDeleteController', EntityDeleteController);

}());