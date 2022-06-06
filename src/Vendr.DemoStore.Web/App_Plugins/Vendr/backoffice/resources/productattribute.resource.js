(function () {

    'use strict';

    function vendrProductAttributeResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getProductAttributes: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttributes", { 
                        storeId: storeId 
                    })),
                    "Failed to get product attributes");
            },

            getProductAttributesWithValues: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttributesWithValues", {
                        storeId: storeId
                    })),
                    "Failed to get product attributes");
            },

            getProductAttribute: function (productAttributeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttribute", {
                        productAttributeId: productAttributeId
                    })),
                    "Failed to get product attribute");
            },

            createProductAttribute: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "CreateProductAttribute", {
                        storeId: storeId
                    })),
                    "Failed to create product attribute");
            },

            saveProductAttribute: function (productAttribute) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "SaveProductAttribute"), productAttribute),
                    "Failed to save product attribute");
            },

            deleteProductAttribute: function (productAttributeId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "DeleteProductAttribute", {
                        productAttributeId: productAttributeId
                    })),
                    "Failed to delete product attribute");
            },

            getProductAttributePresets: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttributePresets", {
                        storeId: storeId
                    })),
                    "Failed to get product attribute presets");
            },

            getProductAttributePresetsWithAllowedAttributes: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttributePresetsWithAllowedAttributes", {
                        storeId: storeId
                    })),
                    "Failed to get product attribute presets");
            },

            getProductAttributePreset: function (productAttributePresetId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "GetProductAttributePreset", {
                        productAttributePresetId: productAttributePresetId
                    })),
                    "Failed to get product attribute preset");
            },

            createProductAttributePreset: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "CreateProductAttributePreset", {
                        storeId: storeId
                    })),
                    "Failed to create product attribute preset");
            },

            saveProductAttributePreset: function (productAttributePreset) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "SaveProductAttributePreset"), productAttributePreset),
                    "Failed to save product attribute preset");
            },

            deleteProductAttributePreset: function (productAttributePresetId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("productAttributeApiBaseUrl", "DeleteProductAttributePreset", {
                        productAttributePresetId: productAttributePresetId
                    })),
                    "Failed to delete product attribute preset");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrProductAttributeResource', vendrProductAttributeResource);

}());