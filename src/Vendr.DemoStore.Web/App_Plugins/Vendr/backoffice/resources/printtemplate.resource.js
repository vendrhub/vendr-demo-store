(function () {

    'use strict';

    function vendrPrintTemplateResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getPrintTemplateCount: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "GetPrintTemplateCount", {
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get print template count");
            },

            getPrintTemplates: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "GetPrintTemplates", { 
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get print templates");
            },

            getPrintTemplate: function (printTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "GetPrintTemplate", { 
                        printTemplateId: printTemplateId
                    })),
                    "Failed to get print template");
            },

            createPrintTemplate: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "CreatePrintTemplate", {
                        storeId: storeId
                    })),
                    "Failed to create print template");
            },

            savePrintTemplate: function (printTemplate) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "SavePrintTemplate"), printTemplate),
                    "Failed to save print template");
            },

            deletePrintTemplate: function (printTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("printTemplateApiBaseUrl", "DeletePrintTemplate", {
                        printTemplateId: printTemplateId
                    })),
                    "Failed to delete print template");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrPrintTemplateResource', vendrPrintTemplateResource);

}());