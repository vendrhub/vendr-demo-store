(function () {

    'use strict';

    function vendrLicensingResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getLicensingInfo: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("licensingApiBaseUrl", "GetLicensingInfo")),
                    "Failed to get licensing info");
            },

            refreshLicense: function (key) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("licensingApiBaseUrl", "RefreshLicense", {
                        key: key
                    })),
                    "Failed to get licensing info");
            }

        };

    }

    angular.module('vendr.resources').factory('vendrLicensingResource', vendrLicensingResource);

}());