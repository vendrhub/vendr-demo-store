(function () {

    'use strict';

    function vendrUtilsResource($http, umbRequestHelper, vendrRequestHelper) {

        return {

            getEnumOptions: function (type) {
                return umbRequestHelper.resourcePromise(
                    $http.get(vendrRequestHelper.getApiUrl("utilsApiBaseUrl", "GetEnumOptions", { 
                        type: type
                    })),
                    "Failed to get enum options");
            },

            generateGuid : function () {
                return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                );
            }

        };

    };

    angular.module('vendr.resources').factory('vendrUtilsResource', vendrUtilsResource);

}());