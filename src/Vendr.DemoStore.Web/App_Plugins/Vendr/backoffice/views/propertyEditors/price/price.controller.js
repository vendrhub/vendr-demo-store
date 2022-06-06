(function () {

    'use strict';

    function PriceController($scope, $routeParams, vendrStoreResource,
        vendrCurrencyResource, vendrUtils, vendrRouteCache)
    {
        // Figure out if we are in a config area or in settings where we can
        // parse the store ID from the querystring
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;
        var currentOrParentNodeId = compositeId.length > 1 ? compositeId[1] : compositeId[0];

        var isDocTypeEditorPreview = $routeParams.section == "settings" && $routeParams.tree == "documentTypes";

        var vm = this;

        vm.model = $scope.model;

        vm.loading = true;
        vm.store = null;
        vm.prices = null;
        vm.options = {
            fraction: $scope.model.config.fraction || 2
        }

        var initStore = function (store, value) {
            if (store) {
                vm.store = store;
                vendrRouteCache.getOrFetch("store_"+ store.id +"_currencies", function () {
                    return vendrCurrencyResource.getCurrencies(vm.store.id);
                })
                .then(function (currencies) {
                    var prices = [];
                    currencies.forEach(function (currency) {
                        prices.push({
                            currencyId: currency.id,
                            currencyCode: currency.code,
                            value: value && value[currency.id] != undefined ? value[currency.id] : ''
                        });
                    });
                    vm.prices = prices;
                    vm.loading = false;
                });
            } else {
                vm.store = null;
                vm.prices = null;
                vm.loading = false;
            }
        };

        var init = function (value) {

            if (!isDocTypeEditorPreview) {
                vendrRouteCache.getOrFetch("currentStore", function () {
                    if (!storeId) {
                        return vendrStoreResource.getBasicStoreByNodeId(currentOrParentNodeId);
                    } else {
                        return vendrStoreResource.getBasicStore(storeId);
                    }
                })
                .then(function (store) {
                    initStore(store, value);
                });
            } else {
                initStore(null, null);
            }

        };

        // Here we declare a special method which will be called whenever the value has changed from the server
        // this is instead of doing a watch on the model.value = faster
        $scope.model.onValueChanged = function (newVal, oldVal) {
            //console.log(newVal);
        };
        
        var unsubscribe = [
            $scope.$on("formSubmitting", function () {
                if (!vm.loading && vm.store && vm.prices) {

                    var value = {};

                    vm.prices.forEach(function (price) {
                        if (price.value !== "" && !isNaN(price.value)) {
                            value[price.currencyId] = price.value;
                        }
                    });

                    if (_.isEmpty(value))
                        value = undefined;

                    $scope.model.value = value;
                }
            }),
            $scope.$on("formSubmitted", function () {
                init($scope.model.value);
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

        init($scope.model.value);
    }

    angular.module('vendr').controller('Vendr.Controllers.PriceController', PriceController);

}());