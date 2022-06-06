(function () {

    'use strict';

    function vendrTagResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getTags: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("tagApiBaseUrl", "GetTags", { 
                        storeId: storeId 
                    })),
                    "Failed to get tags");
            },

            getTagsByEntityType: function (storeId, entityType) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("tagApiBaseUrl", "GetTagsByEntityType", {
                        storeId: storeId,
                        entityType: entityType
                    })),
                    "Failed to get tags by entity type");
            },

            getEnityTags: function (storeId, entityId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("tagApiBaseUrl", "GetEnityTags", {
                        storeId: storeId,
                        entityId: entityId
                    })),
                    "Failed to get entity tags");
            }

        };

    }

    angular.module('vendr.resources').factory('vendrTagResource', vendrTagResource);

}());