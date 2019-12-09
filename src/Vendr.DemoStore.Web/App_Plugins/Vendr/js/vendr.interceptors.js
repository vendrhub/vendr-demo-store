(function () {

    'use strict';

    var routeMap = [
        {
            // Map Vendr backoffice views to views folder (secific view)
            pattern: /^(\/app_plugins\/vendr)\/backoffice\/vendr[^\/]*\/(.*)-(.*).html$/gi,
            map: '$1/views/$2/$3.html' 
        },
        {
            // Map Vendr backoffice views to views folder
            pattern: /^(\/app_plugins\/vendr)\/backoffice\/vendr[^\/]*\/(.*).html$/gi,
            map: '$1/views/$2/edit.html'
        }
    ];

    function routeRewritesInterceptor($q) {
        return {
            'request': function (config) {
                routeMap.forEach(function (m) {
                    config.url = config.url.replace(m.pattern, m.map);
                });
                return config || $q.when(config);
            }
        };
    }
    
    angular.module('vendr.interceptors').factory('routeRewritesInterceptor', routeRewritesInterceptor);

}());
