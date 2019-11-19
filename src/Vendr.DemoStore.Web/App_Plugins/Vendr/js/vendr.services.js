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
            }
        };

    };

    angular.module('vendr.services').factory('vendrUtils', vendrUtils);

}());
