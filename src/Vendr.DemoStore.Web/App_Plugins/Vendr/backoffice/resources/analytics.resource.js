(function () {

    'use strict';

    function vendrAnalyticsResource($http, umbRequestHelper, vendrRequestHelper) {

        return {
            
            getAnalyticsDashboardConfig: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetAnalyticsDashboardConfig", {
                        storeId: storeId
                    })),
                    "Failed to get analytics dashboard config");
            },

            getTotalOrdersReport: function (storeId, from, to, compareFrom, compareTo, localTimezoneOffset) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetTotalOrdersReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo,
                        localTimezoneOffset: localTimezoneOffset
                    })),
                    "Failed to get total orders report");
            },

            getTotalRevenueReport: function (storeId, from, to, compareFrom, compareTo, localTimezoneOffset) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetTotalRevenueReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo,
                        localTimezoneOffset: localTimezoneOffset
                    })),
                    "Failed to get total revenue report");
            },

            getAverageOrderValueReport: function (storeId, from, to, compareFrom, compareTo, localTimezoneOffset) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetAverageOrderValueReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo,
                        localTimezoneOffset: localTimezoneOffset
                    })),
                    "Failed to get average order value report");
            },

            getCartConversionRatesReport: function (storeId, from, to, compareFrom, compareTo, localTimezoneOffset) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetCartConversionRatesReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo,
                        localTimezoneOffset: localTimezoneOffset
                    })),
                    "Failed to get cart conversion rates report");
            },

            getRepeatCustomerRatesReport: function (storeId, from, to, compareFrom, compareTo, localTimezoneOffset) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetRepeatCustomerRatesReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo,
                        localTimezoneOffset: localTimezoneOffset
                    })),
                    "Failed to get repeat customer rates report");
            },

            getTopSellingProductsReport: function (storeId, from, to, compareFrom, compareTo, localTimezoneOffset) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("analyticsApiBaseUrl", "GetTopSellingProductsReport", {
                        storeId: storeId,
                        from: from,
                        to: to,
                        compareFrom: compareFrom,
                        compareTo: compareTo,
                        localTimezoneOffset: localTimezoneOffset
                    })),
                    "Failed to get top selling products report");
            },

        };

    };

    angular.module('vendr.resources').factory('vendrAnalyticsResource', vendrAnalyticsResource);

}());