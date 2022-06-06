(function () {

    'use strict';

    function vendrEntityResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getStoreByEntityId: function (entityType, entityId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("entityApiBaseUrl", "GetStoreByEntityId", {
                        entityType: entityType,
                        entityId: entityId
                    })),
                    "Failed to get basic store by entity id");
            },

            getEntity: function (entityType, entityId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("entityApiBaseUrl", "GetEntity", {
                        entityType: entityType,
                        entityId: entityId
                    })),
                    "Failed to get entity");
            },

            getEntities: function (entityType, storeId, parentId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("entityApiBaseUrl", "GetEntities", {
                        entityType: entityType,
                        storeId: storeId,
                        parentId: parentId
                    })),
                    "Failed to get entities");
            },

            deleteEntity: function (entityType, entityId, storeId, parentId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("entityApiBaseUrl", "DeleteEntity", {
                        entityType: entityType,
                        entityId: entityId,
                        storeId: storeId,
                        parentId: parentId
                    })),
                    "Failed to delete entity");
            },

            sortEntities: function (entityType, sortedEntityIds, storeId, parentId) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("entityApiBaseUrl", "SortEntities"), {
                        entityType: entityType,
                        sortedEntityIds: sortedEntityIds,
                        storeId: storeId,
                        parentId: parentId
                    }),
                    "Failed to sort entities");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrEntityResource', vendrEntityResource);

}());