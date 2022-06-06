(function () {

    'use strict';

    function vendrGiftCardResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            searchGiftCards: function (storeId, opts) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "SearchGiftCards", angular.extend({}, {
                        storeId: storeId
                    }, opts))),
                    "Failed to search gift cards");
            },

            generateGiftCardCode: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "GenerateGiftCardCode", {
                        storeId: storeId
                    })),
                    "Failed to generate gift card code");
            },

            getGiftCards: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "GetGiftCards", { 
                        storeId: storeId 
                    })),
                    "Failed to get gift cards");
            },

            getGiftCard: function (giftCardId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "GetGiftCard", { 
                        giftCardId: giftCardId
                    })),
                    "Failed to get gift card");
            },

            createGiftCard: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "CreateGiftCard", {
                        storeId: storeId
                    })),
                    "Failed to create gift card");
            },

            saveGiftCard: function (giftCard) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "SaveGiftCard"), giftCard),
                    "Failed to save gift card");
            },

            deleteGiftCard: function (giftCardId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("giftCardApiBaseUrl", "DeleteGiftCard", {
                        giftCardId: giftCardId
                    })),
                    "Failed to delete gift card");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrGiftCardResource', vendrGiftCardResource);

}());