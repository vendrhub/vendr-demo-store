(function () {

    'use strict';

    function CountryCreateController($scope, $rootScope, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService,
        vendrUtils, vendrCountryResource, vendrCurrencyResource) {

        var storeId = $scope.currentNode.metaData['storeId'];
        
        var vm = this;

        vm.loading = true;
        vm.createAllButtonState = 'init';
        vm.defaultCurrencyId = null;
        vm.options = {
            view: "selectAction",
            presets: [],
            currencies: []
        };

        vm.init = function () {
            vendrCountryResource.getIso3166CountryRegions().then(function (data) {
                vm.options.presets = data;
                vm.loading = false;
            });
        };

        vm.createNew = function () {
            $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, -1]))
                .search("preset", "false");
            navigationService.hideMenu();
        };

        vm.createNewFromPreset = function (preset) {
            $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, -1]))
                .search("preset", "true")
                .search("code", preset.code)
                .search("name", preset.name);
            navigationService.hideMenu();
        };

        vm.cancelAction = function () {
            vm.options.view = "selectAction";
        }

        vm.selectPreset = function () {
            vm.options.view = "selectPreset";
        };

        vm.createAll = function() {
            vm.options.view = "createAll";
            if (vm.options.currencies.length == 0) {
                vm.loading = true;
                vendrCurrencyResource.getCurrencies(storeId).then(function (data) {
                    vm.options.currencies = data;

                    // If there is only 1 currency option, set this to be
                    // the default currency
                    if (vm.options.currencies.length == 1) {
                        vm.defaultCurrencyId = vm.options.currencies[0].id;
                    }

                    vm.loading = false;
                });
            }
        }

        vm.confirmCreateAll = function () {
            vm.createAllButtonState = 'busy';
            vendrCountryResource.createAllCountryRegions(storeId, vm.defaultCurrencyId).then(function () {

                vm.createAllButtonState = "success";

                navigationService.hideDialog();

                notificationsService.success("All Countries Created", "All countries have been created successfully");

                navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",5", forceReload: true });

                $rootScope.$broadcast("vendrEntityCreated", {
                    entityType: "Country",
                    storeId: storeId
                });

            }, function (err) {
                vm.createAllButtonState = "error";
                notificationsService.error("Failed to create all country regions", err.data.message || err.data.Message || err.errorMsg);
            });
        }

        vm.close = function () {
            navigationService.hideDialog(true);
        };

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.CountryCreateController', CountryCreateController);

}());