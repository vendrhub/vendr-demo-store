(function () {

    'use strict';

    function vendrCartResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            searchCarts: function (storeId, opts) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("cartApiBaseUrl", "SearchCarts", angular.extend({}, { 
                        storeId: storeId
                    }, opts))),
                    "Failed to search carts");
            },

            getCart: function (cartId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("cartApiBaseUrl", "GetCart", { 
                        cartId: cartId
                    })),
                    "Failed to get cart");
            },

            getCartAdvancedFilters: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("cartApiBaseUrl", "GetCartAdvancedFilters")),
                    "Failed to get cart advanced filters");
            },

            createCart: function (storeId, languageIsoCode, currencyId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("cartApiBaseUrl", "CreateCart", {
                        storeId: storeId,
                        languageIsoCode: languageIsoCode,
                        currencyId: currencyId
                    })),
                    "Failed to create a cart");
            },

            getCartEditorConfig: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("cartApiBaseUrl", "GetCartEditorConfig", {
                        storeId: storeId
                    })),
                    "Failed to get cart editor config");
            },

            calculateCart: function (cart) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("cartApiBaseUrl", "CalculateCart"), cart),
                    "Failed to save cart");
            },

            saveCart: function (cart) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("cartApiBaseUrl", "SaveCart"), cart),
                    "Failed to save cart");
            },

            deleteCart: function (cartId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("cartApiBaseUrl", "DeleteCart", {
                        cartId: cartId
                    })),
                    "Failed to delete cart");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrCartResource', vendrCartResource);

}());