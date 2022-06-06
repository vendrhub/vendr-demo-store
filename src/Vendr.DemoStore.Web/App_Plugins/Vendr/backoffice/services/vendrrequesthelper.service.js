(function () {

    'use strict';

    function vendrRequestHelper($http, $q, umbRequestHelper, vendrUtils) {

        return {

            getApiUrl: function (apiName, actionName, queryStrings) {

                var vendrUrls = vendrUtils.getSettings("vendrUrls");

                if (!vendrUrls[apiName]) {
                    throw "No url found for api name " + apiName;
                }

                return vendrUrls[apiName] + actionName +
                    (!queryStrings ? "" : "?" + (angular.isString(queryStrings) ? queryStrings : umbRequestHelper.dictionaryToQueryString(queryStrings)));

            }

        };

    };

    angular.module('vendr.services').factory('vendrRequestHelper', vendrRequestHelper);

}());