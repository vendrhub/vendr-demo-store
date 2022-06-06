(function () {

    'use strict';

    function vendrStoreResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getStores: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStores")),
                    "Failed to get stores");
            },

            getStoreSummariesForCurrentUser: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStoreSummariesForCurrentUser")),
                    "Failed to get store summaries for current user");
            },

            getBasicStore: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetBasicStore", { 
                        storeId: storeId
                    })),
                    "Failed to get basic store");
            },

            getBasicStoreByNodeId: function (nodeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetBasicStoreByNodeId", {
                        nodeId: nodeId
                    })),
                    "Failed to get basic store by node id");
            },

            getStore: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStore", {
                        storeId: storeId
                    })),
                    "Failed to get store");
            },

            getStoreAlias: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStoreAlias", {
                        storeId: storeId
                    })),
                    "Failed to get store alias");
            },

            createStore: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "CreateStore")),
                    "Failed to create store");
            },

            saveStore: function (store) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "SaveStore"), store),
                    "Failed to save store");
            },

            deleteStore: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "DeleteStore", {
                        storeId: storeId
                    })),
                    "Failed to delete store");
            },

            getStoreStatsForDay: function (storeId, date, localTimezoneOffset) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStoreStatsForDay", {
                        storeId: storeId,
                        date: date,
                        localTimezoneOffset: localTimezoneOffset
                    })),
                    "Failed to get store stats for today");
            },

            getStoreActionsForDay: function (storeId, date, localTimezoneOffset) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("storeApiBaseUrl", "GetStoreActionsForDay", {
                        storeId: storeId,
                        date: date,
                        localTimezoneOffset: localTimezoneOffset
                    })),
                    "Failed to get store actions for today");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrStoreResource', vendrStoreResource);

}());