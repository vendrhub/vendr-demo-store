(function () {

    'use strict';

    function vendrLicenseCheck(vendrUtils, vendrLicensingResource, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {
            vendrRouteCache.getOrFetch("vendrLicensingInfo",
                () => vendrLicensingResource.getLicensingInfo()).then(function (data) {
                    scope.licensingInfo = data;
                    scope.licensingInfo.hasInactive = data.licenses.some(l => !l.isActive);
            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/App_Plugins/Vendr/backoffice/views/directives/vendr-license-check.html',
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrLicenseCheck', vendrLicenseCheck);

}());