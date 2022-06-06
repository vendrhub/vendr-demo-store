(function () {

    'use strict';

    function CartCreateController($scope, $rootScope, $location, formHelper,
        languageResource, navigationService,
        vendrUtils, vendrCartResource, vendrCurrencyResource) {

        var storeId = $scope.currentNode.metaData['storeId'];

        var vm = this;

        vm.loading = true;
        vm.currencyId = null;
        vm.languageIsoCode = null;
        vm.options = {
            languages: [],
            currencies: []
        };

        vm.init = function () {

            vendrCurrencyResource.getCurrencies(storeId).then(function (data) {
                vm.options.currencies = data;

                // If there is only 1 currency option, set this to be
                // the default currency
                if (vm.options.currencies.length == 1) {
                    vm.currencyId = vm.options.currencies[0].id;
                }

                languageResource.getAll().then(function (languages) {
                    vm.options.languages = languages;

                    var defaultLanguage = languages.find(function (itm) {
                        return itm.isDefault;
                    });

                    if (defaultLanguage) {
                        vm.languageIsoCode = defaultLanguage.culture;
                    }
                    else if (languages.length == 1) {
                        vm.languageIsoCode = languages[0].culture;
                    }

                    vm.loading = false;
                });
            });
        };

        vm.confirm = function () {

            // TODO: Create an empty order and get the order ID
            vendrCartResource.createCart(storeId, vm.languageIsoCode, vm.currencyId).then(function (order) {
                $location.path("/commerce/vendr/cart-edit/" + vendrUtils.createCompositeId([storeId, order.id]));
                navigationService.hideMenu();
            });

        }

        vm.close = function () {
            navigationService.hideDialog(true);
        };

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.CartCreateController', CartCreateController);

}());