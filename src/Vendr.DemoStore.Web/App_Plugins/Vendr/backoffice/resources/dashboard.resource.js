//(function () {

//    'use strict';

//    function vendrDashboardResource($http, umbRequestHelper, vendrRequestHelper) {

//        return {
            
//            getStoreStatsForToday: function (storeId) {
//                return umbRequestHelper.resourcePromise(
//                    $http.get(vendrRequestHelper.getApiUrl("dashboardApiBaseUrl", "GetStoreStatsForToday", {
//                        storeId: storeId
//                    })),
//                    "Failed to get store stats for today");
//            }

//        };

//    };

//    angular.module('vendr.resources').factory('vendrDashboardResource', vendrDashboardResource);

//}());