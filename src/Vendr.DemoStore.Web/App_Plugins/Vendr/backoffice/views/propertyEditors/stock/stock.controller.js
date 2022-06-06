(function () {

    'use strict';

    function StockController($scope, $locale, $routeParams, editorState, editorService, vendrUtils, vendrStoreResource, vendrProductResource, vendrRouteCache)
    {
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;
        var currentOrParentNodeId = compositeId.length > 1 ? compositeId[1] : compositeId[0];

        var currentNode = editorState.getCurrent();
        var productReference = currentNode.id > 0 ? currentNode.key : undefined;
        var productVariantReference = undefined;

        var isDocTypeEditorPreview = $routeParams.section == "settings" && $routeParams.tree == "documentTypes";

        var vm = this;
        vm.model = $scope.model;
        vm.options = {
            numberPattern: `^\-?[\\${$locale.NUMBER_FORMATS.GROUP_SEP}0-9]*$`
        };

        var fraction = $scope.model.config.fraction || 6;
        if (fraction > 0) {
            vm.options.numberPattern = vm.options.numberPattern.substr(0, vm.options.numberPattern.length - 1)
                + `(\\${($locale.NUMBER_FORMATS.DECIMAL_SEP)}[0-9]{0,${$scope.model.config.fraction}})?$`;
        }

        var vendrVariantEditor = editorService.getEditors().find(e => e.vendrVariantEditor);
        if (vendrVariantEditor) {
            productVariantReference = vendrVariantEditor.content.key;
        }

        // As multi variants can be loaded / unloaded within
        // the same editing session, we have to check whether
        // a stock level has been set previously that hasn't
        // yet been persisted by saving the parent node. If this
        // is the case then use this unpersisted value.
        var hasUnpersistedValue = productVariantReference
            && vm.model.value
            && vm.model.value != -1
            && vm.model.value != "-1";

        vm.store = null;

        // We don't use any stored stock value as we fetch it from
        // the product service every time. 
        // So we store a stock value in a seperate varaiable and 
        // only submit it's value if it changes.
        // We also set the stored model value to -1 initially 
        // to ensure it's only handled in the backend
        // if it's value is different.
        vm.model.value = hasUnpersistedValue ? vm.model.value : -1;
        vm.stockLevel = hasUnpersistedValue ? toUiCulture(vm.model.value) : 0;
        vm.syncStockLevel = function () {
            if (!vm.loading) {
                vm.model.value = fromUiCulture(vm.stockLevel);
            }
        };
        vm.unformatValue = function () {
            vm.stockLevel = fromUiCulture(vm.stockLevel).toString().replaceAll('.', $locale.NUMBER_FORMATS.DECIMAL_SEP);
        }
        vm.reformatValue = function () {
            vm.stockLevel = toUiCulture(fromUiCulture(vm.stockLevel));
        }

        vm.loading = true;

        var initStore = function (store) {
            if (store) {
                vm.store = store;
                if (productReference && !hasUnpersistedValue) {
                    vendrProductResource.getStock(vm.store.id, productReference, productVariantReference).then(function (stock) {
                        vm.stockLevel = toUiCulture(stock || 0);
                        vm.loading = false;
                    });
                } else {
                    vm.loading = false;
                }
            } else {
                vm.store = null;
                vm.loading = false;
            }
        };

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
                    initStore(store);
                });
            } else {
                initStore(null, null);
            }
        };

        init();

        function toUiCulture(num) {
            return num.toLocaleString($locale.id); // .replaceAll('.', $locale.NUMBER_FORMATS.DECIMAL_SEP).replaceAll(',', $locale.NUMBER_FORMATS.GROUP_SEP);
        }

        function fromUiCulture(num) {
            return parseFloat(num.replaceAll($locale.NUMBER_FORMATS.GROUP_SEP, '').replaceAll($locale.NUMBER_FORMATS.DECIMAL_SEP, '.'));
        }
    }

    angular.module('vendr').controller('Vendr.Controllers.StockController', StockController);

}());