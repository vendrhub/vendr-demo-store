(function () {

    'use strict';

    function vendrDateHelper() {

        function treatAsUTC(date) {
            var result = new Date(date);
            result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
            return result;
        }

        function daysBetween(startDate, endDate) {
            var millisecondsPerDay = 24 * 60 * 60 * 1000;
            return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
        }

        var api = {

            getISODateString: function (date) {
                return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                    .toISOString()
                    .split("T")[0];
            },

            getLocalTimezoneOffset: function () {
                return -(new Date().getTimezoneOffset()); // Invert the offset for ISO8601
            },

            getToday: function () {
                var now = new Date();
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            },

            getDaysBetween: function (from, to, inclusive) {
                var days = daysBetween(from, to);
                return days + (inclusive ? 1 : 0);
            },

            getNamedDateRanges: function () {

                var today = api.getToday();

                return [
                    {
                        name: "Last 7 days",
                        alias: "last7",
                        range: [today.addDays(-6), today],
                        prevPeriod: [today.addDays(-13), today.addDays(-7)],
                        prevYear: [today.addDays(-6).addYears(-1), today.addYears(-1)]
                    },
                    {
                        name: "Last 30 days",
                        alias: "last30",
                        range: [today.addDays(-29), today],
                        prevPeriod: [today.addDays(-59), today.addDays(-30)],
                        prevYear: [today.addDays(-29).addYears(-1), today.addYears(-1)]
                    },
                    {
                        name: "This Month",
                        alias: "thisMonth",
                        range: [new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth() + 1, 1).addDays(-1)],
                        prevPeriod: [new Date(today.getFullYear(), today.getMonth(), 1).addMonths(-1), new Date(today.getFullYear(), today.getMonth(), 1).addDays(-1)],
                        prevYear: [new Date(today.getFullYear(), today.getMonth(), 1).addYears(-1), new Date(today.getFullYear(), today.getMonth() + 1, 1).addDays(-1).addYears(-1)]
                    },
                    {
                        name: "Last Month",
                        alias: "lastMonth",
                        range: [new Date(today.getFullYear(), today.getMonth() - 1, 1), new Date(today.getFullYear(), today.getMonth(), 1).addDays(-1)],
                        prevPeriod: [new Date(today.getFullYear(), today.getMonth() - 2, 1), new Date(today.getFullYear(), today.getMonth() - 1, 1).addDays(-1)],
                        prevYear: [new Date(today.getFullYear(), today.getMonth() - 1, 1).addYears(-1), new Date(today.getFullYear(), today.getMonth(), 1).addDays(-1).addYears(-1)]
                    }
                ];

            },

            formatDateRange: function (range) {
                var str = range[0].toLocaleString('default', { month: 'short' }) + " " + range[0].getDate();
                if (range[0].getFullYear() != range[1].getFullYear()) {
                    str += ", " + range[0].getFullYear();
                }
                str += " - ";
                str += range[1].toLocaleString('default', { month: 'short' }) + " " + range[1].getDate() + ", " + range[1].getFullYear();
                return str;
            },

        };

        return api;

    };

    angular.module('vendr.services').factory('vendrDateHelper', vendrDateHelper);

}());
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

    function vendrUtils() {

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
(function () {

    'use strict';

    function vendrVariantsEditorState($rootScope, eventsService) {

        var current = null;

        var api = {

            set: function (state) {
                current = state;
                eventsService.emit("variantsEditorState.changed", { state: state });
            },

            reset: function () {
                current = null;
            },

            getCurrent: function () {
                return current;
            }

        };

        $rootScope.$on('$routeChangeSuccess', () => api.reset());

        return api;
    };

    angular.module('vendr.services').factory('vendrVariantsEditorState', vendrVariantsEditorState);

}());
