(function () {

    'use strict';

    function vendrCurrencyResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getCurrencies: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("currencyApiBaseUrl", "GetCurrencies", { 
                        storeId: storeId 
                    })),
                    "Failed to get currencies");
            },

            getCurrency: function (currencyId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("currencyApiBaseUrl", "GetCurrency", {
                        currencyId: currencyId
                    })),
                    "Failed to get currency");
            },

            createCurrency: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("currencyApiBaseUrl", "CreateCurrency", {
                        storeId: storeId
                    })),
                    "Failed to create currency");
            },

            saveCurrency: function (currency) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("currencyApiBaseUrl", "SaveCurrency"), currency),
                    "Failed to save currency");
            },

            deleteCurrency: function (currencyId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("currencyApiBaseUrl", "DeleteCurrency", {
                        currencyId: currencyId
                    })),
                    "Failed to delete currency");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrCurrencyResource', vendrCurrencyResource);

}());