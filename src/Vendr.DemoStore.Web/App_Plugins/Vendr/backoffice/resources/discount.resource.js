(function () {

    'use strict';

    function vendrDiscountResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getDiscountRuleProviderDefinitions: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscountRuleProviderDefinitions")),
                    "Failed to get discount rule provider definitions");
            },

            getDiscountRuleProviderScaffold: function (discountRuleProviderAlias) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscountRuleProviderScaffold", {
                        discountRuleProviderAlias: discountRuleProviderAlias
                    })),
                    "Failed to get discount rule provider scaffold");
            },

            getDiscountRewardProviderDefinitions: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscountRewardProviderDefinitions")),
                    "Failed to get discount reward provider definitions");
            },

            getDiscountRewardProviderScaffold: function (discountRewardProviderAlias) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscountRewardProviderScaffold", {
                        discountRewardProviderAlias: discountRewardProviderAlias
                    })),
                    "Failed to get discount reward provider scaffold");
            },

            getDiscounts: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscounts", { 
                        storeId: storeId 
                    })),
                    "Failed to get discounts");
            },

            getDiscount: function (discountId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "GetDiscount", { 
                        discountId: discountId
                    })),
                    "Failed to get discount");
            },

            createDiscount: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "CreateDiscount", {
                        storeId: storeId
                    })),
                    "Failed to create discount");
            },

            saveDiscount: function (discount) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "SaveDiscount"), discount),
                    "Failed to save discount");
            },

            deleteDiscount: function (discountId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("discountApiBaseUrl", "DeleteDiscount", {
                        discountId: discountId
                    })),
                    "Failed to delete discount");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrDiscountResource', vendrDiscountResource);

}());