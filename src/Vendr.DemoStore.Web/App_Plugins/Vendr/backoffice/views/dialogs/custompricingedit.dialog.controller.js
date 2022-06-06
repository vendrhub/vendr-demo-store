(function () {

    'use strict';

    function CustomPricingEditDialogController($scope) {

        var cfg = $scope.model.config;

        var vm = this;

        vm.page = {};
        vm.page.name = cfg.name;
        vm.page.saveButtonState = 'init';

        vm.content = {
            customPrices: []
        };

        vm.init = function () {

            var customPrices = [];

            cfg.currencies.forEach(function (currency) {

                // Prices should be pre-filtered by country region at this point
                // so we should be ok to just find by currency id
                var price = cfg.prices.find(function (itm) {
                    return itm.currencyId === currency.id;
                });

                var customPrice = {
                    currencyCode: currency.code,
                    currencyId: currency.id,
                    value: price ? price.value : ''
                };

                customPrices.push(customPrice);

            });

            vm.customPrices = customPrices;

        };

        vm.save = function () {

            var model = [];

            vm.customPrices.forEach(function (customPrice) {
                if (customPrice.value || customPrice.value === 0) {
                    model.push({
                        currencyId: customPrice.currencyId,
                        value: customPrice.value
                    });
                }
            });
            
            $scope.model.submit(model);
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.CustomPricingEditDialogController', CustomPricingEditDialogController);

}());