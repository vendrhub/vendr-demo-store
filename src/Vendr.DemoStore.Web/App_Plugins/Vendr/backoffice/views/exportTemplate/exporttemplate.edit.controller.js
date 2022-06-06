﻿(function () {

    'use strict';

    function ExportTemplateEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrUtilsResource, vendrExportTemplateResource, vendrStoreResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var storeAlias = storeId; // Set store alias to id for now as a fallback
        var id = compositeId[1];
        var create = id === '-1';

        var vm = this;

        vm.page = {};
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            templateCategories: [],
            dictionaryInputOptions: {
                containerKey: "Vendr",
                generateKey: function (fldName) {
                    return "vendr_" + storeAlias.toLowerCase() + "_exporttemplate_" + (vm.content.alias || scope.$id).toLowerCase() + "_" + fldName.toLowerCase();
                }
            },
            editorActions: []
        };

        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/exporttemplate-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'ExportTemplate' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrStoreResource.getStoreAlias(storeId).then(function (alias) {
                storeAlias = alias;
            });

            vendrUtilsResource.getEnumOptions("TemplateCategory").then(function (opts) {
                vm.options.templateCategories = opts;
            });

            vendrUtilsResource.getEnumOptions("ExportStrategy").then(function (opts) {
                vm.options.exportStrategies = opts;
            });

            if (create) {

                vendrExportTemplateResource.createExportTemplate(storeId).then(function (exportTemplate) {
                    vm.ready(exportTemplate);
                });

            } else {

                vendrExportTemplateResource.getExportTemplate(id).then(function (exportTemplate) {
                    vm.ready(exportTemplate);
                });

            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            // sync state
            editorState.set(vm.content);

            var pathToSync = create ? vm.content.path : vm.content.path.slice(0, -1);
            navigationService.syncTree({ tree: "vendrsettings", path: pathToSync, forceReload: true }).then(function (syncArgs) {
                if (!create) {
                    treeService.getChildren({ node: syncArgs.node }).then(function (children) {
                        var node = children.find(function (itm) {
                            return itm.id === id;
                        });
                        vm.page.menu.currentNode = node;
                        vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(node);
                    });
                } else {
                    vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                    vm.page.breadcrumb.items.push({ name: 'Untitled' });
                }
            });
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrExportTemplateResource.saveExportTemplate(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/exporttemplate-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save export template " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'ExportTemplate' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.ExportTemplateEditController', ExportTemplateEditController);

}());