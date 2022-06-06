(function () {

    'use strict';

    function vendrExportTemplateResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getExportTemplateCount: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "GetExportTemplateCount", {
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get export template count");
            },

            getExportTemplates: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "GetExportTemplates", { 
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get export templates");
            },

            getExportTemplate: function (exportTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "GetExportTemplate", { 
                        exportTemplateId: exportTemplateId
                    })),
                    "Failed to get export template");
            },

            createExportTemplate: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "CreateExportTemplate", {
                        storeId: storeId
                    })),
                    "Failed to create export template");
            },

            saveExportTemplate: function (exportTemplate) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "SaveExportTemplate"), exportTemplate),
                    "Failed to save export template");
            },

            deleteExportTemplate: function (exportTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("exportTemplateApiBaseUrl", "DeleteExportTemplate", {
                        exportTemplateId: exportTemplateId
                    })),
                    "Failed to delete export template");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrExportTemplateResource', vendrExportTemplateResource);

}());