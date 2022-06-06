(function () {

    'use strict';

    function vendrProductResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getStock: function (storeId, productReference, productVariantReference) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productApiBaseUrl", "GetStock", {
                        storeId: storeId,
                        productReference: productReference,
                        productVariantReference: productVariantReference
                    })),
                    "Failed to get stock");
            },

            getAllStock: function (storeId, productReferences) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("productApiBaseUrl", "GetAllStock"), {
                        storeId: storeId,
                        productReferences: productReferences
                    }),
                    "Failed to get all stock");
            },

            searchProductSummaries: function (storeId, languageIsoCode, searchTerm, opts) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productApiBaseUrl", "SearchProductSummaries", angular.extend({}, {
                        storeId: storeId,
                        languageIsoCode: languageIsoCode,
                        searchTerm: searchTerm
                    }, opts))),
                    "Failed to search product summaries");
            },

            getProductVariantAttributes: function (storeId, productReference, languageIsoCode) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productApiBaseUrl", "GetProductVariantAttributes", {
                        storeId: storeId,
                        productReference: productReference,
                        languageIsoCode: languageIsoCode
                    })),
                    "Failed to get product variant attributes");
            },

            searchProductVariantSummaries: function (storeId, productReference, languageIsoCode, searchTerm, attributes, opts) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productApiBaseUrl", "SearchProductVariantSummaries", angular.extend({}, {
                        storeId: storeId,
                        productReference: productReference,
                        languageIsoCode: languageIsoCode,
                        searchTerm: searchTerm,
                        "attributes[]": attributes
                    }, opts))),
                    "Failed to search product variant summaries");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrProductResource', vendrProductResource);

}());