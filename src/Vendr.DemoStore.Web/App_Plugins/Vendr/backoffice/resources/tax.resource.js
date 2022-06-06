(function () {

    'use strict';

    function vendrTaxResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getTaxClasses: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("taxApiBaseUrl", "GetTaxClasses", { 
                        storeId: storeId 
                    })),
                    "Failed to get tax classes");
            },

            getTaxClass: function (taxClassId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("taxApiBaseUrl", "GetTaxClass", { 
                        taxClassId: taxClassId
                    })),
                    "Failed to get tax class");
            },

            createTaxClass: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("taxApiBaseUrl", "CreateTaxClass", {
                        storeId: storeId
                    })),
                    "Failed to create tax class");
            },

            saveTaxClass: function (taxClass) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("taxApiBaseUrl", "SaveTaxClass"), taxClass),
                    "Failed to save tax class ");
            },

            deleteTaxClass: function (taxClassId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("taxApiBaseUrl", "DeleteTaxClass", {
                        taxClassId: taxClassId
                    })),
                    "Failed to get delete class");
            }

        };

    }

    angular.module('vendr.resources').factory('vendrTaxResource', vendrTaxResource);

}());