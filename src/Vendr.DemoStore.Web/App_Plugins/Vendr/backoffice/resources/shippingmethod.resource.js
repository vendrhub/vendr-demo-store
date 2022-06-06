(function () {

    'use strict';

    function vendrShippingMethodResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getShippingMethods: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("shippingMethodApiBaseUrl", "GetShippingMethods", { 
                        storeId: storeId 
                    })),
                    "Failed to get shipping methods");
            },

            getShippingMethod: function (shippingMethodId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("shippingMethodApiBaseUrl", "GetShippingMethod", {
                        shippingMethodId: shippingMethodId
                    })),
                    "Failed to get shipping method");
            },

            createShippingMethod: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("shippingMethodApiBaseUrl", "CreateShippingMethod", {
                        storeId: storeId
                    })),
                    "Failed to create shipping method");
            },

            saveShippingMethod: function (shippingMethod) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("shippingMethodApiBaseUrl", "SaveShippingMethod"), shippingMethod),
                    "Failed to save shipping method");
            },

            deleteShippingMethod: function (shippingMethodId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("shippingMethodApiBaseUrl", "DeleteShippingMethod", {
                        shippingMethodId: shippingMethodId
                    })),
                    "Failed to delete shipping method");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrShippingMethodResource', vendrShippingMethodResource);

}());