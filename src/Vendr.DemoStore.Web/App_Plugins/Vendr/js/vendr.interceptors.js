(function () {

    'use strict';

    function menuActionsInterceptor($injector) {
        return {
            'response': function (resp) {
                if (resp.config.url.indexOf('/GetMenu?') >= 0) {

                    resp.data.menuItems = resp.data.menuItems || [];

                    // Give core defined menu items a sort order in increments of 10 to allow positioning
                    // javascript defined items
                    resp.data.menuItems = resp.data.menuItems.map(function (itm, idx) {
                        itm.sortOrder = (idx + 1) * 100;
                        return itm;
                    });

                    var coreMenuItemsCount = resp.data.menuItems.length;

                    // Parse querystring
                    var qs = resp.config.url.substr(resp.config.url.indexOf('?') + 1);
                    var json = '{"' + decodeURI(qs).replace(/&*$/g, '').replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}';
                    var params = JSON.parse(json);

                    // Fetch the vendrActions service
                    // We have to do it at runtime to avoid a circular dependency
                    // (This is mostly because bulkActions have a $http dependency)
                    var vendrActions = $injector.get('vendrActions');
                    vendrActions.getMenuActions(params).then(additionalMenuItems => {

                        // Append any menu items
                        additionalMenuItems.forEach(function (mi, idx) {

                            // If there is no sort order, place the items at the end
                            if (!mi.sortOrder) {
                                mi.sortOrder = ((coreMenuItemsCount + 1) * 100) + idx;
                            }

                            // Add the menu item
                            resp.data.menuItems.push(mi);
                        });

                        // Sort the menu items
                        resp.data.menuItems.sort(function (a, b) {
                            return a.sortOrder < b.sortOrder ? -1 : (a.sortOrder > b.sortOrder ? 1 : 0);
                        });

                    });
                }
                return resp;
            }
        };
    }
    
    angular.module('vendr.interceptors').factory('menuActionsInterceptor', menuActionsInterceptor);

}());
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
