(function () {

    'use strict';

    function ProductAttributeEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, editorService, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrProductAttributeResource, vendrStoreResource, vendrRouteCache, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var storeAlias = storeId; // Set store alias to id for now as a fallback
        var id = compositeId[1];
        var create = id === '-1';

        var translationsEditorDialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/dialogs/translatedvalueeditor.html',
            size: 'small',
            submit: function (model) {
                angular.copy(model, translationsEditorDialogOptions.config.values);
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

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

        vm.content = {};
        vm.options = {
            editorActions: [],
        };

        vm.back = function () {
            $location.path("/commerce/vendr/productattribute-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.valueSortableOptions = {
            helper: function (e, ui) {
                ui.children().each(function () {
                    $(this).width($(this).width());
                });
                var clone = ui.clone();
                ui.children().each(function () {
                    $(this).css('width', '');
                });
                return clone;
            },
            axis: "y",
            cursor: "move",
            handle: ".handle",
            placeholder: 'sortable-placeholder',
            items: "tr",
            forcePlaceholderSize: true
        };

        vm.openTranslationsEditor = function (name, values) {
            translationsEditorDialogOptions.config = {
                name: 'Translate ' + name,
                values: values
            }
            editorService.open(translationsEditorDialogOptions);
        }

        vm.addValue = function () {
            vm.content.values.push({
                alias: "",
                name: "",
                nameTranslations: { }
            });
        }

        vm.removeValue = function (itm, idx) {
            vm.content.values = vm.content.values || [];
            vm.content.values.splice(idx, 1);
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'ProductAttribute' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrRouteCache.getOrFetch("currentStore", function () {
                return vendrStoreResource.getBasicStore(storeId);
            })
            .then(function (store) {
                storeAlias = store.alias;
            });


            if (create) {

                vendrProductAttributeResource.createProductAttribute(storeId).then(function (productAttribute) {
                    vm.ready(productAttribute);
                });

            } else {

                vendrProductAttributeResource.getProductAttribute(id).then(function (productAttribute) {
                    vm.ready(productAttribute);
                });

            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;

            // Prepare model
            model.rewards = model.rewards || [];

            vm.content = model;

            // sync state
            editorState.set(vm.content);

            var pathToSync = create ? vm.content.path : vm.content.path.slice(0, -1);
            navigationService.syncTree({ tree: "vendr", path: pathToSync, forceReload: true }).then(function (syncArgs) {
                if (!create) {
                    treeService.getChildren({ node: syncArgs.node }).then(function (children) {
                        var node = children.find(function (itm) {
                            return itm.id === id;
                        });
                        vm.page.menu.currentNode = node;
                        vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(node);
                    });
                } else {
                    vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                    vm.page.breadcrumb.items.push({ name: 'Untitled' });
                }
            });
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrProductAttributeResource.saveProductAttribute(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/commerce/vendr/productattribute-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save product attribute " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'ProductAttribute' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.ProductAttributeEditController', ProductAttributeEditController);

}());