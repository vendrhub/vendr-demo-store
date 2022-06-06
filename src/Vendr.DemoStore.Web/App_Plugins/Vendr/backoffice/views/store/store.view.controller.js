(function () {

    'use strict';

    function StoreViewController($scope, $routeParams, $location,
        vendrStoreResource, navigationService, vendrActivityLogResource,
        vendrLicensingResource, vendrRouteCache, vendrDateHelper) {

        var id = $routeParams.id;

        var today = vendrDateHelper.getISODateString(new Date());
        var localTimezoneOffset = vendrDateHelper.getLocalTimezoneOffset();

        var vm = this;

        vm.loading = true;
        vm.stats = undefined;
        vm.actions = [];

        vm.activityLogLoading = true;
        vm.activityLogs = {
            items: [],
            pageNumber: 1,
            pageSize: 10
        };

        vm.loadActivityLog = function (page) {
            vm.activityLogLoading = true;
            vendrActivityLogResource.getActivityLogs(id, page, vm.activityLogs.pageSize).then(function (activityLogs) {
                vm.activityLogs = activityLogs;
                vm.activityLogLoading = false;
            });
        }

        vm.refresh = function () {
            vm.loading = true;
            vm.init(true);
        }

        vm.init = function (noSync) {

            vendrRouteCache.getOrFetch("vendrLicensingInfo",
                () => vendrLicensingResource.getLicensingInfo()).then(function (data) {
                    vm.licensingInfo = data;
                });

            if (!noSync) {
                navigationService.syncTree({ tree: "vendr", path: "-1," + id, forceReload: true });
            }

            vendrStoreResource.getStore(id).then(function (store) {
                vm.store = store;
                vendrStoreResource.getStoreStatsForDay(id, today, localTimezoneOffset).then(function (stats) {
                    vm.stats = stats;
                    vendrStoreResource.getStoreActionsForDay(id, today, localTimezoneOffset).then(function (actions) {
                        vm.actions = actions;
                        vm.loading = false;
                    })
                })
            });

            vm.loadActivityLog(1);

        };  

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.StoreViewController', StoreViewController);

}());