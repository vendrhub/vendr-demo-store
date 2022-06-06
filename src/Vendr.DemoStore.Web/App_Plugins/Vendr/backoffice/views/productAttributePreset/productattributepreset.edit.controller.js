(function () {

    'use strict';

    function ProductAttributePresetEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, editorService, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrProductAttributeResource, vendrStoreResource, vendrRouteCache, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var storeAlias = storeId; // Set store alias to id for now as a fallback
        var id = compositeId[1];
        var create = id === '-1';

        var productAttributePickerDialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/dialogs/productattributepicker.html',
            size: 'small',
            config: {
                storeId: storeId,
                enablePresets: false
            },
            submit: function (model) {
                vm.content.allowedAttributes = model.map(function (itm) {
                    return {
                        productAttributeAlias: itm.alias,
                        allowedValueAliases: itm.values.map(function (val) {
                            return val.alias;
                        })
                    }
                });
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
            $location.path("/commerce/vendr/productattributepreset-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.openProductAttributePicker = function () {
            productAttributePickerDialogOptions.value = vm.content.allowedAttributes.map(function (itm) {
                return {
                    alias: itm.productAttributeAlias,
                    values: itm.allowedValueAliases.map(function (val) {
                        return { alias: val }
                    })
                }
            });
            editorService.open(productAttributePickerDialogOptions);
        }

        vm.getProductAttribute = function (alias) {
            if (vm.options.productAttributes) {
                return vm.options.productAttributes.find(function (itm) {
                    return itm.alias === alias;
                });
            }
        }

        vm.getAttributeName = function (alias) {
            var attr = vm.getProductAttribute(alias);
            return attr ? attr.name : alias;
        }

        vm.getAttributeValueName = function (attrAlias, alias) {
            var attr = vm.getProductAttribute(attrAlias);
            if (!attr) return alias;
            var value = attr.values.find(function (val) {
                return val.alias === alias;
            });
            return value ? value.name : alias;
        }

        vm.removeAllowedAttribute = function (attrAlias, $index) {
            var idx = vm.content.allowedAttributes.findIndex(function (itm) {
                return itm.productAttributeAlias === attrAlias;
            });
            if (idx !== -1) {
                vm.content.allowedAttributes.splice(idx, 1);
            }
        }

        vm.removeAllowedAttributeValue = function (attrAlias, valAlias, $index) {
            var attr = vm.content.allowedAttributes.find(function (itm) {
                return itm.productAttributeAlias === attrAlias;
            });
            attr.allowedValueAliases.splice($index, 1);
            if (attr.allowedValueAliases.length == 0) {
                vm.removeAllowedAttribute(attrAlias);
            }
        }

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'ProductAttributePreset' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrRouteCache.getOrFetch("currentStore", function () {
                return vendrStoreResource.getBasicStore(storeId);
            })
            .then(function (store) {
                storeAlias = store.alias;
            });

            vendrRouteCache.getOrFetch("store_" + storeId + "_productAttributesWithValues", function () {
                return vendrProductAttributeResource.getProductAttributesWithValues(storeId);
            })
            .then(function (productAttributes) {
                vm.options.productAttributes = productAttributes;

                if (create) {

                    vendrProductAttributeResource.createProductAttributePreset(storeId).then(function (productAttributePreset) {
                        vm.ready(productAttributePreset);
                    });

                } else {

                    vendrProductAttributeResource.getProductAttributePreset(id).then(function (productAttributePreset) {
                        vm.ready(productAttributePreset);
                    });

                }

            });            
        };

        vm.ready = function (model)
        {
            vm.page.loading = false;

            // Prepare model
            model.icon = model.icon || "icon-equalizer";

            // Sort values based on product attributes order
            if (model.allowedAttributes) {
                model.allowedAttributes.sort(function (a, b) {
                    var aIndex = vm.options.productAttributes.findIndex((i) => i.alias === a.productAttributeAlias);
                    var bIndex = vm.options.productAttributes.findIndex((i) => i.alias === b.productAttributeAlias);
                    if (aIndex < bIndex) return -1;
                    if (aIndex > bIndex) return 1;
                    return 0; 
                });
                model.allowedAttributes.forEach((attr) => {
                    var pa = vm.options.productAttributes.find((i) => i.alias === attr.productAttributeAlias);
                    attr.allowedValueAliases.sort(function (a, b) {
                        var aIndex = pa.values.findIndex((i) => i.alias === a);
                        var bIndex = pa.values.findIndex((i) => i.alias === b);
                        if (aIndex < bIndex) return -1;
                        if (aIndex > bIndex) return 1;
                        return 0;
                    });
                });
            }

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

                vendrProductAttributeResource.saveProductAttributePreset(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/commerce/vendr/productattributepreset-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save product attribute preset " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'ProductAttributePreset' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.ProductAttributePresetEditController', ProductAttributePresetEditController);

}());