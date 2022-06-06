(function () {

    'use strict';

    // Create Vendr.interceptors module
    angular.module('vendr.interceptors', [])
        .config(['$httpProvider', function ($httpProvider) {
            $httpProvider.interceptors.push('routeRewritesInterceptor');
            $httpProvider.interceptors.push('menuActionsInterceptor');
        }]);

}());