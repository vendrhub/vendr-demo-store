(function () {

    'use strict';

    function vendrOrderResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            searchOrders: function (storeId, opts) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "SearchOrders", angular.extend({}, { 
                        storeId: storeId
                    }, opts))),
                    "Failed to search orders");
            },

            getOrder: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrder", { 
                        orderId: orderId
                    })),
                    "Failed to get order");
            },

            getOrderAdvancedFilters: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrderAdvancedFilters")),
                    "Failed to get order advanced filters");
            },

            getOrderEditorConfig: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrderEditorConfig", {
                        storeId: storeId
                    })),
                    "Failed to get order editor config");
            },

            getOrderEmailConfig: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrderEmailConfig", {
                        orderId: orderId
                    })),
                    "Failed to get order email config");
            },


            getOrderTransactionInfo: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrderTransactionInfo", {
                        orderId: orderId
                    })),
                    "Failed to get order transaction info");
            },


            getOrderRegisteredCustomerInfo: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrderRegisteredCustomerInfo", {
                        orderId: orderId
                    })),
                    "Failed to get order registered customer info");
            },


            getOrderHistoryByOrder: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "GetOrderHistoryByOrder", {
                        orderId: orderId
                    })),
                    "Failed to get order history");
            },

            changeOrderStatus: function(orderId, orderStatusId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "ChangeOrderStatus", {
                        orderId: orderId,
                        orderStatusId: orderStatusId
                    })),
                    "Failed to change order status");
            },

            syncPaymentStatus: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "SyncPaymentStatus", {
                        orderId: orderId
                    })),
                    "Failed to sync payment");
            },

            cancelPayment: function(orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "CancelPayment", {
                        orderId: orderId
                    })),
                    "Failed to cancel payment");
            },

            capturePayment: function(orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "CapturePayment", {
                        orderId: orderId
                    })),
                    "Failed to capture payment");
            },

            refundPayment: function(orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "RefundPayment", {
                        orderId: orderId
                    })),
                    "Failed to refund payment");
            },

            saveOrder: function (order) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "SaveOrder"), order),
                    "Failed to save order");
            },

            deleteOrder: function (orderId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("orderApiBaseUrl", "DeleteOrder", {
                        orderId: orderId
                    })),
                    "Failed to delete order");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrOrderResource', vendrOrderResource);

}());