(function () {

    'use strict';

    function AddProductDialogController($scope, $location, $q, editorService, vendrProductResource)
    {
        var vm = this;

        vm.loading = true;
        vm.title = "Add a Product";

        vm.filter = {
            enabled: true,
            term: '',
            prevTerm: '',
            hasFilter: false
        };
        
        vm.filters = [];
        
        var emptyPagedResult = {
            items: [],
            pageNumber: 1,
            pageSize: 10,
            totalItem: 0,
            totalPages: 1
        };

        vm.parentProduct = null;
        vm.selectedProduct = null;
        vm.products = angular.copy(emptyPagedResult);
        vm.variantAttributes = [];
        vm.variants = angular.copy(emptyPagedResult);

        vm.applySearchFilter = function () {
            if (!vm.parentProduct) {
                vm.loadProducts();
            } else {
                vm.loadProductVariants();
            }
        }

        vm.loadProducts = function () {
            vm.products = angular.copy(emptyPagedResult);
            if (vm.filter.term.length > 0)
            {
                vm.filter.hasFilter = true;
                vm.loading = true;
                vendrProductResource.searchProductSummaries($scope.model.config.storeId, $scope.model.config.languageIsoCode, vm.filter.term, {
                    itemsPerPage: 10
                }).then(function (data) {
                    const productReferences = data.items.map(item => {
                        return {  productReference: item.reference }
                    });
                    vendrProductResource.getAllStock($scope.model.config.storeId, productReferences).then(function(data2) {
                       data.items.forEach(itm => {
                          itm.stockLevel = data2.find(s => s.productReference === itm.reference).stockLevel; 
                          itm.price = 'Unpriced';
                          if (itm.prices && itm.prices.length) {
                              let price = itm.prices.find(p => p.currencyId === $scope.model.config.currencyId);
                              if (price) 
                                  itm.price = price.valueFormatted;
                          }
                       });
                       vm.products = data;
                       vm.loading = false;
                    });
                });
            }
            else
            {
                vm.filter.hasFilter = false;
            }
        };

        vm.loadVariantAttributes = function () {
            vm.variants = angular.copy(emptyPagedResult);
            vm.variantAttributes = [];
            vm.filters = [];
            
            if (vm.parentProduct) {
                vm.loading = true;
                vendrProductResource.getProductVariantAttributes($scope.model.config.storeId, vm.parentProduct.reference, $scope.model.config.languageIsoCode).then(function (data) {

                    data.forEach(itm => {
                        // TODO: Track selected?
                    })
                    
                    vm.variantAttributes = data;
                    
                    vm.filters = data.map(itm => {
                        return {
                            name: itm.name,
                            alias: itm.alias,
                            value: [],
                            getFilterOptions: function () {
                                return $q.resolve(itm.values.map(v => {
                                    return {
                                        id: v.alias,
                                        name: v.name
                                    }
                                }));
                            }
                        }
                    });

                    vm.loading = false;
                });
            }
        }

        vm.loadProductVariants = function () {
            vm.variants = angular.copy(emptyPagedResult);

            const attributes = vm.filters.flatMap(f => {
                return f.value.map(fv => {
                    return f.alias + ":" + fv;
                });
            });
            
            if (vm.filter.term.length > 0 || attributes.length > 0)
            {
                vm.filter.hasFilter = true;
                vm.loading = true;
                
                vendrProductResource.searchProductVariantSummaries($scope.model.config.storeId, vm.parentProduct.reference, $scope.model.config.languageIsoCode, vm.filter.term, attributes, {
                    itemsPerPage: 10
                }).then(function (data) {
                    const productReferences = data.items.map(item => {
                        return { productReference: vm.parentProduct.reference, productVariantReference: item.reference }
                    });
                    vendrProductResource.getAllStock($scope.model.config.storeId, productReferences).then(function(data2) {
                        data.items.forEach(itm => {
                            itm.stockLevel = data2.find(s => s.productVariantReference === itm.reference).stockLevel;
                            itm.price = 'Unpriced';
                            if (itm.prices && itm.prices.length) {
                                let price = itm.prices.find(p => p.currencyId === $scope.model.config.currencyId);
                                if (price)
                                    itm.price = price.valueFormatted;
                            }
                        });
                        vm.variants = data;
                        vm.loading = false;
                    });
                });
            }
            else
            {
                vm.filter.hasFilter = false;
            }
        };

        vm.selectItem = function (itm) {
            if (itm.hasVariants) {
                vm.parentProduct = itm;
                vm.selectedProduct = null;
                vm.filter.prevTerm = vm.filter.term;
                vm.filter.term = '';
                vm.filter.hasFilter = false;
                vm.loadVariantAttributes();
            } else {
                vm.selectedProduct = itm;
            }
        }

        vm.back = function () {
            vm.parentProduct = null;
            vm.selectedProduct = null;
            vm.filter.term = vm.filter.prevTerm;
            vm.filter.prevTerm = '';
            vm.loadProducts();
        }

        vm.submit = function () {
            if ($scope.model.submit) {
                $scope.model.submit(vm.parentProduct
                ? { productReference: vm.parentProduct.reference, productVariantReference: vm.selectedProduct.reference }
                : { productReference: vm.selectedProduct.reference });
            }
        }
        
        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.AddProductDialogController', AddProductDialogController);

}());