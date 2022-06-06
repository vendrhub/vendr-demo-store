(function () {

    'use strict';

    function vendrDictionaryResource($http, umbRequestHelper, vendrRequestHelper) {

        return {
            
            searchKeys: function (searchKey, maxItems, parentKey) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "SearchKeys"), {
                        searchKey: searchKey,
                        maxItems: maxItems,
                        parentKey: parentKey
                    }),
                    "Failed to search dictionary items");
            },

            ensureRootDictionaryItem: function (key) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "EnsureRootDictionaryItem", {
                        key: key
                    })),
                    "Failed to search dictionary items");
            },

            tryGetDictionaryItemIdByKey: function (key) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "TryGetDictionaryItemIdByKey", {
                        key: key
                    })),
                    "Failed to get dictionary item");
            },

            getDictionaryItemByKey: function (key) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "GetDictionaryItemByKey"),
                    {
                        key: key
                    }),
                    "Failed to get dictionary item");
            },

            getDictionaryItemById: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "GetDictionaryItemById", {
                        id: id
                    })),
                    "Failed to get dictionary item");
            },

            createDictionaryItem: function (parentId, key) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "CreateDictionaryItem", {
                        parentId: parentId,
                        key: key
                    })),
                    "Failed to create dictionary item");
            },

            saveDictionaryItem: function (entity) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("dictionaryApiBaseUrl", "SaveDictionaryItem"),
                        entity),
                    "Failed to save dictionary item");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrDictionaryResource', vendrDictionaryResource);

}());