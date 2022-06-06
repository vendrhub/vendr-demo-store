(function () {

    'use strict';

    function vendrCultureResource($http, umbRequestHelper, vendrRequestHelper) {

        return {
            
            getCultures: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("cultureApiBaseUrl", "GetCultures")),
                    "Failed to get cultures");
            }

        };

    };

    angular.module('vendr.resources').factory('vendrCultureResource', vendrCultureResource);

}());