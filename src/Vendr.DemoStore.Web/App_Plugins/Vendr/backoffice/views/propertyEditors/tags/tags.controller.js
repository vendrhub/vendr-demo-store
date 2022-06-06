(function () {

    'use strict';

    function TagsController($scope, $routeParams, vendrStoreResource,
        vendrUtils, vendrRouteCache)
    {        
        // Figure out if we are in a config area or in settings where we can
        // parse the store ID from the querystring
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 || $routeParams.tree.indexOf("vendr") >= 0 ? compositeId[0] : null;
        var currentOrParentNodeId = compositeId.length > 1 ? compositeId[1] : compositeId[0];

        var isDocTypeEditorPreview = $routeParams.section == "settings" && $routeParams.tree == "documentTypes";

        var vm = this;
        
        vm.value = $scope.model.value 
            ? $scope.model.value.split(',')
            : [];

        vm.valueChanged = function(value) {
            $scope.model.value = value.join(",");
        }
        
        var init = function () {
            if (!isDocTypeEditorPreview) {
                vendrRouteCache.getOrFetch("currentStore", function () {
                    if (!storeId) {
                        return vendrStoreResource.getBasicStoreByNodeId(currentOrParentNodeId);
                    } else {
                        return vendrStoreResource.getBasicStore(storeId);
                    }
                })
                .then(function (store) {
                    vm.store = store;
                });
            }
        };
        
        init();

        var unsubscribe = [
            $scope.$watch("model.value", function (newVal, oldVal) {
                vm.value = newVal
                    ? newVal.split(',')
                    : [];
            })
        ];

        // When the element is disposed we need to unsubscribe!
        // NOTE: this is very important otherwise if this is part of a modal, the listener still exists because the dom
        // element might still be there even after the modal has been hidden.
        $scope.$on('$destroy', function () {
            unsubscribe.forEach(function (u) {
                u();
            });
        });
    }

    angular.module('vendr').controller('Vendr.Controllers.TagsController', TagsController);

}());