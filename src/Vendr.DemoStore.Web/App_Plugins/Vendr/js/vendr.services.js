(function () {

    'use strict';

    function vendrLocalStorage($cookies) {

        var supportsLocalStorage = (function () {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        })();

        var stash = function (key, value) {
            if (supportsLocalStorage) {
                localStorage.setItem(key, value);
            } else {
                $cookies[key] = value;
            }
        };

        var unstash = function (key) {
            if (supportsLocalStorage) {
                return localStorage.getItem(key);
            } else {
                return $cookies[key];
            }
        };

        var api = {
            get: function (key, fallback) {
                var rawVal = unstash(key);
                if (!rawVal) return fallback;
                return JSON.parse(rawVal);
            },
            set: function (key, obj) {
                stash(key, JSON.stringify(obj));
            }
        };

        return api;

    };

    angular.module('vendr.services').factory('vendrLocalStorage', vendrLocalStorage);

}());
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
(function () {

    'use strict';

    var cache = new Map();

    function vendrRouteCache($rootScope, $q) {

        var api = {

            getOrFetch: function (key, action) {
                if (!cache.has(key)) {
                    cache.set(key, action().then(function (data) {
                        cache.set(key, data);
                        return data;
                    }));
                }
                return $q.when(cache.get(key));
            },

            get: function (key) {
                return $q.when(cache.has(key) ? cache.get(key) : null);
            },

            clear: function (key) {
                cache.delete(key);
            },

            clearAll: function () {
                cache.clear();
            }

        };

        $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
            api.clearAll();
        });

        return api;

    };

    angular.module('vendr.services').factory('vendrRouteCache', vendrRouteCache);

}());
(function () {

    'use strict';

    function vendrUtils () {

        return {
            getSettings: function (key) {

                if (!Umbraco || !Umbraco.Sys || !Umbraco.Sys.ServerVariables || !Umbraco.Sys.ServerVariables["vendr"] || !Umbraco.Sys.ServerVariables["vendr"][key]) {
                    throw "No Vendr setting found with key " + key;
                }

                return Umbraco.Sys.ServerVariables["vendr"][key];

            },
            parseCompositeId: function (id) {
                return id.split('_');
            },
            createCompositeId: function (ids) {
                return ids.join('_');
            },
            createSettingsBreadcrumbFromTreeNode: function (treeNode) {
                var breadcrumb = [];

                var currentNode = treeNode;
                while (currentNode.nodeType !== "Stores" && currentNode.level > 2) {
                    breadcrumb.splice(0, 0, {
                        name: currentNode.name,
                        routePath: currentNode.routePath
                    });
                    currentNode = currentNode.parent();
                }

                return breadcrumb;
            },
            createBreadcrumbFromTreeNode: function (treeNode) {
                var breadcrumb = [];

                var currentNode = treeNode;
                while (currentNode.level > 0) {
                    breadcrumb.splice(0, 0, {
                        name: currentNode.name,
                        routePath: currentNode.routePath
                    });
                    currentNode = currentNode.parent();
                }

                return breadcrumb;
            },
            generateGuid: function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        };

    };

    angular.module('vendr.services').factory('vendrUtils', vendrUtils);

}());
