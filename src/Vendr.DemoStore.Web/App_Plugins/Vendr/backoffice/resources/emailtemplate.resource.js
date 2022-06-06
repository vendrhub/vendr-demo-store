(function () {

    'use strict';

    function vendrEmailTemplateResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getEmailTemplateCount: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "GetEmailTemplateCount", {
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get email template count");
            },

            getEmailTemplates: function (storeId, category) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "GetEmailTemplates", { 
                        storeId: storeId,
                        category: category
                    })),
                    "Failed to get email templates");
            },

            getEmailTemplate: function (emailTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "GetEmailTemplate", { 
                        emailTemplateId: emailTemplateId
                    })),
                    "Failed to get email template");
            },

            createEmailTemplate: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "CreateEmailTemplate", {
                        storeId: storeId
                    })),
                    "Failed to create email template");
            },

            saveEmailTemplate: function (emailTemplate) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "SaveEmailTemplate"), emailTemplate),
                    "Failed to save email template");
            },

            deleteEmailTemplate: function (emailTemplateId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("emailTemplateApiBaseUrl", "DeleteEmailTemplate", {
                        emailTemplateId: emailTemplateId
                    })),
                    "Failed to delete email template");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrEmailTemplateResource', vendrEmailTemplateResource);

}());