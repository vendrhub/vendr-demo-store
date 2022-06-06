(function () {

    'use strict';

    function vendrUtils() {

        var regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
            },
            isGuid: function(stringToTest) {
                if (stringToTest[0] === "{") {
                    stringToTest = stringToTest.substring(1, stringToTest.length - 1);
                }
                return regexGuid.test(stringToTest);
            },
            isUmbracoV8: function () {
                return Umbraco.Sys.ServerVariables.application.version.indexOf("8.") == 0;
            }
        };

    };

    angular.module('vendr.services').factory('vendrUtils', vendrUtils);

}());