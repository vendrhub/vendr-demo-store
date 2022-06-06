(function () {

    'use strict';

    function vendrActivityLogResource($http, umbRequestHelper, vendrRequestHelper) {

        return {
            
            getActivityLogs: function (storeId, currentPage, itemsPerPage) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("activityLogApiBaseUrl", "GetActivityLogs", {
                        storeId: storeId,
                        currentPage: currentPage,
                        itemsPerPage: itemsPerPage
                    })),
                    "Failed to get activity logs");
            },

            getActivityLogsByEntity: function (entityId, entityType, currentPage, itemsPerPage) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("activityLogApiBaseUrl", "GetActivityLogsByEntity", {
                        entityId: entityId,
                        entityType: entityType,
                        currentPage: currentPage,
                        itemsPerPage: itemsPerPage
                    })),
                    "Failed to get activity logs");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrActivityLogResource', vendrActivityLogResource);

}());