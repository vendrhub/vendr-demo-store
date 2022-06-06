(function () {

    'use strict';

    function vendrOrderStatusResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getOrderStatuses: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderStatusApiBaseUrl", "GetOrderStatuses", { 
                        storeId: storeId 
                    })),
                    "Failed to get order statuses");
            },

            getOrderStatus: function (orderStatusId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderStatusApiBaseUrl", "GetOrderStatus", { 
                        orderStatusId: orderStatusId
                    })),
                    "Failed to get order status");
            },

            createOrderStatus: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("orderStatusApiBaseUrl", "CreateOrderStatus", {
                        storeId: storeId
                    })),
                    "Failed to create order status");
            },

            saveOrderStatus: function (orderStatus) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("orderStatusApiBaseUrl", "SaveOrderStatus"), orderStatus),
                    "Failed to save order status");
            },

            deleteOrderStatus: function (orderStatusId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("orderStatusApiBaseUrl", "DeleteOrderStatus", {
                        orderStatusId: orderStatusId
                    })),
                    "Failed to delete order status");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrOrderStatusResource', vendrOrderStatusResource);

}());