(function () {

    'use strict';

    function SettingsViewController($scope, $rootScope, $timeout, notificationsService,
        navigationService, vendrUtils, vendrLicensingResource, vendrRouteCache)
    {
        $scope.vendrInfo = vendrUtils.getSettings("vendrInfo");

        $scope.refreshLicense = function (key) {
            vendrLicensingResource.refreshLicense(key).then(function () {
                vendrLicensingResource.getLicensingInfo().then(function (data) {
                    $scope.licensingInfo.licenses = data.licenses;
                    notificationsService.success("Refresh Successful", "License " + key + " successfully refreshed.");
                });
            });
        }

        vendrRouteCache.getOrFetch("vendrLicensingInfo",
            () => vendrLicensingResource.getLicensingInfo()).then(function (data) {
                $scope.licensingInfo = data;
            });

        navigationService.syncTree({ tree: "vendrsettings", path: ["-1"], forceReload: false, activate: true });

    };

    angular.module('vendr').controller('Vendr.Controllers.SettingsViewController', SettingsViewController);

}());