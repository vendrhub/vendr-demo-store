(function () {

    'use strict';

    function vendrPaymentMethodResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getPaymentProviderDefinitions: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "GetPaymentProviderDefinitions")),
                    "Failed to get payment provider definitions");
            },

            getPaymentProviderScaffold: function (paymentProviderAlias) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "GetPaymentProviderScaffold", {
                        paymentProviderAlias: paymentProviderAlias
                    })),
                    "Failed to get payment provider scaffold");
            },

            getPaymentMethods: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "GetPaymentMethods", { 
                        storeId: storeId 
                    })),
                    "Failed to get payment methods");
            },

            getPaymentMethod: function (paymentMethodId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "GetPaymentMethod", {
                        paymentMethodId: paymentMethodId
                    })),
                    "Failed to get payment method");
            },

            createPaymentMethod: function (storeId, paymentProviderAlias) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "CreatePaymentMethod", {
                        storeId: storeId,
                        paymentProviderAlias: paymentProviderAlias
                    })),
                    "Failed to create payment method");
            },

            savePaymentMethod: function (paymentMethod) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "SavePaymentMethod"), paymentMethod),
                    "Failed to save payment method");
            },

            deletePaymentMethod: function (paymentMethodId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("paymentMethodApiBaseUrl", "DeletePaymentMethod", {
                        paymentMethodId: paymentMethodId
                    })),
                    "Failed to delete payment method");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrPaymentMethodResource', vendrPaymentMethodResource);

}());