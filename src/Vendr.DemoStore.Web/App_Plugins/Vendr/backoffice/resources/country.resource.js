(function () {

    'use strict';

    function vendrCountryResource($http, umbRequestHelper, vendrRequestHelper) {

        return {
            
            getIso3166CountryRegions: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetIso3166CountryRegions")),
                    "Failed to get ISO 3166 country regions");
            },

            getCountries: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetCountries", { 
                        storeId: storeId 
                    })),
                    "Failed to get countries");
            },

            getRegions: function (storeId, countryId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetRegions", {
                        storeId: storeId,
                        countryId: countryId
                    })),
                    "Failed to get regions");
            },

            getCountriesWithRegions: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetCountriesWithRegions", {
                        storeId: storeId
                    })),
                    "Failed to get countries");
            },

            getCountry: function (countryId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetCountry", { 
                        countryId: countryId
                    })),
                    "Failed to get country");
            },

            getRegion: function (regionId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "GetRegion", {
                        regionId: regionId
                    })),
                    "Failed to get region");
            },

            createCountry: function (storeId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "CreateCountry", {
                        storeId: storeId
                    })),
                    "Failed to create country");
            },

            createAllCountryRegions: function (storeId, defaultCurrencyId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "CreateAllCountryRegions", {
                        storeId: storeId,
                        defaultCurrencyId: defaultCurrencyId
                    })),
                    "Failed to create all countries and regions");
            },

            createRegion: function (storeId, countryId) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "CreateRegion", {
                        storeId: storeId,
                        countryId: countryId
                    })),
                    "Failed to create region");
            },

            saveCountry: function (country) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "SaveCountry"), country),
                    "Failed to save country");
            },

            saveRegion: function (region) {
                return umbRequestHelper.resourcePromise(
                    $http.post(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "SaveRegion"), region),
                    "Failed to save region");
            },

            deleteCountry: function (countryId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "DeleteCountry", {
                        countryId: countryId
                    })),
                    "Failed to delete country");
            },

            deleteRegion: function (regionId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete(vendrRequestHelper.getApiUrl("countryApiBaseUrl", "DeleteRegion", {
                        regionId: regionId
                    })),
                    "Failed to delete region");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrCountryResource', vendrCountryResource);

}());