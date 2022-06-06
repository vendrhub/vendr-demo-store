(function () {

    'use strict';

    function VariantsAppController($scope, $routeParams, $q, eventsService, editorService, blockEditorService, notificationsService,
        vendrVariantsEditorState, vendrProductAttributeResource, vendrStoreResource, vendrRouteCache, vendrLocalStorage, vendrUtils) {

        var currentOrParentNodeId = $routeParams.id;

        var productAttributePickerDialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/dialogs/productattributepicker.html',
            size: 'small',
            config: {
                enablePresets: true,
                disablePreselected: true
            },
            submit: function (model) {
                productAttributePickerDialogOptions.onSubmit(model);
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var vm = this;
        vm.loading = true;

        var subs = [];

        vm.store = null;
        vm.options = {
            productAttributes: [],
            productAttributesLookup: {},
            createActions: [{
                name: 'Create Product Variants',
                doAction: function () {
                    pickVariantAttributes(function (model) {

                        // Make sure we have come combinations to add
                        if (!model || model.length === 0)
                            return;

                        var combos = getUniqueAttributeCombinations(model);

                        // Filter out any combinations already present in the layout collection
                        // [ [ pass ], [ fail ] ]
                        var filtered = partition(combos, (c) => {
                            return !vm.layout.find((l) => {
                                return angular.equals(l.config.attributes, c);
                            });
                        });

                        if (filtered[0].length === 0 && filtered[1].length > 0) {
                            // TODO: Show error that all combinations already exist
                        }
                        else {
                            filtered[0].forEach((c) => {
                                addBlock({
                                    attributes: c
                                });
                            });
                        }
                    });
                }
            }],
            filters: [
                //{
                //    name: 'View',
                //    alias: 'attributes',
                //    localStorageKey: 'node_' + currentOrParentNodeId + '_attributesFilter',
                //    getFilterOptions: function () {
                //        var filterOptions = [];

                //        vm.options.productAttributes.forEach((attr) => {
                //            attr.values.forEach((val) => {

                //                var opt = {
                //                    id: attr.alias + ":" + val.alias,
                //                    name: val.name,
                //                    group: attr.name
                //                };

                //                Object.defineProperty(opt, "hidden", {
                //                    get: function () {
                //                        return !vm.layout.some((layout) => {
                //                            return layout.config && layout.config.attributes
                //                                && layout.config.attributes[attr.alias]
                //                                && layout.config.attributes[attr.alias] === val.alias;
                //                        });
                //                    }
                //                });

                //                filterOptions.push(opt);

                //            });
                //        });

                //        return $q.resolve(filterOptions);
                //    }
                //}
            ],
            bulkActions: [
                {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        deleteBlock(bulkItem.$block)
                        return $q.resolve({ success: true });
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") + "?");
                    }
                }
            ],
            items: [],
            itemProperties: [
                {
                    alias: 'name',
                    getter: function (model) {
                        return vm.getPropertyValue(model.$block.content, "sku");
                    },
                    header: 'SKU',
                    placeholder: 'SKU-XXXX'
                },
                // Other columns will be added dynamically
                {
                    alias: 'actions',
                    header: '',
                    align: 'right',
                    template: `<umb-property-actions actions="refScope.vm.rowActionsFactory(model)" class="umb-property-actions__right" ng-click="$event.stopPropagation();"></umb-property-actions>`,
                    refScope: $scope
                }
            ],
            itemClick: function (item, index) {
                vm.editVariantRow(item, index)
            }
        };

        vm.rowActions = {};
        vm.rowActionsFactory = function (itm) {
            if (!vm.rowActions[itm.key]) {
                vm.rowActions[itm.key] = [
                    {
                        //labelKey: "vendr_toggleDefaultVariant", // Use defined property below to allow toggling label
                        icon: "rate",
                        method: function () {
                            vm.toggleDefaultVariantRow(itm);
                        }
                    },
                    {
                        labelKey: "vendr_configureVariant",
                        icon: "settings",
                        method: function () {
                            vm.configureVariantRow(itm);
                        }
                    },
                    {
                        labelKey: "vendr_deleteVariant",
                        icon: "trash",
                        method: function () {
                            vm.removeVariantRow(itm);
                        }
                    }
                ];
                Object.defineProperty(vm.rowActions[itm.key][0], "labelKey", {
                    get: function () {
                        return itm.config.isDefault ? "vendr_unsetDefaultVariant" : "vendr_setDefaultVariant"
                    }
                })
            }
            return vm.rowActions[itm.key];
        };

        var pickVariantAttributes = function (callback) {
            productAttributePickerDialogOptions.config.storeId = vm.store.id;
            productAttributePickerDialogOptions.config.multiValuePicker = true;
            productAttributePickerDialogOptions.config.disablePreselected = true;
            productAttributePickerDialogOptions.value = null;
            productAttributePickerDialogOptions.onSubmit = callback;
            editorService.open(productAttributePickerDialogOptions);
        }

        var getUniqueAttributeCombinations = function (model) {

            // Convert selected value into format
            // { attr_alias: [ val1_alias, val2_alias ] }
            var src = model.map((a) => {
                var r = {};
                r[a.alias] = a.values.map((v) => v.alias);
                return r;
            });

            // Calculate the unique combinations
            return cartesian(src);
        }

        // We debounce syncUI as it's called within functions like addBlock
        // which can get called many times in fast succession when adding
        // multiple variant rows at once
        var syncUI = _.debounce(function () {
            $scope.$apply(function () {
                syncTableUI();
            });
        }, 10);

        var syncTableUI = function () {

            //  Remove all attribute columns from table config
            if (vm.options.itemProperties.length > 2) {
                vm.options.itemProperties.splice(1, vm.options.itemProperties.length - 2);
            }

            // Add table coluns
            var inUseAttrs = [];
            var attrCount = 0;
            vm.options.productAttributes.forEach((attr) => {
                if (vm.layout.some((layout) => layout.config.attributes.hasOwnProperty(attr.alias))) {
                    vm.options.itemProperties.splice(attrCount + 1, 0, {
                        alias: attr.alias,
                        header: attr.name,
                        getter: function (layout) {
                            return layout.config.attributes[attr.alias]
                                ? vm.getProductAttributeValueName(attr.alias, layout.config.attributes[attr.alias])
                                : "";
                        },
                        allowSorting: true,
                        isSystem: false,
                        template: '<div><span ng-if="model.config.attributes[\'' + attr.alias +'\']">{{ refScope.vm.getProductAttributeValueName(\'' + attr.alias + '\', model.config.attributes[\'' + attr.alias +'\']) }}<span></div>',
                        refScope: $scope
                    })
                    inUseAttrs.push(attr);
                    attrCount++;
                }
            });

            // Now lets loop through the layouts and validate that each row has the same number of attributes
            vm.layout.forEach((layout) => {
                if (!inUseAttrs.every((attr) => layout.config.attributes.hasOwnProperty(attr.alias))) {
                    layout.config.isValid = false;
                } else {
                    layout.config.isValid = true;
                }
            });

            var filterConfigs = [];

            inUseAttrs.forEach(attr => {

                var filterConfig = {
                    name: attr.name,
                    alias: attr.alias,
                    localStorageKey: 'node_' + currentOrParentNodeId + '_' + attr.alias + 'Filter',
                    getFilterOptions: function () {
                        var filterOptions = [];
                        attr.values.forEach((val) => {

                            var opt = {
                                id: val.alias,
                                name: val.name
                            };

                            Object.defineProperty(opt, "hidden", {
                                get: function () {
                                    return !vm.layout.some((layout) => {
                                        return layout.config && layout.config.attributes
                                            && layout.config.attributes[attr.alias]
                                            && layout.config.attributes[attr.alias] === val.alias;
                                    });
                                }
                            });

                            filterOptions.push(opt);

                        });

                        return $q.resolve(filterOptions);
                    }
                };

                Object.defineProperty(filterConfig, "value", {
                    get: function () {
                        return vendrLocalStorage.get(filterConfig.localStorageKey) || [];
                    },
                    set: function (value) {
                        vendrLocalStorage.set(filterConfig.localStorageKey, value);
                    }
                });

                filterConfigs.push(filterConfig);

            });


            vm.options.filters = filterConfigs;
        }

        var ensureCultureData = function (blockContent) {

            if (!blockContent) return;

            if (vm.editorState.umbVariantContent.editor.content.language) {
                // set the scaffolded content's language to the language of the current editor
                blockContent.language = vm.editorState.umbVariantContent.editor.content.language;
            }

            // currently we only ever deal with invariant content for blocks so there's only one
            blockContent.variants[0].tabs.forEach(tab => {
                tab.properties.forEach(prop => {
                    // set the scaffolded property to the culture of the containing property
                    prop.culture = vm.editorState.umbProperty.property.culture;
                });
            });

        }

        var getBlockObject = function (layoutEntry) {

            var block = vm.modelObject.getBlockObject(layoutEntry);

            if (block === null) return null;

            ensureCultureData(block.content);

            return block;

        }

        var editBlock = function (blockObject, blockIndex, parentForm, options) {

            options = options || {};

            // this must be set
            if (blockIndex === undefined) {
                throw "blockIndex was not specified on call to editBlock";
            }

            var content = Utilities.copy(blockObject.content);

            if (options.config && options.config.attributes)
            {
                // Insert the variant configuration tab
                content.variants[0].tabs.splice(0, 0, {
                    id: -101,
                    alias: "vendr-configuration",
                    label: "Attributes",
                    type: vendrUtils.isUmbracoV8() ? 0 : "Group",
                    open: true,
                    properties: Object.entries(options.config.attributes).map(entry => {
                        var attr = vm.getProductAttribute(entry[0]);
                        return {
                            id: 0,
                            alias: "vendr-variant-attribute-" + attr.alias,
                            label: attr.name,
                            value: vm.getProductAttributeValueName(entry[0], entry[1]),
                            config: { valueType: 'string' },
                            editor: "Umbraco.ReadOnlyValue",
                            hideLabel: false,
                            readonly: true,
                            validation: { mandatory: false, mandatoryMessage: null, pattern: null, patternMessage: null },
                            view: "readonlyvalue",
                        }
                    })
                });
            }

            var blockEditorModel = {
                $parentScope: $scope, // pass in a $parentScope, this maintains the scope inheritance in infinite editing
                $parentForm: parentForm || vm.editorState.propertyForm, // pass in a $parentForm, this maintains the FormController hierarchy with the infinite editing view (if it contains a form)
                createFlow: options.createFlow === true,
                title: options.createFlow == true ? "Create Variant" : "Edit Variant " + blockObject.label,
                content: content,
                view: "views/common/infiniteeditors/blockeditor/blockeditor.html",
                size: blockObject.config.editorSize || "medium",
                vendrVariantEditor: true,
                submit: function (blockEditorModel) {

                    // If the first tab is the configuration tab, remove it before processing
                    if (blockEditorModel.content.variants[0].tabs[0].alias === "vendr-configuration")
                        blockEditorModel.content.variants[0].tabs.splice(0, 1);

                    // Copy values back to block
                    blockObject.retrieveValuesFrom(blockEditorModel.content);

                    editorService.close();
                },
                close: function (blockEditorModel) {
                    if (blockEditorModel.createFlow) {
                        deleteBlock(blockObject);
                    }
                    editorService.close();
                }
            };

            // open property editor
            editorService.open(blockEditorModel);
        }

        var deleteBlock = function (blockObject) {

            var layoutIndex = vm.layout.findIndex(entry => entry.contentUdi === blockObject.layout.contentUdi);
            if (layoutIndex === -1) {
                throw new Error("Could not find layout entry of block with udi: " + blockObject.layout.contentUdi)
            }

            // setDirty();

            var removed = vm.layout.splice(layoutIndex, 1);

            //removed.forEach(x => {
            //    // remove any server validation errors associated
            //    var guids = [udiService.getKey(x.contentUdi), (x.settingsUdi ? udiService.getKey(x.settingsUdi) : null)];
            //    guids.forEach(guid => {
            //        if (guid) {
            //            serverValidationManager.removePropertyError(guid, vm.umbProperty.property.culture, vm.umbProperty.property.segment, "", { matchType: "contains" });
            //        }
            //    })
            //});

            vm.modelObject.removeDataAndDestroyModel(blockObject);

            syncUI();
        }

        var addBlock = function (config, index) {

            // create layout entry. (not added to property model yet.)
            var layoutEntry = vm.modelObject.create(vm.model.config.variantElementType);
            if (layoutEntry === null) {
                return false;
            }

            // add the config to the layout entry
            layoutEntry.config = config;

            // make block model
            var blockObject = getBlockObject(layoutEntry);
            if (blockObject === null) {
                return false;
            }

            // If we reach this line, we are good to add the layoutEntry and blockObject to our models.
            initLayoutEntry(layoutEntry, blockObject);

            // add layout entry at the decired location in layout.
            vm.layout.splice(index || vm.layout.length, 0, layoutEntry);

            syncUI();

            return true;
        }

        var initLayoutEntry = function (layout, blockObject) {

            layout.$block = blockObject;

            // Define a key for table bulk actions
            Object.defineProperty(layout, "id", {
                get: function () {
                    return blockObject.key;
                }
            });
            Object.defineProperty(layout, "key", {
                get: function () {
                    return blockObject.key;
                }
            });
            Object.defineProperty(layout, "icon", {
                get: function () {
                    return layout.config && layout.config.isValid
                        ? layout.config.isDefault ? 'icon-rate color-green' : 'icon-barcode color-blue'
                        : 'icon-block color-red';
                }
            });

        }

        vm.canEditCulture = function () {
            var content = $scope.variantContent || $scope.content;
            var contentLanguage = content.language;
            var canEditCulture = !contentLanguage || !vm.editorState ||
                // If the property culture equals the content culture it can be edited
                vm.editorState.culture === contentLanguage.culture ||
                // A culture-invariant property can only be edited by the default language variant
                (vm.editorState.culture == null && contentLanguage.isDefault);

            return canEditCulture;
        }

        vm.getProductAttribute = function (attributeAlias) {
            return vm.options.productAttributesLookup.hasOwnProperty(attributeAlias)
                ? vm.options.productAttributesLookup[attributeAlias]
                : null;
        }

        vm.getProductAttributeValue = function (attributeAlias, valueAlias) {
            var attr = vm.getProductAttribute(attributeAlias);
            if (!attr) return null;
            return attr.valuesLookup.hasOwnProperty(valueAlias)
                ? attr.valuesLookup[valueAlias]
                : null;
        }

        vm.getProductAttributeName = function (attributeAlias) {
            return vm.getProductAttribute(attributeAlias).name;
        }

        vm.getProductAttributeValueName = function (attributeAlias, valueAlias) {
            return vm.getProductAttributeValue(attributeAlias, valueAlias).name;
        }

        vm.getProperty = function (blockContent, alias) {
            return blockContent.variants[0].tabs.reduce((prev, curr) => {
                return prev || curr.properties.find(prop => prop.alias === alias);
            }, undefined);
        };

        vm.getPropertyValue = function (blockContent, alias) {
            return vm.getProperty(blockContent, alias).value;
        };

        vm.editVariantRow = function (layoutEntry, idx) {
            editBlock(layoutEntry.$block, idx, null, {
                config: layoutEntry.config
            })
        }

        vm.removeVariantRow = function (layout, $event) {
            if ($event) {
                $event.stopPropagation();
                $event.preventDefault();
            }
            deleteBlock(layout.$block);
        }

        vm.configureVariantRow = function (layout, $event) {
            if ($event) {
                $event.stopPropagation();
                $event.preventDefault();
            }
            productAttributePickerDialogOptions.config.storeId = vm.store.id;
            productAttributePickerDialogOptions.config.multiValuePicker = false;
            productAttributePickerDialogOptions.config.disablePreselected = false;
            if (layout.config && layout.config.attributes) {
                productAttributePickerDialogOptions.value = Object.entries(layout.config.attributes).map(function (itm) {
                    return {
                        alias: itm[0],
                        values: [{ alias: itm[1] }]
                    }
                });
            } else {
                productAttributePickerDialogOptions.value = null;
            }
            
            productAttributePickerDialogOptions.onSubmit = function (model) {

                // Calculate target attributes config object
                var targetAttrObj = model.reduce((obj, attr) => {
                    obj[attr.alias] = attr.values[0].alias;
                    return obj;
                }, {});
                var targetAttrObjStrArr = Object.entries(targetAttrObj).map((itm) => {
                    return itm[0] + ":" + itm[1];
                });

                // Validate there isn't already a variant row with that config
                var found = vm.layout.find((itm) => {

                    if (!itm.config || !itm.config.attributes)
                        return false;

                    var srcAttrObjStrArr = Object.entries(itm.config.attributes).map((itm) => {
                        return itm[0] + ":" + itm[1];
                    });

                    return srcAttrObjStrArr.length == targetAttrObjStrArr.length
                        && srcAttrObjStrArr.every((entry) => {
                            return targetAttrObjStrArr.indexOf(entry) !== -1;
                        });
                })

                if (found && found.contentUdi !== layout.contentUdi) {
                    notificationsService.error("Could not update variant configuration", "A variant with that configuration already exists");
                    return;
                }

                // Update layout config
                if (!layout.config) layout.config = {};
                layout.config.attributes = targetAttrObj;

                syncUI();
            };
            editorService.open(productAttributePickerDialogOptions);
        }

        vm.toggleDefaultVariantRow = function (model, $event) {
            if ($event) {
                $event.stopPropagation();
                $event.preventDefault();
            }
            vm.layout.forEach(layout => {
                if (layout.key === model.key) {
                    layout.config.isDefault = !layout.config.isDefault;
                } else {
                    layout.config.isDefault = false;
                }
            });
        }

        vm.filterVariantRow = function (item, filters) {
            var result = true;

            if (filters) {
                filters.filter(f => f.value.length > 0).forEach((filter) => {
                    result &= filter.value.some(val => item.config
                            && item.config.attributes
                            && item.config.attributes.hasOwnProperty(filter.alias)
                            && item.config.attributes[filter.alias] === val);
                });
            }

            return result;
        }

        vm.syncModelToPropEditor = function () {
            if (!vm.loading) {

                // Copy the local model to the editor model
                vm.editorState.model.value = angular.copy(vm.model.value);

                // Remove any properties we don't want persisting
                vm.editorState.model.value.layout['Vendr.VariantsEditor'].forEach(layout => {

                    delete layout.$block;
                    delete layout.id;
                    delete layout.key;
                    delete layout.icon;
                    delete layout.selected;

                    if (layout.config)
                        delete layout.config.isValid;

                });

                // We don't have settings data, so no point persisting an empty array
                delete vm.editorState.model.value.settingsData;

            }
        }

        vm.ready = function () {

            vm.layout = vm.modelObject.getLayout([]);

            var invalidLayoutEntries = [];

            // Append $block to layouts
            vm.layout.forEach(layoutEntry => {

                // $block must have the data property to be a valid BlockObject, if not its considered as a destroyed blockObject.
                if (layoutEntry.$block === undefined || layoutEntry.$block === null || layoutEntry.$block.data === undefined)
                {
                    var block = getBlockObject(layoutEntry);

                    // If this entry was not supported by our property-editor it would return 'null'.
                    if (block !== null)
                    {
                        initLayoutEntry(layoutEntry, block);
                    }
                    else
                    {
                        // then we need to filter this out and also update the underlying model. This could happen if the data
                        // is invalid for some reason or the data structure has changed.
                        invalidLayoutEntries.push(layoutEntry);
                    }
                }

            });

            // remove the layout entries that are invalid
            invalidLayoutEntries.forEach(layoutEntry => {
                var index = vm.layout.findIndex(x => x === layoutEntry);
                if (index >= 0) {
                    vm.layout.splice(index, 1);
                }
            });

            syncUI();

            vm.loading = false;
        }

        vm.doInit = function () {

            // We clone the editor state model as we only want to sync
            // back an exact value. We'll process the local state and
            // reformat it in formSubmitting handler
            vm.model = angular.copy(vm.editorState.model);

            // Get the current store
            vendrRouteCache.getOrFetch("currentStore", function () {
                return vendrStoreResource.getBasicStoreByNodeId(currentOrParentNodeId);
            })
            .then(function (store) {

                vm.store = store;

                // Get all product attributes 
                // (we'll need them to popluate attribute names, but might aswell reuse them in create dialog too)
                vendrRouteCache.getOrFetch("store_" + store.id +"_productAttributes", function () {
                    return vendrProductAttributeResource.getProductAttributesWithValues(store.id);
                })
                .then(function (productAttributes) {

                    vm.options.productAttributes = productAttributes;
                    vm.options.productAttributesLookup = productAttributes.reduce((a, c) => {
                        a[c.alias] = c;
                        c.valuesLookup = c.values.reduce((a2, c2) => {
                            a2[c2.alias] = c2;
                            return a2;
                        }, {})
                        return a;
                    }, {});

                    // Init model
                    if (vm.model.config.variantElementType) {

                        // Construct a block list modelObject so we can fake being a block list prop editor
                        // We don't have fancy block configurations so we fake a single entry array and 
                        // set it's contentElementTypeKey to our configured variants element type key.
                        vm.modelObject = blockEditorService.createModelObject(vm.model.value,
                            vm.model.editor,
                            [{
                                label: "{{sku}}",
                                contentElementTypeKey: vm.model.config.variantElementType,
                                settingsElementTypeKey: null // We don't use a settings element type
                            }],
                            vm.editorState.scopeOfExistence,
                            vm.editorState.scope);

                        vm.modelObject.load().then(function () {
                            vm.ready();
                        });

                    }

                });
            });

        }

        vm.init = function () {

            vm.editorState = vendrVariantsEditorState.getCurrent();

            if (vm.editorState) {
                vm.doInit();
            }

            var evt1 = eventsService.on("variantsEditorState.changed", function (e, args) {
                vm.editorState = args.state;
                vm.doInit();
            });

            var evt2 = eventsService.on("variantsEditor.modelValueChanged", function (e, args) {
                vm.model = angular.copy(vm.editorState.model);
                vm.modelObject.update(vm.model.value, $scope);
                vm.ready();
            });

            subs.push(function () {
                eventsService.unsubscribe(evt1);
                eventsService.unsubscribe(evt2);
            });

        }

        var cultureChanged = eventsService.on('editors.content.cultureChanged', (name, args) => vm.syncModelToPropEditor());
        subs.push(function () {
            eventsService.unsubscribe(cultureChanged);
        });

        subs.push($scope.$on("formSubmitting", function (ev, args) {
            vm.syncModelToPropEditor();
        }));

        // TODO: Listen for variantsEditor.modelValueChanged for changes to the model on the server

        $scope.$on('$destroy', function () {
            subs.forEach(u => u());
        });

        vm.init();

        // --- Helpers ---

        var partition = function (array, isValid) {
            return array.reduce(([pass, fail], elem) => {
                return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
            }, [[], []]);
        }

        var cartesian = function (arr) {
            function c(part, idx) {
                var k = Object.keys(arr[idx])[0];
                arr[idx][k].forEach((a) => {
                    var p = Object.assign({}, part, { [k]: a });
                    if (idx + 1 === arr.length) {
                        r.push(p);
                        return;
                    }
                    c(p, idx + 1);
                });
            }

            var r = [];
            c({}, 0);
            return r;
        }

    };

    angular.module('vendr').controller('Vendr.Controllers.VariantsAppController', VariantsAppController);

}());