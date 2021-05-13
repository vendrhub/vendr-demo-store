(function () {

    'use strict';

    function AnalyticsViewController($scope, $rootScope, $routeParams, $location, appState, editorService,
        vendrAnalyticsResource, navigationService, vendrUtils, vendrLocalStorage, vendrDateHelper) {

        var storeId = $routeParams.id;

        var vm = this;
        vm.widgets = [];

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        // Listen for widgets loading then get the colcade grid to re-render
        $rootScope.$on('VendrAnalyticsWidgetChanged', function () {
            $rootScope.$broadcast("vendrMasonryGridChanged", null);
        });

        var filterTimeframeKey = "vendr_analytics_timeframe";
        var namedDateRanges = vendrDateHelper.getNamedDateRanges();

        vm.filterTimeframe = vendrLocalStorage.get(filterTimeframeKey) || {
            dateRange: {
                alias: "thisMonth"
            },
            compareTo: {
                type: "prevPeriod"
            }
        };

        // If the cached timeframe is a named range, then update all it's values so they are based
        // on todays date, not the date the timeframe was cached.
        // If the cached date range is unnamed however, then we will just use that timeframe
        // This should only happen if the timeframe was "Custom"
        var namedDateRange = namedDateRanges.find(dr => dr.alias === vm.filterTimeframe.dateRange.alias);
        if (namedDateRange) {
            vm.filterTimeframe.dateRange.name = namedDateRange.name;
            vm.filterTimeframe.dateRange.from = vendrDateHelper.getISODateString(namedDateRange.range[0]);
            vm.filterTimeframe.dateRange.to = vendrDateHelper.getISODateString(namedDateRange.range[1]);
            if (vm.filterTimeframe.compareTo && vm.filterTimeframe.compareTo.type) {
                var compareRange = namedDateRange[vm.filterTimeframe.compareTo.type];
                if (compareRange) {
                    vm.filterTimeframe.compareTo.name = vendrDateHelper.formatDateRange(compareRange);
                    vm.filterTimeframe.compareTo.from = vendrDateHelper.getISODateString(compareRange[0]);
                    vm.filterTimeframe.compareTo.to = vendrDateHelper.getISODateString(compareRange[1]);
                }
            }
        }

        var timeframeDialogOptions = {
            view: '/app_plugins/vendr/views/analytics/dialogs/timeframe.html',
            size: 'small',
            config: {
                currentTimeframe: vm.filterTimeframe
            },
            apply: function (model) {
                vendrLocalStorage.set(filterTimeframeKey, model);
                vm.filterTimeframe = model;
                $rootScope.$broadcast('VendrAnalyticsTimeframeChanged', model);
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };


        vm.selectTimeframe = function () {
            timeframeDialogOptions.config.currentTimeframe = vm.filterTimeframe;
            editorService.open(timeframeDialogOptions);
        };

        vm.init = function () {
            vendrAnalyticsResource.getAnalyticsDashboardConfig(storeId).then(function (config) {
                config.widgets.forEach(function (widget) {
                    widget.storeId = storeId;
                });
                vm.widgets = config.widgets;
                vm.ready();
            });
        };  

        vm.ready = function () {
            vm.page.loading = false;
            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",4", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
            });
        }

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.AnalyticsViewController', AnalyticsViewController);

}());
(function () {

    'use strict';

    function AnalyticsTimeframeDialogController($scope, $location, vendrDateHelper)
    {
        var vm = this;

        var currentTimeframe = $scope.model.config.currentTimeframe;

        var today = vendrDateHelper.getToday();

        vm.loading = true;
        vm.title = "Timeframe";

        vm.namedDateRange = currentTimeframe && currentTimeframe.dateRange.alias ? currentTimeframe.dateRange.alias : "thisMonth";
        vm.namedDateRanges = vendrDateHelper.getNamedDateRanges();

        vm.initCustomDateRange = vm.customDateRange = currentTimeframe && (!currentTimeframe.dateRange.alias || currentTimeframe.dateRange.alias == "custom")
            ? [new Date(currentTimeframe.dateRange.from), new Date(currentTimeframe.dateRange.to)]
            : [vm.namedDateRanges[2].range[0], today];
       
        vm.compare = currentTimeframe && currentTimeframe.compareTo;
        vm.compareType = currentTimeframe && currentTimeframe.compareTo && currentTimeframe.compareTo.type
            ? currentTimeframe.compareTo.type
            : "prevPeriod";

        vm.datePickerConfig = {
            mode: "range",
            maxDate: "today",
            dateFormat: "Y-m-d",
            showMonths: 2,
            enableTime: false
        };

        vm.datePickerChange = function (selectedDates, dateStr, instance) {
            if (selectedDates.length == 2) {
                vm.customDateRange = selectedDates;
            }
        }

        vm.apply = function () {

            if ($scope.model.apply) {

                var model = {
                    dateRange: { }
                };

                if (vm.namedDateRange == "custom") {

                    model.dateRange = {
                        name: vendrDateHelper.formatDateRange(vm.customDateRange),
                        alias: "custom",
                        from: vendrDateHelper.getISODateString(vm.customDateRange[0]),
                        to: vendrDateHelper.getISODateString(vm.customDateRange[1])
                    }

                    if (vm.compare) {
                        if (vm.compareType == "prevPeriod") {

                            var rangeDays = vendrDateHelper.getDaysBetween(vm.customDateRange[0], vm.customDateRange[1], true);
                            var compareFrom = vm.customDateRange[0].addDays((rangeDays + 1) * -1);
                            var compareTo = vm.customDateRange[0].addDays(-1);

                            model.compareTo = {
                                name: vendrDateHelper.formatDateRange([compareFrom, compareTo]),
                                type: 'prevPeriod',
                                from: vendrDateHelper.getISODateString(compareFrom),
                                to: vendrDateHelper.getISODateString(compareTo)
                            }

                        } else if (vm.compareType == "prevYear") {

                            var compareFrom = vm.customDateRange[0].addYears(-1);
                            var compareTo = vm.customDateRange[1].addYears(-1);

                            model.compareTo = {
                                name: vendrDateHelper.formatDateRange([compareFrom, compareTo]),
                                type: 'prevYear',
                                from: vendrDateHelper.getISODateString(compareFrom),
                                to: vendrDateHelper.getISODateString(compareTo)
                            }

                        }
                    }

                } else {

                    var namedDateRange = vm.namedDateRanges.find(function (itm) {
                        return itm.alias == vm.namedDateRange;
                    });

                    model.dateRange = {
                        name: namedDateRange.name,
                        alias: namedDateRange.alias,
                        from: vendrDateHelper.getISODateString(namedDateRange.range[0]),
                        to: vendrDateHelper.getISODateString(namedDateRange.range[1])
                    }

                    if (vm.compare) {
                        if (vm.compareType == "prevPeriod") {
                            model.compareTo = {
                                name: vendrDateHelper.formatDateRange(namedDateRange.prevPeriod),
                                type: 'prevPeriod',
                                from: vendrDateHelper.getISODateString(namedDateRange.prevPeriod[0]),
                                to: vendrDateHelper.getISODateString(namedDateRange.prevPeriod[1])
                            }
                        } else if (vm.compareType == "prevYear") {
                            model.compareTo = {
                                name: vendrDateHelper.formatDateRange(namedDateRange.prevYear),
                                type: 'prevYear',
                                from: vendrDateHelper.getISODateString(namedDateRange.prevYear[0]),
                                to: vendrDateHelper.getISODateString(namedDateRange.prevYear[1])
                            }
                        }
                    }

                }

                $scope.model.apply(model);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.AnalyticsTimeframeDialogController', AnalyticsTimeframeDialogController);

}());
(function () {

    'use strict';

    function AvgOrderValueWidgetController($scope, vendrAnalyticsResource) {

        var vm = this;

        vm.loadData = function (timeframe) {
            return vendrAnalyticsResource.getAverageOrderValueReport($scope.config.storeId,
                timeframe.dateRange.from, timeframe.dateRange.to,
                timeframe.compareTo ? timeframe.compareTo.from : undefined,
                timeframe.compareTo ? timeframe.compareTo.to : undefined);
        }
    };

    angular.module('vendr').controller('Vendr.Controllers.AvgOrderValueWidgetController', AvgOrderValueWidgetController);

}());
(function () {

    'use strict';

    function CartConversionRatesWidgetController($scope, $rootScope, $timeout, vendrAnalyticsResource) {

        var vm = this;

        vm.comparing = false;
        vm.data = {};

        vm.loadData = function (timeframe) {
            return vendrAnalyticsResource.getCartConversionRatesReport($scope.config.storeId,
                timeframe.dateRange.from, timeframe.dateRange.to,
                timeframe.compareTo ? timeframe.compareTo.from : undefined,
                timeframe.compareTo ? timeframe.compareTo.to : undefined).then(function (data) {

                    vm.data = data;
                    vm.comparing = timeframe.compareTo;

                    return data;
                });
        }
    };

    angular.module('vendr').controller('Vendr.Controllers.CartConversionRatesWidgetController', CartConversionRatesWidgetController);

}());
(function () {

    'use strict';

    function RepeatCustomerRatesWidgetController($scope, vendrAnalyticsResource) {

        var vm = this;

        vm.loadData = function (timeframe) {
            return vendrAnalyticsResource.getRepeatCustomerRatesReport($scope.config.storeId,
                timeframe.dateRange.from, timeframe.dateRange.to,
                timeframe.compareTo ? timeframe.compareTo.from : undefined,
                timeframe.compareTo ? timeframe.compareTo.to : undefined);
        }
    };

    angular.module('vendr').controller('Vendr.Controllers.RepeatCustomerRatesWidgetController', RepeatCustomerRatesWidgetController);

}());
(function () {

    'use strict';

    function TopSellingProductsWidgetController($scope, $rootScope, $timeout, vendrAnalyticsResource) {

        var vm = this;

        vm.loading = true;
        vm.comparing = false;
        vm.timeframe = $scope.timeframe;
        vm.data = {};

        vm.init = function () {

            vm.loading = true;

            $timeout(function () {
                $rootScope.$broadcast("VendrAnalyticsWidgetChanged", $scope.config);
            }, 1);

            vendrAnalyticsResource.getTopSellingProductsReport($scope.config.storeId,
                vm.timeframe.dateRange.from, vm.timeframe.dateRange.to,
                vm.timeframe.compareTo ? vm.timeframe.compareTo.from : undefined,
                vm.timeframe.compareTo ? vm.timeframe.compareTo.to : undefined).then(function (data) {

                    vm.data = data;

                    vm.comparing = vm.timeframe.compareTo;
                    vm.loading = false;

                    $timeout(function () {
                        $rootScope.$broadcast("VendrAnalyticsWidgetChanged", $scope.config);
                    }, 1);

                });
        }

        vm.init();

        $rootScope.$on("VendrAnalyticsTimeframeChanged", function (evt, timeframe) {
            vm.timeframe = timeframe;
            vm.init();
        });
    };

    angular.module('vendr').controller('Vendr.Controllers.TopSellingProductsWidgetController', TopSellingProductsWidgetController);

}());
(function () {

    'use strict';

    function TotalOrdersWidgetController($scope, vendrAnalyticsResource) {

        var vm = this;

        vm.loadData = function (timeframe) {
            return vendrAnalyticsResource.getTotalOrdersReport($scope.config.storeId,
                timeframe.dateRange.from, timeframe.dateRange.to,
                timeframe.compareTo ? timeframe.compareTo.from : undefined,
                timeframe.compareTo ? timeframe.compareTo.to : undefined);
        }
    };

    angular.module('vendr').controller('Vendr.Controllers.TotalOrdersWidgetController', TotalOrdersWidgetController);

}());
(function () {

    'use strict';

    function TotalRevenueWidgetController($scope, vendrAnalyticsResource) {

        var vm = this;

        vm.loadData = function (timeframe) {
            return vendrAnalyticsResource.getTotalRevenueReport($scope.config.storeId,
                timeframe.dateRange.from, timeframe.dateRange.to,
                timeframe.compareTo ? timeframe.compareTo.from : undefined,
                timeframe.compareTo ? timeframe.compareTo.to : undefined);
        }

    };

    angular.module('vendr').controller('Vendr.Controllers.TotalRevenueWidgetController', TotalRevenueWidgetController);

}());
(function () {

    'use strict';

    function VariantsAppController($scope, $routeParams, $q, eventsService, editorService, blockEditorService, notificationsService,
        vendrVariantsEditorState, vendrProductAttributeResource, vendrStoreResource, vendrRouteCache, vendrLocalStorage, vendrUtils) {

        var currentOrParentNodeId = $routeParams.id;

        var productAttributePickerDialogOptions = {
            view: '/app_plugins/vendr/views/dialogs/productattributepicker.html',
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
(function () {

    'use strict';

    function CountryCreateController($scope, $rootScope, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService,
        vendrUtils, vendrCountryResource, vendrCurrencyResource) {

        var storeId = $scope.currentNode.metaData['storeId'];
        
        var vm = this;

        vm.loading = true;
        vm.createAllButtonState = 'init';
        vm.defaultCurrencyId = null;
        vm.options = {
            view: "selectAction",
            presets: [],
            currencies: []
        };

        vm.init = function () {
            vendrCountryResource.getIso3166CountryRegions().then(function (data) {
                vm.options.presets = data;
                vm.loading = false;
            });
        };

        vm.createNew = function () {
            $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, -1]))
                .search("preset", "false");
            navigationService.hideMenu();
        };

        vm.createNewFromPreset = function (preset) {
            $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, -1]))
                .search("preset", "true")
                .search("code", preset.code)
                .search("name", preset.name);
            navigationService.hideMenu();
        };

        vm.cancelAction = function () {
            vm.options.view = "selectAction";
        }

        vm.selectPreset = function () {
            vm.options.view = "selectPreset";
        };

        vm.createAll = function() {
            vm.options.view = "createAll";
            if (vm.options.currencies.length == 0) {
                vm.loading = true;
                vendrCurrencyResource.getCurrencies(storeId).then(function (data) {
                    vm.options.currencies = data;

                    // If there is only 1 currency option, set this to be
                    // the default currency
                    if (vm.options.currencies.length == 1) {
                        vm.defaultCurrencyId = vm.options.currencies[0].id;
                    }

                    vm.loading = false;
                });
            }
        }

        vm.confirmCreateAll = function () {
            vm.createAllButtonState = 'busy';
            vendrCountryResource.createAllCountryRegions(storeId, vm.defaultCurrencyId).then(function () {

                vm.createAllButtonState = "success";

                navigationService.hideDialog();

                notificationsService.success("All Countries Created", "All countries have been created successfully");

                navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",5", forceReload: true });

                $rootScope.$broadcast("vendrEntityCreated", {
                    entityType: "Country",
                    storeId: storeId
                });

            }, function (err) {
                vm.createAllButtonState = "error";
                notificationsService.error("Failed to create all country regions", err.data.message || err.data.Message || err.errorMsg);
            });
        }

        vm.close = function () {
            navigationService.hideDialog(true);
        };

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.CountryCreateController', CountryCreateController);

}());
(function () {

    'use strict';

    function CountryEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrCountryResource, vendrCurrencyResource, vendrShippingMethodResource, vendrPaymentMethodResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
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

        vm.page.navigation = [
            {
                'name': 'Settings',
                'alias': 'settings',
                'icon': 'icon-settings',
                'view': '/app_plugins/vendr/views/country/subviews/settings.html',
                'active': !$routeParams["view"] || $routeParams["view"] === 'settings'
            }
        ];

        if (!create) {
            vm.page.navigation.push({
                'name': 'Regions',
                'alias': 'regions',
                'icon': 'icon-flag-alt',
                'view': '/app_plugins/vendr/views/country/subviews/regions.html',
                'active': $routeParams["view"] === 'regions'
            });
        }

        vm.options = {
            currencies: [],
            shippingMethods: [],
            paymentMethods: [],
            editorActions: [],
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/country-list/" + vendrUtils.createCompositeId([storeId])).search({});
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Country' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrCurrencyResource.getCurrencies(storeId).then(function (currencies) {
                vm.options.currencies = currencies;
            });

            vendrShippingMethodResource.getShippingMethods(storeId).then(function (shippingMethods) {
                vm.options.shippingMethods = shippingMethods;
            });

            vendrPaymentMethodResource.getPaymentMethods(storeId).then(function (paymentMethods) {
                vm.options.paymentMethods = paymentMethods;
            });

            if (create) {

                vendrCountryResource.createCountry(storeId).then(function (country) {
                    vm.ready(country);
                });

            } else {

                vendrCountryResource.getCountry(id).then(function (country) {
                    vm.ready(country);
                });

            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            if (create && $routeParams['preset'] === 'true') {
                vm.content.name = $routeParams['name'];
                vm.content.code = $routeParams['code'];
                vm.content.presetIsoCode = $routeParams['code'];
            }

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

                vendrCountryResource.saveCountry(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save country " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'Country' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.CountryEditController', CountryEditController);

}());
(function () {

    'use strict';

    function CountryListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrCountryResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'code', header: 'ISO Code' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrCountryResource.getCountries(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/country-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'Country' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",5", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Country',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Country' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityCreated", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.CountryListController', CountryListController);

}());
(function () {

    'use strict';

    function CurrencyEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrCurrencyResource, vendrCultureResource, vendrCountryResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);

        var storeId = compositeId[0];
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
            cultures: [],
            countries: [],
            editorActions: [],
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/currency-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Currency' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrCultureResource.getCultures().then(function (cultures) {
                vm.options.cultures = cultures;
            });

            vendrCountryResource.getCountries(storeId).then(function (countries) {

                countries.forEach(function (country) {

                    Object.defineProperty(country, "checked", {
                        get: function () {
                            return vm.content.allowedCountries
                                && vm.content.allowedCountries.findIndex(function (itm) {
                                    return itm.countryId === country.id;
                                }) > -1;
                        },
                        set: function (value) {
                            if (!vm.content.allowedCountries)
                                vm.content.allowedCountries = [];
                            var idx = vm.content.allowedCountries.findIndex(function (itm) {
                                return itm.countryId === country.id;
                            });
                            if (value) {
                                if (idx === -1) vm.content.allowedCountries.push({ countryId: country.id });
                            } else {
                                if (idx !== -1) vm.content.allowedCountries.splice(idx, 1);
                            }
                        }
                    });

                });

                vm.options.countries = countries;

            });

            if (create) {

                vendrCurrencyResource.createCurrency(storeId).then(function (currency) {
                    vm.ready(currency);
                });

            } else {

                vendrCurrencyResource.getCurrency(id).then(function (currency) {
                    vm.ready(currency);
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

                vendrCurrencyResource.saveCurrency(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/currency-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save currency " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'Currency' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.CurrencyEditController', CurrencyEditController);

}());
(function () {

    'use strict';

    function CurrencyListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrCurrencyResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'code', header: 'ISO Code' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrCurrencyResource.getCurrencies(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/currency-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'Currency' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",6", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Currency',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Currency' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.CurrencyListController', CurrencyListController);

}());
(function () {

    'use strict';

    function CommerceDashboardController($scope, $routeParams, $location, vendrStoreResource) {

        var vm = this;

        vm.loading = true;
        vm.stores = [];

        vm.goToStore = function (storeId) {
            $location.path("/commerce/vendr/store-view/" + storeId);
        }

        vendrStoreResource.getStoreSummariesForCurrentUser().then(function (stores) {

            vm.stores = stores;

            if (vm.stores.length == 1) {
                vm.goToStore(vm.stores[0].id);
                //vm.loading = false;
            } else {
                vm.loading = false;
            }

        });

    };

    angular.module('vendr').controller('Vendr.Controllers.CommerceDashboardController', CommerceDashboardController);

}());
(function () {

    'use strict';

    function CustomPricingEditDialogController($scope) {

        var cfg = $scope.model.config;

        var vm = this;

        vm.page = {};
        vm.page.name = cfg.name;
        vm.page.saveButtonState = 'init';

        vm.content = {
            customPrices: []
        };

        vm.init = function () {

            var customPrices = [];

            cfg.currencies.forEach(function (currency) {

                // Prices should be pre-filtered by country region at this point
                // so we should be ok to just find by currency id
                var price = cfg.prices.find(function (itm) {
                    return itm.currencyId === currency.id;
                });

                var customPrice = {
                    currencyCode: currency.code,
                    currencyId: currency.id,
                    value: price ? price.value : ''
                };

                customPrices.push(customPrice);

            });

            vm.customPrices = customPrices;

        };

        vm.save = function () {

            var model = [];

            vm.customPrices.forEach(function (customPrice) {
                if (customPrice.value || customPrice.value === 0) {
                    model.push({
                        currencyId: customPrice.currencyId,
                        value: customPrice.value
                    });
                }
            });
            
            $scope.model.submit(model);
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.CustomPricingEditDialogController', CustomPricingEditDialogController);

}());
(function () {

    'use strict';

    function DictionaryEditDialogController($scope, $timeout, editorState,
        notificationsService, formHelper, contentEditingHelper,
        vendrDictionaryResource, languageResource) {

        var cfg = $scope.model.config;
        var id = cfg.id;
        var create = id === '-1';

        var vm = this;

        vm.page = {};
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';

        vm.options = {};
        vm.content = {};

        vm.nameDirty = false;

        vm.init = function () {

            if (!create) {

                vendrDictionaryResource.getDictionaryItemById(id).then(function (entity) {
                    vm.ready(entity);
                });

            } else {

                var template = {
                    id: -1,
                    name: cfg.name,
                    translations: []
                };

                languageResource.getAll().then(function (languages) {
                    languages.forEach(function (itm) {
                        template.translations.push({
                            isoCode: itm.culture,
                            languageId: itm.id,
                            displayName: itm.name,
                            translation: cfg.value || ''
                        });
                    });
                });

                vm.ready(template);
            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            //share state
            editorState.set(vm.content);
        };

        vm.save = function () {

            var doSave = function (model, nameDirty) {
                model.nameIsDirty = nameDirty;
                return vendrDictionaryResource.saveDictionaryItem(model).then(function (data) {
                        formHelper.resetForm({ scope: $scope, notifications: data.notifications });
                        vm.page.saveButtonState = "success";
                        $timeout(function () {
                            $scope.model.submit({ key: data.name });
                        }, 500);
                    },
                    function (err) {
                        vm.page.saveButtonState = "error";
                        contentEditingHelper.handleSaveError({
                            redirectOnFailure: false,
                            err: err
                        });
                        notificationsService.error(err.data.message || err.data.Message);
                    });
            };

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                // Umbraco expects dictionary items to exist before we can
                // post save, so we have to call create first
                if (create) {
                    vendrDictionaryResource.createDictionaryItem(cfg.parentId, vm.content.name).then(function (entity) {
                        vm.content.id = entity.id;
                        vm.content.key = entity.key;
                        vm.content.parentId = entity.parentId;
                        vm.nameDirty = false;
                        doSave(vm.content, vm.nameDirty);
                    });
                } else {
                    doSave(vm.content, vm.nameDirty);
                }
            }

        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();

        $scope.$watch("vm.content.name", function (newVal, oldVal) {
            //when the value changes, we need to set the name dirty
            if (newVal && (newVal !== oldVal) && typeof (oldVal) !== "undefined") {
                vm.nameDirty = true;
            }
        });
    }

    angular.module('vendr').controller('Vendr.Controllers.DictionaryEditDialogController', DictionaryEditDialogController);

}());
(function () {

    'use strict';

    function DiscountRewardProviderPickerDialogController($scope, $q,
        vendrDiscountResource, vendrRouteCache)
    {
        var defaultConfig = {
            title: "Select Reward",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function () {
            return vendrRouteCache.getOrFetch("discountRewardProviderDefs", function () {
                return vendrDiscountResource.getDiscountRewardProviderDefinitions();
            });
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.DiscountRewardProviderPickerDialogController', DiscountRewardProviderPickerDialogController);

}());
(function () {

    'use strict';

    function DiscountRuleProviderPickerDialogController($scope, $q,
        vendrDiscountResource, vendrRouteCache)
    {
        var defaultConfig = {
            title: "Select Rule",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function () {
            return vendrRouteCache.getOrFetch("discountRuleProviderDefs", function () {
                return vendrDiscountResource.getDiscountRuleProviderDefinitions();
            });
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.DiscountRuleProviderPickerDialogController', DiscountRuleProviderPickerDialogController);

}());
(function () {

    'use strict';

    function ElementTypePickerDialogController($scope,
        elementTypeResource)
    {
        var defaultConfig = {
            title: "Select an Element Type",
            enableFilter: true,
            orderBy: "sortOrder"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return elementTypeResource.getAll().then(function (data) {
                return data.map(function (itm) {
                    return {
                        id: itm.key,
                        name: itm.name,
                        icon: itm.icon
                    }
                });
            });
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.ElementTypePickerDialogController', ElementTypePickerDialogController);

}());
(function () {

    'use strict';

    function EmailTemplatePickerDialogController($scope,
        vendrEmailTemplateResource)
    {
        var defaultConfig = {
            title: "Select an Email Template",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrEmailTemplateResource.getEmailTemplates(vm.config.storeId, vm.config.category);
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function () {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.EmailTemplatePickerDialogController', EmailTemplatePickerDialogController);

}());
(function () {

    'use strict';

    function ExportDialogController($scope, $http, vendrOrderResource, vendrExportTemplateResource, languageResource) {

        var cfg = $scope.model.config;

        var vm = this;

        vm.page = {};
        vm.page.name = "Export " + cfg.entityType.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        vm.page.exportButtonState = 'init';

        vm.loading = true;

        vm.model = {};
        vm.templateId = null;
        vm.languageIsoCode = null;
        vm.options = {
            languages: []
        };

        vm.init = function () {

            vendrExportTemplateResource.getExportTemplates(cfg.storeId, cfg.category).then(function (templates) {

                vm.options.templates = templates.map((itm, idx) => {
                    itm.checked = false;
                    return itm;
                });

                languageResource.getAll().then(function (languages) {
                    vm.options.languages = languages;

                    var defaultLanguage = languages.find(function (itm) {
                        return itm.isDefault;
                    });

                    if (defaultLanguage) {
                        vm.languageIsoCode = defaultLanguage.culture;
                    }
                    else if (languages.length == 1) {
                        vm.languageIsoCode = languages[0].culture;
                    }

                    vm.loading = false;
                });

            });

        };

        vm.anyTemplatesSelected = function () {
            return vm.options.templates.some(t => t.checked);
        }

        vm.export = function () {

            // Remove previous
            var wrapper = document.getElementById("vendr-export-wrapper");
            if (wrapper) {
                wrapper.parentElement.removeChild(wrapper);
            }

            // Generate form + iframe
            var wrapper = document.createElement('div')
            wrapper.id = "vendr-export-wrapper";
            wrapper.style = "display: none;";

            var frame = document.createElement('iframe');
            frame.src = "about:blank";
            frame.id = "vendr-export-iframe";
            frame.name = "vendr-export-iframe";
            wrapper.appendChild(frame);

            // Generate form
            var form = document.createElement("form");
            form.setAttribute("id", "vendr-export-form");
            form.setAttribute("action", `${Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath}/backoffice/vendr/vendrexport/export`);
            form.setAttribute("method", "post");
            form.target = "vendr-export-iframe";

            var entityTypeEl = document.createElement("input");
            entityTypeEl.setAttribute("type", "hidden");
            entityTypeEl.setAttribute("name", "entityType");
            entityTypeEl.setAttribute("value", cfg.entityType);
            form.append(entityTypeEl);

            var languageIsoCodeEl = document.createElement("input");
            languageIsoCodeEl.setAttribute("type", "hidden");
            languageIsoCodeEl.setAttribute("name", "languageIsoCode");
            languageIsoCodeEl.setAttribute("value", vm.languageIsoCode);
            form.append(languageIsoCodeEl);

            vm.options.templates.filter(t => t.checked).forEach((t, i) => {
                var templateIdEl = document.createElement('input');
                templateIdEl.type = "hidden";
                templateIdEl.name = "templateIds[" + i + "]";
                templateIdEl.value = t.id;
                form.appendChild(templateIdEl);
            });

            cfg.entities.forEach((e, i) => {
                var entityIdEl = document.createElement('input');
                entityIdEl.setAttribute("type", "hidden");
                entityIdEl.setAttribute("name", "entityIds[" + i + "]");
                entityIdEl.setAttribute("value", e.id);
                form.appendChild(entityIdEl);
            });

            wrapper.appendChild(form);

            document.body.appendChild(wrapper);

            // Submit the form
            setTimeout(function () {
                form.submit();
            }, 1);
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.ExportDialogController', ExportDialogController);

}());
(function () {

    'use strict';

    function ExportTemplatePickerDialogController($scope,
        vendrExportTemplateResource)
    {
        var defaultConfig = {
            title: "Select an Export Template",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrExportTemplateResource.getExportTemplates(vm.config.storeId, vm.config.category);
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function () {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.ExportTemplatePickerDialogController', ExportTemplatePickerDialogController);

}());
(function () {

    'use strict';

    function OrderStatusPickerDialogController($scope,
        vendrOrderStatusResource)
    {
        var defaultConfig = {
            title: "Select an Order Status",
            enableFilter: true,
            orderBy: "sortOrder"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrOrderStatusResource.getOrderStatuses(vm.config.storeId);
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.OrderStatusPickerDialogController', OrderStatusPickerDialogController);

}());
(function () {

    'use strict';

    function PrintOptionsDialogController($scope, languageResource, vendrPrintTemplateResource)
    {
        var cfg = $scope.model.config;

        var vm = this;

        vm.loading = true;

        vm.page = {};
        vm.page.name = "Print " + cfg.entityType.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        vm.page.printButtonState = 'init';

        vm.printUrl = false;
        vm.languageIsoCode = null;
        vm.options = {
            templates: [],
            languages: [],
            entityType: cfg.entityType,
            entities: cfg.entities,
            entityHasLanguageIsoCode: cfg.entityHasLanguageIsoCode,
            currentEntityIndex: 0,
            showAllEntities: false
        };

        vm.toggleTemplate = function (template, $event) {
            template.selected = true;
        }

        vm.getPreviewUrl = function (template, entity) {
            var url = `${Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath}/backoffice/vendr/vendrprint/preview?templateId=${template.id}&entityType=${vm.options.entityType}&entityId=${entity.id}`;

            if (!vm.options.entityHasLanguageIsoCode && vm.languageIsoCode) {
                url += `&languageIsoCode=${vm.languageIsoCode}`
            }

            return url;
        }

        vm.anyTemplatesSelected = function () {
            return vm.options.templates.some(t => t.checked);
        }

        vm.init = function () {

            vendrPrintTemplateResource.getPrintTemplates(cfg.storeId, cfg.category).then(function (templates) {
                vm.options.templates = templates.map((itm, idx) => {
                    itm.checked = idx === 0;
                    return itm;
                });

                if (vm.options.entityHasLanguageIsoCode) {
                    vm.loading = false;
                } else {
                    languageResource.getAll().then(function (languages) {
                        vm.options.languages = languages;
                        vm.loading = false;
                    });
                }
            });

        };

        vm.print = function () {

            // Remove previous
            var wrapper = document.getElementById("vendr-print-wrapper");
            if (wrapper) {
                wrapper.parentElement.removeChild(wrapper);
            }

            // Generate form + iframe
            var wrapper = document.createElement('div')
            wrapper.id = "vendr-print-wrapper";
            wrapper.style = "display: none;";

            var frame = document.createElement('iframe');
            frame.src = "about:blank";
            frame.id = "vendr-print-iframe"
            frame.name = "vendr-print-iframe"

            wrapper.appendChild(frame);

            var form = document.createElement('form')
            form.id = "vendr-print-form";
            form.action = `${Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath}/backoffice/vendr/vendrprint/print`;
            form.method = "POST";
            form.target = "vendr-print-iframe";

            var entityTypeInput = document.createElement('input');
            entityTypeInput.type = "hidden";
            entityTypeInput.name = "entityType";
            entityTypeInput.value = vm.options.entityType;
            form.appendChild(entityTypeInput);

            if (!vm.options.entityHasLanguageIsoCode && vm.languageIsoCode) {
                var languageIsoCodeInput = document.createElement('input');
                languageIsoCodeInput.type = "hidden";
                languageIsoCodeInput.name = "languageIsoCode";
                languageIsoCodeInput.value = vm.languageIsoCode;
                form.appendChild(languageIsoCodeInput);
            }

            vm.options.templates.filter(t => t.checked).forEach((t, i) => {
                var templateInput = document.createElement('input');
                templateInput.type = "hidden";
                templateInput.name = "templateIds["+ i +"]";
                templateInput.value = t.id;
                form.appendChild(templateInput);
            });

            vm.options.entities.forEach((e, i) => {
                var entityInput = document.createElement('input');
                entityInput.type = "hidden";
                entityInput.name = "entityIds[" + i +"]";
                entityInput.value = e.id;
                form.appendChild(entityInput);
            });

            wrapper.appendChild(form);

            document.body.appendChild(wrapper);

            // Submit the form
            setTimeout(function () {
                form.submit();
            }, 1);

        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.PrintOptionsDialogController', PrintOptionsDialogController);

}());
(function () {

    'use strict';

    function ProductAttribtuePickerDialogController($scope,
        vendrProductAttributeResource, vendrRouteCache)
    {
        var defaultConfig = {
            enablePresets: true,
            disablePreselected: false,
            multiValuePicker: true
        };

        var vm = this;
        vm.loading = true;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);
        vm.model = {
            value: $scope.model.value || []
        }
        vm.options = {
            productAttributes: [],
            productAttributePresets: [],
            selectedPreset: null,
            skipPreset: false,
            filterTerm: ""
        }

        vm.getView = function () {
            return vm.config.enablePresets && !vm.options.selectedPreset && vm.options.productAttributePresets.length > 0 && !vm.options.skipPreset
                ? 'presets'
                : 'attributes';
        }

        vm.selectPreset = function (preset) {
            vm.options.productAttributes.forEach((attr) => {
                var presetAttr = preset.allowedAttributes.find((a) => a.productAttributeAlias === attr.alias);
                attr.hidden = !presetAttr;
                attr.values.forEach((val) => {
                    val.hidden = !attr.hidden && presetAttr.allowedValueAliases.indexOf(val.alias) === -1;
                });
            });
            vm.options.selectedPreset = preset;
        }

        vm.skipPreset = function () {
            vm.options.productAttributes.forEach((attr) => {
                attr.hidden = false;
                attr.values.forEach((val) => {
                    val.hidden = false;
                });
            });
            vm.options.skipPreset = true;
        }

        vm.getHiddenAttributeCount = function () {
            return vm.options.productAttributes.filter((a) => a.hidden).length;
        }

        vm.getHiddenAttributeValueCount = function (attr) {
            return attr.values.filter((a) => a.hidden).length;
        }

        vm.getSelectedValueCount = function (attr) {
            return attr.values.filter(function (itm) {
                return itm.selected
            }).length;
        }

        vm.showHiddenAttributes = function () {
            vm.options.productAttributes.forEach((attr) => {
                attr.hidden = false;
            });
        }

        vm.showHiddenAttributeValues = function (attr) {
            attr.values.forEach((val) => {
                val.hidden = false;
            });
        }

        vm.toggleExpand = function (attr, $event) {
            attr.expanded = !attr.expanded;
            if ($event) {
                $event.stopPropagation();
                $event.preventDefault();
            }
        };

        vm.toggleSelectAll = function (attr, $event) {
            if ($event) {
                $event.stopPropagation();
                $event.preventDefault();
            }
            if (!vm.config.multiValuePicker || (vm.config.disablePreselected && attr.allPeselected)) {
                return;
            }
            var visibleValues = attr.values.filter((v) => !v.hidden);
            var allVisibleSelected = visibleValues.every((v) => v.selected);
            if (!allVisibleSelected) {
                visibleValues.forEach(function (val) {
                    if (!val.selected) {
                        vm.toggleSelect(attr, val);
                    }
                });
            } else {
                visibleValues.forEach(function (val) {
                    if (val.selected) {
                        vm.toggleSelect(attr, val);
                    }
                });
            }
        }

        vm.toggleSelect = function (attr, val, $event) {
            if ($event) {
                $event.stopPropagation();
                $event.preventDefault();
            }
            if (vm.config.disablePreselected && val.preselected) {
                return;
            }
            if (!val.selected && !vm.config.multiValuePicker) {
                attr.values.forEach((v) => v.selected = false);
            }
            val.selected = !val.selected;
            vm.syncAttributeSelection(attr);
        };

        vm.syncAttributeSelection = function (attr, isPreselection) {
            attr.allSelected = attr.values.every(function (itm) {
                return itm.selected;
            });
            attr.someSelected = !attr.allSelected && attr.values.some(function (itm) {
                return itm.selected;
            });
            if (isPreselection) {
                attr.allPreselected = attr.allSelected;
            }
        }

        vm.select = function () {
            var selection = [];

            vm.options.productAttributes.forEach(function (pa) {

                var vals = [];

                pa.values.forEach(function (val) {
                    if (val.selected) {
                        var valCopy = angular.copy(val);
                        delete valCopy.selected;
                        // We won't deleted preselected as could be usefull
                        // if the parent handler wants to exclude preselected
                        vals.push(valCopy);
                    }
                });

                if (vals.length > 0) {
                    var paCopy = angular.copy(pa);
                    delete paCopy.expanded;
                    delete paCopy.allSelected;
                    delete paCopy.someSelected;
                    // We won't deleted allPreselected as could be usefull
                    // if the parent handler wants to exclude preselected
                    paCopy.values = vals;
                    selection.push(paCopy);
                }

            });

            if ($scope.model.submit) {
                $scope.model.submit(selection);
            }
        };

        vm.cancel = function () {
            vm.options.productAttributes.forEach((attr) => {
                attr.values.forEach((val) => {
                    val.selected = val.preselected;
                    val.hidden = false;
                });
                attr.expanded = false;
                attr.hidden = false;
                vm.syncAttributeSelection(attr);
            });
            vm.options.selectedPreset = null;
            vm.options.skipPreset = false;
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };

        vm.initProductAttributes = function () {

            vendrRouteCache.getOrFetch("store_" + vm.config.storeId + "_productAttributesWithValues", function () {
                return vendrProductAttributeResource.getProductAttributesWithValues(vm.config.storeId);
            })
            .then(function (productAttributes) {

                // TODO: Process product attributes and give them an active tag
                vm.options.productAttributes = productAttributes.map(function (itm) {

                    // Clone the item as it's a cached resource
                    var pa = angular.copy(itm);

                    // Highlight currently selected
                    pa.expanded = false;
                    pa.allSelected = false;
                    pa.someSelected = false;
                    pa.hidden = false;

                    // Find an entry in the model value
                    var modelPa = vm.model.value.find(function (itm) {
                        return itm.alias === pa.alias;
                    });

                    // Highlight the currently selected values
                    pa.values.forEach(function (val) {

                        // Value should already be a copy due to the 
                        // product attribute being deep cloned

                        if (modelPa) {
                            var modelVal = modelPa.values.find(function (itm) {
                                return itm.alias === val.alias;
                            });
                            val.selected = val.preselected = !!modelVal;
                        }
                        else {
                            val.selected = false;
                        }

                        val.hidden = false;

                    });

                    vm.syncAttributeSelection(pa, true);

                    return pa;

                });

                vm.loading = false;
            });
        }

        vm.init = function () {
            if (vm.config.enablePresets) {
                vendrRouteCache.getOrFetch("store_" + vm.config.storeId + "_productAttributePresetsWithAllowedAttributes", function () {
                    return vendrProductAttributeResource.getProductAttributePresetsWithAllowedAttributes(vm.config.storeId);
                })
                .then(function (productAttributePresets) {
                    vm.options.productAttributePresets = productAttributePresets;
                    vm.initProductAttributes();
                });
            } else {
                vm.initProductAttributes();
            }
        }

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.ProductAttribtuePickerDialogController', ProductAttribtuePickerDialogController);

}());
(function () {

    'use strict';

    function SendEmailDialogController($scope, formHelper, vendrOrderResource, languageResource) {

        var cfg = $scope.model.config;

        var vm = this;

        vm.page = {};
        vm.page.name = "Send Email '" + cfg.emailTemplateName + "'";
        vm.page.saveButtonState = 'init';
        vm.page.loading = true;

        vm.model = {};
        vm.options = {
            languages: []
        };

        vm.init = function () {
            vm.model.emailTemplateId = cfg.emailTemplateId;
            vm.model.emailTemplateName = cfg.emailTemplateName;
            vm.model.orderId = cfg.orderId;
            vm.model.onError = function () {
                vm.page.saveButtonState = 'error';
            };

            languageResource.getAll().then(function (languages) {
                vm.options.languages = languages;
                if (vm.model.orderId) {
                    vendrOrderResource.getOrderEmailConfig(vm.model.orderId).then(function (result) {
                        vm.model.to = result.email;
                        vm.model.languageIsoCode = result.languageIsoCode;
                        vm.page.loading = false;
                    });
                } else {
                    vm.page.loading = false;
                }
            });
        };

        vm.save = function () {
            if (formHelper.submitForm({ scope: $scope })) {
                vm.page.saveButtonState = "busy";
                $scope.model.submit(vm.model);
            }
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.SendEmailDialogController', SendEmailDialogController);

}());
(function () {

    'use strict';

    function SettingsEditorDialogController($scope, formHelper)
    {
        var cfg = $scope.model.config;

        var vm = this;

        vm.loading = true;

        vm.page = {};
        vm.page.name = cfg.name;
        vm.page.saveButtonState = 'init';

        vm.settings = angular.copy(cfg.settings);
        vm.options = {
            settingDefinitions: []
        };

        vm.init = function () {
            cfg.loadSettingDefinitions().then(function (settingDefinitions) {

                var defs = settingDefinitions.map((itm) => angular.copy(itm));

                // Remap setting definitions into an Umbraco property model
                defs.forEach(function (itm) {

                    itm.alias = itm.key;
                    itm.label = itm.name;

                    Object.defineProperty(itm, "value", {
                        get: function () {
                            return vm.settings[itm.alias];
                        },
                        set: function (value) {
                            vm.settings[itm.alias] = value;
                        }
                    });

                });

                vm.options.settingDefinitions = defs;

                vm.loading = false;
            });
        };

        vm.save = function () {
            if (formHelper.submitForm({ scope: $scope })) {
                $scope.model.submit(vm.settings);
            }
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.SettingsEditorDialogController', SettingsEditorDialogController);

}());
(function () {

    'use strict';

    function StoreEntityPickerDialogController($scope, vendrEntityResource)
    {
        var defaultConfig = {
            title: "Select Entity",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.config.title = "Select "+ vm.config.entityType.replace(/([A-Z])/g, ' $1');

        vm.store = undefined;
        vm.currentStore = undefined;

        vm.loadItems = function (storeId) {
            if (storeId) {
                return vendrEntityResource.getEntities(vm.config.entityType, storeId);
            } else if (vm.config.storeId === -1) {
                return vendrEntityResource.getEntities("Store").then(function (stores) {
                    if (stores.length == 1) {
                        vm.config.storeId = stores[0].id;
                        vm.store = stores[0];
                        return vm.loadItems();
                    } else {
                        return stores;
                    }
                });
            } else {
                return vendrEntityResource.getEntities(vm.config.entityType, vm.config.storeId);
            }
        };

        vm.back = function (scope) {
            vm.currentStore = undefined;
            scope.reset();
            scope.loadItems();
        };

        vm.select = function (item, scope) {
            if (vm.config.storeId === -1 && !vm.currentStore) {
                vm.currentStore = item;
                scope.reset();
                scope.loadItems(item.id);
            } else {
                $scope.model.value = item;
                $scope.model.value.store = vm.currentStore ?? vm.store;
                if ($scope.model.submit) {
                    $scope.model.submit($scope.model.value);
                }
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.StoreEntityPickerDialogController', StoreEntityPickerDialogController);

}());
(function () {

    'use strict';

    function StorePickerDialogController($scope,
        vendrStoreResource)
    {
        var defaultConfig = {
            title: "Select Store",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrStoreResource.getStores();
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.StorePickerDialogController', StorePickerDialogController);

}());
(function () {

    'use strict';

    function TaxClassPickerDialogController($scope,
        vendrTaxResource)
    {
        var defaultConfig = {
            title: "Select Tax Class",
            enableFilter: true,
            orderBy: "name"
        };

        var vm = this;

        vm.config = angular.extend({}, defaultConfig, $scope.model.config);

        vm.loadItems = function() {
            return vendrTaxResource.getTaxClasses(vm.config.storeId);
        };

        vm.select = function(item) {
            $scope.model.value = item;
            if ($scope.model.submit) {
                $scope.model.submit($scope.model.value);
            }
        };

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.TaxClassPickerDialogController', TaxClassPickerDialogController);

}());
(function () {

    'use strict';

    function TranslatedValueEditorDialogController($scope, editorState, formHelper, languageResource, vendrRouteCache) {

        var cfg = $scope.model.config;

        var vm = this;

        vm.page = {};
        vm.page.name = cfg.name;
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';

        vm.options = {
            languages: []
        };
        vm.content = {};

        vm.init = function () {

            vendrRouteCache.getOrFetch("languages", function () {
                return languageResource.getAll();
            })
            .then(function (languages) {
                vm.options.languages = languages;
                vm.ready(angular.copy(cfg.values || {}));
            });

        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            //share state
            editorState.set(vm.content);
        };

        vm.save = function () {
            if (formHelper.submitForm({ scope: $scope })) {
                $scope.model.submit(vm.content);
            }
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.TranslatedValueEditorDialogController', TranslatedValueEditorDialogController);

}());
(function () {

    'use strict';

    function DiscountEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService, dateHelper, userService,
        vendrUtils, vendrDiscountResource, vendrStoreResource, vendrRouteCache, vendrActions) {

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

        vm.currentUser = null;

        vm.content = {};
        vm.localStartDate = null;
        vm.localExpiryDate = null;
        vm.options = {
            discountTypes: ['Automatic', 'Code'],
            editorActions: [],
        };

        vm.back = function () {
            $location.path("/commerce/vendr/discount-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.addDiscountCode = function () {
            vm.content.codes = vm.content.codes || [];
            vm.content.codes.push({ id: vendrUtils.generateGuid(), code: '', usageLimit: '' });
        };

        vm.removeDiscountCode = function (itm, idx) {
            vm.content.codes = vm.content.codes || [];
            vm.content.codes.splice(idx, 1);
        };

        vm.startDatePickerConfig = {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true
        };
        vm.startDatePickerSetup = function (instance) {
            vm.startDatePickerInstance = instance;
        };
        vm.startDatePickerChange = function (dateStr, instance) {
            if (dateStr) {
                // Convert dates to server timezone
                var serverTime = dateHelper.convertToServerStringTime(moment(dateStr), Umbraco.Sys.ServerVariables.application.serverTimeOffset);
                vm.content.startDate = serverTime;
                // Limit expiry date
                vm.expiryDatePickerInstance.set("minDate", dateStr);
            }
        };
        vm.clearStartDate = function () {
            vm.startDatePickerInstance.clear();
            vm.content.startDate = null;
            vm.expiryDatePickerInstance.set("minDate", null);
        };

        vm.expiryDatePickerConfig = {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true
        };
        vm.expiryDatePickerSetup = function (instance) {
            vm.expiryDatePickerInstance = instance;
        };
        vm.expiryDatePickerChange = function (dateStr, instance) {
            if (dateStr) {
                // Convert dates to server timezone
                var serverTime = dateHelper.convertToServerStringTime(moment(dateStr), Umbraco.Sys.ServerVariables.application.serverTimeOffset);
                vm.content.expiryDate = serverTime;
                // Limit expiry date
                vm.startDatePickerInstance.set("maxDate", dateStr);
            }
        };
        vm.clearExpiryDate = function () {
            vm.expiryDatePickerInstance.clear();
            vm.content.expiryDate = null;
            vm.startDatePickerInstance.set("maxDate", null);
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Discount' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrRouteCache.getOrFetch("currentStore", function () {
                return vendrStoreResource.getBasicStore(storeId);
            })
            .then(function (store) {
                storeAlias = store.alias;
            });
            
            userService.getCurrentUser().then(function (currentUser) {
                vm.currentUser = currentUser;

                if (create) {

                    vendrDiscountResource.createDiscount(storeId).then(function (discount) {
                        vm.ready(discount);
                    });

                } else {

                    vendrDiscountResource.getDiscount(id).then(function (discount) {
                        vm.ready(discount);
                    });

                }

            });
        };

        vm.ready = function (model) {
            vm.page.loading = false;

            // Prepare model
            model.rewards = model.rewards || [];

            vm.content = model;

            // sync state
            editorState.set(vm.content);

            // Localize dates
            if (vm.content.startDate)
                vm.localStartDate = dateHelper.getLocalDate(vm.content.startDate, vm.currentUser.locale, "YYYY-MM-DD HH:mm");

            if (vm.content.expiryDate)
                vm.localExpiryDate = dateHelper.getLocalDate(vm.content.expiryDate, vm.currentUser.locale, "YYYY-MM-DD HH:mm");



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

                vendrDiscountResource.saveDiscount(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/commerce/vendr/discount-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save discount " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'Discount' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.DiscountEditController', DiscountEditController);

}());
(function () {

    'use strict';

    function DiscountListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrDiscountResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'name', template: '<span class="vendr-table-cell-value--multiline"><span>{{name}}</span>{{ blockFurtherDiscounts ? \'<span class="vendr-table-cell-label" style="font-size: 12px;"><i class="fa fa-minus-circle color-red" aria-hidden="true"></i> Blocks all further discounts if applied</span>\' : \'\' }}{{ blockIfPreviousDiscounts ? \'<span class="vendr-table-cell-label" style="font-size: 12px;"><i class="fa fa-chevron-circle-up color-orange"></i> Is not applied if previous discounts already apply</span></span>\' : \'\' }}' },
                { alias: 'type', header: 'Type', template: '<span class="vendr-badge umb-badge umb-badge--xs vendr-bg--{{ typeColor }} truncate">{{ type }}</span>' },
                { alias: 'status', header: 'Status', template: '<span class="vendr-badge umb-badge umb-badge--xs vendr-bg--{{ statusColor }} truncate">{{ status }}</span>' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrDiscountResource.getDiscounts(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/commerce/vendr/discount-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'Discount' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",2", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Discount',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Discount' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.DiscountListController', DiscountListController);

}());
(function () {

    'use strict';

    function EmailTemplateEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrUtilsResource, vendrEmailTemplateResource, vendrStoreResource, vendrActions) {

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
                    return "vendr_" + storeAlias.toLowerCase() + "_emailtemplate_" + (vm.content.alias || scope.$id).toLowerCase() + "_" + fldName.toLowerCase();
                }
            },
            editorActions: []
        };

        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/emailtemplate-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'EmailTemplate' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrStoreResource.getStoreAlias(storeId).then(function (alias) {
                storeAlias = alias;
            });

            vendrUtilsResource.getEnumOptions("TemplateCategory").then(function (opts) {
                vm.options.templateCategories = opts;
            });

            if (create) {

                vendrEmailTemplateResource.createEmailTemplate(storeId).then(function (emailTemplate) {
                    vm.ready(emailTemplate);
                });

            } else {

                vendrEmailTemplateResource.getEmailTemplate(id).then(function (emailTemplate) {
                    vm.ready(emailTemplate);
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

                vendrEmailTemplateResource.saveEmailTemplate(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/emailtemplate-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save email template " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'EmailTemplate' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.EmailTemplateEditController', EmailTemplateEditController);

}());
(function () {

    'use strict';

    function EmailTemplateListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrEmailTemplateResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'category', header: 'Category' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrEmailTemplateResource.getEmailTemplates(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/emailtemplate-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'EmailTemplate' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",10,11", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Email Template',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'EmailTemplate' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.EmailTemplateListController', EmailTemplateListController);

}());
(function () {
     
    'use strict';

    function EntityDeleteController($scope, $rootScope, $location,
        treeService, navigationService, notificationsService , editorState,
        vendrUtils, vendrEntityResource) {

        var currentNode = $scope.currentNode;
        var tree = currentNode.metaData['tree'];
        var nodeType = currentNode.nodeType;
        var storeId = currentNode.metaData['storeId'];
        var parentId = currentNode.parentId;
        var id = currentNode.id;

        var vm = this;
        vm.saveButtonState = 'init';
        vm.currentNode = currentNode;

        vm.performDelete = function () {

            // Prevent double clicking casuing additional delete requests
            vm.saveButtonState = 'busy';

            // Update node UI to show something is happening
            vm.currentNode.loading = true;

            // Reset the error message
            vm.error = null;

            // Perform the delete
            vendrEntityResource.deleteEntity(nodeType, id, storeId, parentId)
                .then(function () {

                    // Stop tree node animation
                    vm.currentNode.loading = false;

                    // Remove the node from the tree
                    try {
                        treeService.removeNode(vm.currentNode);
                    } catch (err) {
                        // If there is an error, the tree probably doesn't show children
                    }

                    // Close the menu
                    navigationService.hideMenu();

                    // Show notification
                    notificationsService.success("Entity deleted", "Entity '" + currentNode.name + "' successfully deleted");

                    // Notify views
                    $rootScope.$broadcast("vendrEntityDeleted", {
                        entityType: nodeType,
                        entityId: id,
                        storeId: storeId,
                        parentId: parentId
                    });

                    // If we have deleted a store, then regardless, navigate back to tree root
                    var editing = editorState.getCurrent();
                    if (nodeType === 'Store' && storeId === editing.storeId) {
                        $location.path("/settings/vendrsettings/settings-view/");
                    }

                }, function (err) {

                    // Stop tree node animation
                    vm.currentNode.loading = false;

                    // Set the error object
                    vm.error = err;

                    // Set not busy
                    vm.saveButtonState = 'error';
                });
        };

        vm.cancel = function () {
            navigationService.hideDialog();
        };

    };

    angular.module('vendr').controller('Vendr.Controllers.EntityDeleteController', EntityDeleteController);

}());
(function () {

    'use strict';

    function EntitySortController($scope, $rootScope, $location, $filter,
        navigationService, notificationsService, vendrEntityResource) {
        
        var currentNode = $scope.currentNode;
        var tree = currentNode.metaData['tree'];
        var nodeType = currentNode.metaData['childNodeType'] || currentNode.nodeType;
        var storeId = currentNode.metaData['storeId'];
        var id = currentNode.id;
        var isListView = currentNode.metaData['isListView'];

        var vm = this;

        vm.loading = false;
        vm.saveButtonState = "init";

        vm.sortOrder = {};
        vm.sortableOptions = {
            distance: 10,
            tolerance: "pointer",
            opacity: 0.7,
            scroll: true,
            cursor: "move",
            helper: function (e, ui) {
                // keep the correct width of each table cell when sorting
                ui.children().each(function () {
                    $(this).width($(this).width());
                });
                return ui;
            },
            update: function () {
                // clear the sort order when drag and drop is used
                vm.sortOrder.column = "";
                vm.sortOrder.reverse = false;
            }
        };

        vm.children = [];

        vm.init = function () {
            vm.loading = true;
            vendrEntityResource.getEntities(nodeType, storeId, id).then(function (items) {
                vm.children = items;
                vm.loading = false;
            });
        };

        vm.sort = function (column) {
            // reverse if it is already ordered by that column
            if (vm.sortOrder.column === column) {
                vm.sortOrder.reverse = !vm.sortOrder.reverse;
            } else {
                vm.sortOrder.column = column;
                vm.sortOrder.reverse = false;
            }
            vm.children = $filter('orderBy')(vm.children, vm.sortOrder.column, vm.sortOrder.reverse);
        };

        vm.save = function () {

            vm.saveButtonState = "busy";

            var sortedIds = _.map(vm.children, function (child) { return child.id; });
            vendrEntityResource.sortEntities(nodeType, sortedIds, storeId, id).then(function () {
                vm.saveButtonState = "success";
                notificationsService.success("Entities sorted", sortedIds.length + " entities sorted successfully");
                if (isListView) {
                    $rootScope.$broadcast("vendrEntitiesSorted", {
                        entityType: nodeType,
                        storeId: storeId,
                        parentId: id
                    });
                } else {
                    navigationService.syncTree({ tree: tree, path: currentNode.path, forceReload: true })
                        .then(() => navigationService.reloadNode(currentNode));
                }
                navigationService.hideDialog();
            }, function (error) {
                vm.error = error;
                vm.saveButtonState = "error";
           });

        };

        vm.close = function () {
            navigationService.hideDialog();
        };

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.EntitySortController', EntitySortController);

}());
(function () {

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
(function () {

    'use strict';

    function ExportTemplateListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrExportTemplateResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'category', header: 'Category' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrExportTemplateResource.getExportTemplates(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/exporttemplate-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'ExportTemplate' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",10,13", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Export Template',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'ExportTemplate' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.ExportTemplateListController', ExportTemplateListController);

}());
(function () {

    'use strict';

    function GiftCardEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, editorService, notificationsService, navigationService, treeService, dateHelper, userService,
        vendrUtils, vendrGiftCardResource, vendrStoreResource, vendrEmailResource, vendrCurrencyResource, vendrRouteCache, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var storeAlias = storeId; // Set store alias to id for now as a fallback
        var id = compositeId[1];
        var create = id === '-1';

        var vm = this;

        vm.create = create;

        vm.page = {};
        vm.page.name = create ? 'Create Gift Card' : 'Edit Gift Card';
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

        vm.currentUser = null;

        vm.content = {};
        vm.localStartDate = null;
        vm.localExpiryDate = null;
        vm.options = {
            currencies: [],
            currencyCodes: {},
            editorActions: [],
        };

        vm.back = function () {
            $location.path("/commerce/vendr/giftcard-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.syncOriginalAmountWithRemainingAmount = function () {
            if (create) {
                vm.content.remainingAmount = vm.content.originalAmount;
            }
        };
        vm.generateCode = function () {
            vendrGiftCardResource.generateGiftCardCode(storeId).then(function (giftCardCode) {
                vm.content.code = giftCardCode;
            });
        };

        vm.expiryDatePickerConfig = {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true
        };
        vm.expiryDatePickerSetup = function (instance) {
            vm.expiryDatePickerInstance = instance;
        };
        vm.expiryDatePickerChange = function (dateStr, instance) {
            if (dateStr) {
                // Convert dates to server timezone
                var serverTime = dateHelper.convertToServerStringTime(moment(dateStr), Umbraco.Sys.ServerVariables.application.serverTimeOffset);
                vm.content.expiryDate = serverTime;
            }
        };
        vm.clearExpiryDate = function () {
            vm.expiryDatePickerInstance.clear();
            vm.content.expiryDate = null;
        };

        vm.sendEmail = function () {
            editorService.open(pickEmailTemplateDialogOptions);
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'GiftCard' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrRouteCache.getOrFetch("currentStore", function () {
                return vendrStoreResource.getBasicStore(storeId);
            })
            .then(function (store) {
                storeAlias = store.alias;
            });

            vendrCurrencyResource.getCurrencies(storeId).then(function (currencies) {
                vm.options.currencies = currencies;
                vm.options.currencyCodes = currencies.reduce((obj, item) => {
                    obj[item.id] = item.code;
                    return obj;
                }, {});
            });

            userService.getCurrentUser().then(function (currentUser) {
                vm.currentUser = currentUser;

                if (create) {

                    vendrGiftCardResource.createGiftCard(storeId).then(function (giftCard) {
                        vm.ready(giftCard);
                    });

                } else {

                    vendrGiftCardResource.getGiftCard(id).then(function (giftCard) {
                        vm.ready(giftCard);
                    });

                }

            });
        };

        vm.ready = function (model) {
            vm.page.loading = false;

            // Prepare model
            vm.content = model;

            // sync state
            editorState.set(vm.content);

            // Localize dates
            if (vm.content.expiryDate)
                vm.localExpiryDate = dateHelper.getLocalDate(vm.content.expiryDate, vm.currentUser.locale, "YYYY-MM-DD HH:mm");


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

                vendrGiftCardResource.saveGiftCard(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/commerce/vendr/giftcard-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save gift card " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'GiftCard' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.GiftCardEditController', GiftCardEditController);

}());
(function () {

    'use strict';

    function GiftCardListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrGiftCardResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'name', template: '<span class="vendr-table-cell-value--multiline"><span><strong>{{code}}<strong></span>{{ orderNumber ? \'<span class="vendr-table-cell-label">#\'+ orderNumber +\'</span>\' : \'\' }}</span>' },
                { alias: 'remainingAmountFormatted', header: 'Remaining', template: '<span class="vendr-table-cell-value--multiline"><span><strong>{{remainingAmountFormatted}}</strong> of {{ originalAmountFormatted }}</span><span class="vendr-progress-bar mt-5" style="width: 100%;max-width: 200px;"><span  class="vendr-progress-bar__bar" style="width: {{ (100 / originalAmount) * remainingAmount }}%;"></span></span></span>' },
                { alias: 'status', header: 'Status', template: '<span class="vendr-badge umb-badge umb-badge--xs vendr-bg--{{ statusColor }} truncate">{{ status }}</span>' },
                { alias: 'createDate', header: 'Create Date', template: "{{ createDate  | date : 'MMMM d, yyyy h: mm a' }}" }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (opts, callback) {
            opts.itemsPerPage = opts.pageSize;
            vendrGiftCardResource.searchGiftCards(storeId, opts).then(function (entities) {
                entities.items.forEach(function (itm) {
                    itm.routePath = '/commerce/vendr/giftcard-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'GiftCard' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",3", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Gift Card',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems({
                        pageNumber: 1
                    }, function () {
                        vm.page.loading = false;
                    });

                });
            });

        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'GiftCard' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems({
                    pageNumber: 1
                }, function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.GiftCardListController', GiftCardListController);

}());
(function () {

    'use strict';

    function OrderStatusEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrOrderStatusResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);

        var storeId = compositeId[0];
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
            editorActions: []
        };

        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/orderstatus-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'OrderStatus' }).then(result => {
                vm.options.editorActions = result;
            });

            if (create) {

                vendrOrderStatusResource.createOrderStatus(storeId).then(function (orderStatus) {
                    vm.ready(orderStatus);
                });

            } else {

                vendrOrderStatusResource.getOrderStatus(id).then(function (orderStatus) {
                    vm.ready(orderStatus);
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

                vendrOrderStatusResource.saveOrderStatus(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/orderstatus-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save order status " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'OrderStatus' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.OrderStatusEditController', OrderStatusEditController);

}());
(function () {

    'use strict';

    function OrderStatusListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrOrderStatusResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'color', header: 'Color', template: '<span class="vendr-color-swatch vendr-bg--{{color}}" title="Color: {{color}}"></span>' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrOrderStatusResource.getOrderStatuses(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/orderstatus-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'OrderStatus' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",2", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Order Status',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'OrderStatus' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.OrderStatusListController', OrderStatusListController);

}());
(function () {

    'use strict';

    function CustomerInfoDialogController($scope, $location, editorService, vendrOrderResource)
    {
        var vm = this;

        vm.loading = true;
        vm.title = "Customer Info";
        vm.registeredCustomer = {
            properties: [],
            isUmbracoMember: false
        };
        vm.orderHistory = [];

        vm.openMember = function (memberKey) {
            editorService.memberEditor({
                id: memberKey,
                submit: function (model) {
                    vendrOrderResource.getOrderRegisteredCustomerInfo($scope.model.config.orderId).then(function (data) {
                        vm.registeredCustomer = data;
                        editorService.close();
                    });
                },
                close: function () {
                    editorService.close();
                }
            });
        }

        vm.openOrder = function (order) {
            if (order.id === $scope.model.config.orderId) {
                vm.close();
            } else {
                editorService.open({
                    view: '/app_plugins/vendr/views/order/edit.html',
                    infiniteMode: true,
                    config: {
                        storeId: order.storeId,
                        orderId: order.id
                    },
                    submit: function (model) {
                        editorService.close();
                    },
                    close: function () {
                        editorService.close();
                    }
                });
            }
        }

        vendrOrderResource.getOrderRegisteredCustomerInfo($scope.model.config.orderId).then(function (data) {
            vm.registeredCustomer = data;
            vendrOrderResource.getOrderHistoryByOrder($scope.model.config.orderId).then(function (data) {
                vm.orderHistory = data;
                vm.loading = false;
            });
        });

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.CustomerInfoDialogController', CustomerInfoDialogController);

}());
(function () {

    'use strict';

    function EditCustomerDetailsController($scope, vendrOrderResource,
        vendrCountryResource)
    {
        var order = $scope.model.config.order;

        var vm = this;
        vm.title = "Edit Customer Details";
        vm.editorConfig = $scope.model.config.editorConfig;
        vm.content = {
            customerFirstName: order.customerFirstName,
            customerLastName: order.customerLastName,
            customerEmail: order.customerEmail,
            paymentCountryId: order.paymentCountryId,
            paymentCountry: order.paymentCountry,
            paymentRegionId: order.paymentCountryId,
            paymentRegion: order.paymentRegion,
            shippingCountryId: order.shippingCountryId,
            shippingCountry: order.shippingCountry,
            shippingRegionId: order.paymentCountryId,
            shippingRegion: order.paymentCountry,
            properties: {}
        };

        ensureProperties(vm.editorConfig.customer);
        ensureProperties(vm.editorConfig.billing);
        ensureProperties(vm.editorConfig.shipping);

        vm.options = {
            countries: [],
            shippingSameAsBilling: vm.editorConfig.shipping.sameAsBilling && vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value == vm.editorConfig.shipping.sameAsBilling.trueValue
        };

        vm.toggleShippingSameAsBilling = function () {
            if (vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value == vm.editorConfig.shipping.sameAsBilling.trueValue) {
                vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value = vm.editorConfig.shipping.sameAsBilling.falseValue;
            } else {
                vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value = vm.editorConfig.shipping.sameAsBilling.trueValue;
            }
            vm.options.shippingSameAsBilling = vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value == vm.editorConfig.shipping.sameAsBilling.trueValue;
        };

        vm.save = function () {
            if ($scope.model.submit) {
                $scope.model.submit(vm.content);
            }
        };

        vm.cancel = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };

        function ensureProperties (cfg) {
            for (const prop in cfg) {
                var alias = cfg[prop].alias;
                vm.content.properties[alias] = order.properties[alias] || { value: "", isReadOnly: false, isServerSideOnly: false };
            }
        }
    }

    angular.module('vendr').controller('Vendr.Controllers.EditCustomerDetailsController', EditCustomerDetailsController);

}());
(function () {

    'use strict';

    function EditPropertiesController($scope)
    {
        var order = $scope.model.config.order;
        var orderLine = $scope.model.config.orderLine;
        var content = orderLine || order;

        var vm = this;
        vm.title = "Edit Properties";
        vm.editorConfig = $scope.model.config.editorConfig;
        vm.content = {
            properties: []
        };

        mapProperties(vm.editorConfig.properties);
        
        vm.save = function () {
            if ($scope.model.submit) {
                $scope.model.submit(vm.content);
            }
        };

        vm.cancel = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };

        function mapProperties (cfg) {
            for (const cfgKey in cfg) {

                var alias = cfg[cfgKey].alias;

                var prop = content.properties[alias] || { value: "", isReadOnly: false, isServerSideOnly: false };

                var property = {
                    alias: alias,
                    label: cfg[cfgKey].label || alias,
                    description: cfg[cfgKey].description,
                    config: cfg[cfgKey].config || {},
                    view: cfg[cfgKey].view || 'textbox',

                    value: prop.value,
                    isReadOnly: prop.isReadOnly,
                    isServerSideOnly: prop.isServerSideOnly
                };

                // Push some additional config into the property config
                property.config.storeId = $scope.model.config.orderId;
                property.config.orderId = $scope.model.config.orderId;
                property.config.orderLineId = $scope.model.config.orderLineId;

                if (prop.isReadOnly || cfg[cfgKey].isReadOnly) { // isServerSideOnly?
                    property.view = "readonlyvalue";
                }

                if (property.view === 'dropdown') {
                    property.view = '/app_plugins/vendr/views/propertyeditors/dropdown/dropdown.html';
                }

                vm.content.properties.push(property);
            }
        }
    }

    angular.module('vendr').controller('Vendr.Controllers.EditPropertiesController', EditPropertiesController);

}());
(function () {

    'use strict';

    function TransactionInfoDialogController($scope, vendrOrderResource)
    {
        var vm = this;

        vm.title = "Transaction Info";
        vm.properties = [];

        vendrOrderResource.getOrderTransactionInfo($scope.model.config.orderId).then(function (data) {
            vm.properties = data;
        });

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.TransactionInfoDialogController', TransactionInfoDialogController);

}());
(function () {

    'use strict';

    function OrderEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, editorService, localizationService, notificationsService, navigationService, overlayService,
        vendrUtils, vendrOrderResource, vendrStoreResource, vendrEmailResource, vendrActions) {

        var infiniteMode = editorService.getNumberOfEditors() > 0 ? true : false;
        var compositeId = infiniteMode
            ? [$scope.model.config.storeId, $scope.model.config.orderId] 
            : vendrUtils.parseCompositeId($routeParams.id);

        var storeId = compositeId[0];
        var id = compositeId[1];

        var transactionInfoDialogOptions = {
            view: '/app_plugins/vendr/views/order/dialogs/transactioninfo.html',
            size: 'small',
            config: {
                storeId: storeId,
                orderId: id
            },
            close: function () {
                editorService.close();
            }
        };

        var customerInfoDialogOptions = {
            view: '/app_plugins/vendr/views/order/dialogs/customerinfo.html',
            size: 'small',
            config: {
                storeId: storeId,
                orderId: id
            },
            close: function () {
                editorService.close();
            }
        };

        var editCustomerDetailsDialogOptions = {
            view: '/app_plugins/vendr/views/order/dialogs/editcustomerdetails.html',
            config: {
                storeId: storeId,
                orderId: id
            },
            submit: function (model) {

                // Copy model values back over
                vm.content.customerFirstName = model.customerFirstName;
                vm.content.customerLastName = model.customerLastName;
                vm.content.customerEmail = model.customerEmail;

                for (var key in model.properties) {
                    var prop = model.properties[key];
                    if (prop.value) {
                        vm.content.properties[key] = prop;
                    } else {
                        delete vm.content.properties[key];
                    }
                }

                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var editPropertiesDialogOptions = {
            view: '/app_plugins/vendr/views/order/dialogs/editproperties.html',
            size: 'small',
            config: {
                storeId: storeId,
                orderId: id
            },
            close: function () {
                editorService.close();
            }
        };

        var vm = this;

        vm.page = {};
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';
        vm.page.editView = false;
        vm.page.isInfiniteMode = infiniteMode;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.cancelPaymentButtonState = 'init';
        vm.capturePaymentButtonState = 'init';
        vm.refundPaymentButtonState = 'init';

        vm.options = {
            expandedBundles: [],
            editorActions: [],
        };
        vm.content = {};

        vm.close = function () {
            if ($scope.model.close) {
                $scope.model.close();
            }
        }

        vm.back = function () {
            $location.path("/commerce/vendr/order-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.bundleIsExpanded = function (id) {
            return vm.options.expandedBundles.findIndex(function (v) {
                return v === id;
            }) >= 0;
        };

        vm.toggleBundle = function (id) {
            var idx = vm.options.expandedBundles.findIndex(function (v) {
                return v === id;
            });
            if (idx >= 0) {
                vm.options.expandedBundles.splice(idx, 1);
            } else {
                vm.options.expandedBundles.push(id);
            }
        };

        vm.hasEditableOrderLineProperties = function (orderLine) {
            if (!vm.editorConfig.orderLine.properties)
                return false;

            var editablePropertyConfigs = vm.editorConfig.orderLine.properties
                .filter(function (c) {
                    return c.showInEditor !== false;
                });

            if (editablePropertyConfigs.length === 0)
                return false;

            return true;
        };

        vm.editOrderLineProperties = function (orderLine) {
            editPropertiesDialogOptions.config.order = vm.content;
            editPropertiesDialogOptions.config.orderLineId = orderLine.id;
            editPropertiesDialogOptions.config.orderLine = orderLine;
            editPropertiesDialogOptions.config.editorConfig = {
                properties: vm.editorConfig.orderLine.properties
            };
            editPropertiesDialogOptions.submit = function (model) {
                model.properties.forEach(function (itm, idx) {
                    orderLine.properties[itm.alias] = {
                        value: itm.value,
                        isReadOnly: itm.isReadOnly,
                        isServerSideOnly: itm.isServerSideOnly
                    };
                });
                editorService.close();
            };
            editorService.open(editPropertiesDialogOptions);
        };

        vm.hasEditableOrderProperties = function () {
            if (!vm.editorConfig.additionalInfo)
                return false;

            var editablePropertyConfigs = vm.editorConfig.additionalInfo
                .filter(function (c) {
                    return c.showInEditor !== false;
                });

            if (editablePropertyConfigs.length === 0)
                return false;

            return true;
        };

        vm.editOrderProperties = function () {
            editPropertiesDialogOptions.config.order = vm.content;
            editPropertiesDialogOptions.config.orderLineId = undefined;
            editPropertiesDialogOptions.config.orderLine = undefined;
            editPropertiesDialogOptions.config.editorConfig = {
                properties: vm.editorConfig.additionalInfo
            };
            editPropertiesDialogOptions.submit = function (model) {
                model.properties.forEach(function (itm, idx) {
                    vm.content.properties[itm.alias] = {
                        value: itm.value,
                        isReadOnly: itm.isReadOnly,
                        isServerSideOnly: itm.isServerSideOnly
                    };
                });
                editorService.close();
            };
            editorService.open(editPropertiesDialogOptions);
        };

        vm.copySuccess = function (description) {
            notificationsService.success("Copy Successful", description + " successfully copied to the clipboard.");
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Order' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrStoreResource.getStoreOrderEditorConfig(storeId).then(function (config) {
                vm.editorConfig = config;
                vm.editorConfig.view = vm.editorConfig.view || '/app_plugins/vendr/views/order/subviews/edit.html';
                vendrOrderResource.getOrder(id).then(function (order) {

                    // Ensure notes properties
                    if (vm.editorConfig.notes.customerNotes && !order.properties[vm.editorConfig.notes.customerNotes.alias]) {
                        order.properties[vm.editorConfig.notes.customerNotes.alias] = { value: "" };
                    }
                    if (vm.editorConfig.notes.internalNotes && !order.properties[vm.editorConfig.notes.internalNotes.alias]) {
                        order.properties[vm.editorConfig.notes.internalNotes.alias] = { value: "" };
                    }

                    vm.ready(order);

                    // Sync payment status
                    vendrOrderResource.syncPaymentStatus(id).then(function (order) {
                        vm.content.paymentStatus = order.paymentStatus;
                        vm.content.paymentStatusName = order.paymentStatusName;
                    });
                });
            });
        };

        //vm.viewOnMap = function (postcode) {
        //    editorService.open({
        //        title: "Map",
        //        view: "/app_plugins/vendr/views/dialogs/iframe.html",
        //        submit: function (model) {
        //            editorService.close();
        //        },
        //        close: function () {
        //            editorService.close();
        //        }
        //    });
        //};

        vm.viewTransactionInfo = function () {
            editorService.open(transactionInfoDialogOptions);
        };

        vm.viewCustomerInfo = function () {
            editorService.open(customerInfoDialogOptions);
        };

        vm.doConfirm = function (title, message, submitButtonLabelKey, action) {
            overlayService.confirm({
                title: title,
                content: message,
                submitButtonLabelKey: submitButtonLabelKey,
                submitButtonStyle: "warning",
                close: function () {
                    overlayService.close();
                },
                submit: function () {
                    action();
                    overlayService.close();
                }
            });
        }

        vm.confirmCancelPayment = function () {
            vm.doConfirm("Confirm Payment Cancel", "Are you sure you want to cancel this payment?", "actions_cancelPayment", () => vm.cancelPayment());
        }

        vm.cancelPayment = function () {
            vm.cancelPaymentButtonState = 'busy';
            vendrOrderResource.cancelPayment(id).then(function(order) {
                vm.content.paymentStatus = order.paymentStatus;
                vm.content.paymentStatusName = order.paymentStatusName;
                vm.cancelPaymentButtonState = 'success';
                notificationsService.success("Payment Cancelled", "Pending payment successfully cancelled.");
            }, function (err) {
                vm.cancelPaymentButtonState = 'error';
            });
        };

        vm.confirmCapturePayment = function () {
            vm.doConfirm("Confirm Payment Capture", "Are you sure you want to capture this payment?", "actions_capturePayment", () => vm.capturePayment());
        }

        vm.capturePayment = function () {
            vm.capturePaymentButtonState = 'busy';
            vendrOrderResource.capturePayment(id).then(function(order) {
                vm.content.paymentStatus = order.paymentStatus;
                vm.content.paymentStatusName = order.paymentStatusName;
                vm.capturePaymentButtonState = 'success';
                notificationsService.success("Payment Captured", "Pending payment successfully captured.");
            }, function (err) {
                    vm.capturePaymentButtonState = 'error';
            });
        };

        vm.confirmRefundPayment = function () {
            vm.doConfirm("Confirm Payment Refund", "Are you sure you want to refund this payment?", "actions_refundPayment", () => vm.refundPayment());
        }

        vm.refundPayment = function () {
            vm.refundPaymentButtonState = 'busy';
            vendrOrderResource.refundPayment(id).then(function(order) {
                vm.content.paymentStatus = order.paymentStatus;
                vm.content.paymentStatusName = order.paymentStatusName;
                vm.refundPaymentButtonState = 'success';
                notificationsService.success("Payment Refunded", "Captured payment successfully refunded.");
            }, function (err) {
                vm.refundPaymentButtonState = 'error';
            });
        };

        vm.changeStatus = function() {
            editorService.open(changeStatusDialogOptions);
        };

        vm.sendEmail = function() {
            editorService.open(pickEmailTemplateDialogOptions);
        };

        vm.editCustomerDetails = function () {
            editCustomerDetailsDialogOptions.config.order = vm.content;
            editCustomerDetailsDialogOptions.config.editorConfig = vm.editorConfig;
            editorService.open(editCustomerDetailsDialogOptions);
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            // sync state
            editorState.set(vm.content);

            if (infiniteMode)
                return;
             
            var pathToSync = vm.content.path.slice(0, -1);
            navigationService.syncTree({ tree: "vendr", path: pathToSync, forceReload: true }).then(function (syncArgs) {

                var orderOrCartNumber = '#' + (vm.content.orderNumber || vm.content.cartNumber);

                // Fake a current node
                // This is used in the header to generate the actions menu
                var application = syncArgs.node.metaData.application;
                var tree = syncArgs.node.metaData.tree;
                vm.page.menu.currentNode = {
                    id: id,
                    name: orderOrCartNumber,
                    nodeType: "Order",
                    menuUrl: `${Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath}/backoffice/Vendr/StoresTree/GetMenu?application=${application}&tree=${tree}&nodeType=Order&storeId=${storeId}&id=${id}`,
                    metaData: {
                        tree: tree,
                        storeId: storeId
                    }
                };

                // Build breadcrumb for parent then append current node
                var breadcrumb = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                breadcrumb.push({ name: orderOrCartNumber, routePath: "" });
                vm.page.breadcrumb.items = breadcrumb;

            });
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrOrderResource.saveOrder(vm.content).then(function(saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    vm.ready(saved);

                }, function(err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save order",
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'Order' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.OrderEditController', OrderEditController);

}());
(function () {

    'use strict';

    function OrderListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrOrderResource, vendrOrderStatusResource, vendrRouteCache, vendrLocalStorage,
        vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            filters: [
                {
                    name: 'Order Status',
                    alias: 'orderStatusIds',
                    localStorageKey: 'store_' + storeId + '_orderStatusFilter',
                    getFilterOptions: function () {
                        return vendrRouteCache.getOrFetch("store_" + storeId + "_orderStatuses", function () {
                            return vendrOrderStatusResource.getOrderStatuses(storeId);
                        })
                        .then(function (items) {
                            return items.map(function (itm) {
                                return {
                                    id: itm.id,
                                    name: itm.name,
                                    color: itm.color
                                };
                            });
                        });
                    }
                },
                {
                    name: 'Payment Status',
                    alias: 'paymentStatuses',
                    localStorageKey: 'store_' + storeId + '_paymentStatusFilter',
                    getFilterOptions: function () {
                        return $q.resolve([
                            { id: 1, name: 'Authorized', color: 'light-blue' },
                            { id: 2, name: 'Captured', color: 'green' },
                            { id: 3, name: 'Cancelled', color: 'grey' },
                            { id: 4, name: 'Refunded', color: 'orange' },
                            { id: 5, name: 'Pending', color: 'deep-purple' },
                            { id: 200, name: 'Error', color: 'red' }
                        ]);
                    }
                }
            ],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'name', template: '<span class="vendr-table-cell-value--multiline"><span>{{customerFullName}}</span><span class="vendr-table-cell-label">#{{orderNumber}}</span></span>' },
                { alias: 'finalizedDate', header: 'Date', template: "{{ finalizedDate  | date : 'MMMM d, yyyy h:mm a' }}" },
                { alias: 'orderStatusId', header: 'Order Status', align: 'right', template: '<span class="vendr-badge umb-badge umb-badge--xs vendr-bg--{{ orderStatus.color }} truncate" title="Order Status: {{ orderStatus.name }}">{{ orderStatus.name }}</span>' },
                { alias: 'paymentStatus', header: 'Payment Status', align: 'right', template: '<span class="vendr-badge umb-badge umb-badge--xs vendr-badge--{{ paymentStatus.toLowerCase() }} truncate">{{paymentStatusName}}</span>' },
                { alias: 'payment', header: 'Payment', align: 'right', template: '<span class="vendr-table-cell-value--multiline"><strong>{{transactionAmount}}</strong><span>{{paymentMethod.name}}</span></span>' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        var hasFilterRouteParams = false;

        vm.options.filters.forEach(fltr => {
            Object.defineProperty(fltr, "value", {
                get: function () {
                    return vendrLocalStorage.get(fltr.localStorageKey) || [];
                },
                set: function (value) {
                    vendrLocalStorage.set(fltr.localStorageKey, value);
                }
            });

            // Initially just check to see if any of the filter are in the route params
            // as if they are, we will reset filters accordingly in a moment, but we
            // need to know if any params exist as we'll wipe out anything that isn't
            // in the querystring
            if ($routeParams[fltr.alias])
                hasFilterRouteParams = true;
        });

        // If we have some filters in the querystring then
        // set the filter values by default, wiping out any
        // cached value they previously had
        if (hasFilterRouteParams) {
            vm.options.filters.forEach(fltr => {
                if ($routeParams[fltr.alias]) {
                    fltr.value = $routeParams[fltr.alias].split(",");
                    $location.search(fltr.alias, null);
                } else {
                    fltr.value = [];
                }
            });
        }

        vm.loadItems = function (opts, callback) {

            if (typeof opts === "function") {
                callback = opts;
                opts = undefined;
            }

            if (!opts) {
                opts = {
                    pageNumber: 1
                };
            }

            // Rename pageSize to itemsPerPage
            opts.itemsPerPage = opts.pageSize;

            // Apply filters
            vm.options.filters.forEach(fltr => {
                if (fltr.value && fltr.value.length > 0) {
                    opts[fltr.alias] = fltr.value;
                } else {
                    delete opts[fltr.alias];
                }
            });

            // Perform search
            vendrOrderResource.searchOrders(storeId, opts).then(function (entities) {
                entities.items.forEach(function (itm) {
                    itm.routePath = '/commerce/vendr/order-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) {
                    callback();
                }
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'Order' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",1", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                vm.loadItems({
                    pageNumber: 1
                }, function () {
                    vm.page.loading = false;
                });
            });

        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Order' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems({
                    pageNumber: 1
                }, function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.OrderListController', OrderListController);

}());
(function () {

    'use strict';

    function PaymentMethodCreateController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService,
        vendrUtils, vendrPaymentMethodResource) {

        var storeId = $scope.currentNode.metaData['storeId'];

        var vm = this;

        vm.options = {
            paymentProviderTypes: []
        };

        vm.init = function () {

            vendrPaymentMethodResource.getPaymentProviderDefinitions().then(function (data) {
                vm.options.paymentProviderTypes = data;
            });

        };

        vm.createNewOfType = function (type) {
            $location.path("/settings/vendrsettings/paymentmethod-edit/" + vendrUtils.createCompositeId([storeId, -1]))
                .search("type", type.alias);
            navigationService.hideMenu();
        };

        vm.selectPreset = function () {
            vm.options.selectPreset = true;
        };

        vm.close = function () {
            navigationService.hideDialog(true);
        };

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.PaymentMethodCreateController', PaymentMethodCreateController);

}());
(function () {

    'use strict';

    function PaymentMethodEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, treeService, navigationService, editorService,
        vendrUtils, vendrPaymentMethodResource, vendrCountryResource, vendrCurrencyResource, vendrTaxResource, vendrStoreResource, vendrActions) {

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
            taxClasses: [],
            currencies: [],
            countryRegions: [],
            paymentProviderScaffold: [],
            paymentProviderProperties: [],
            advancedPaymentProviderProperties: [],
            advancedPaymentProviderPropertiesShown: false,
            editorActions: []
        };
        vm.content = {
            defaultPrices: []
        };

        vm.back = function () {
            $location.path("/settings/vendrsettings/paymentmethod-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.toggleAdvancedPaymentProviderProperties = function () {
            vm.options.advancedPaymentProviderPropertiesShown = !vm.options.advancedPaymentProviderPropertiesShown;
        };

        vm.openCustomPricesDialog = function (countryRegion) {

            var isCountry = !countryRegion.countryId;
            var countryId = isCountry ? countryRegion.id : countryRegion.countryId;
            var regionId = isCountry ? null : countryRegion.id;

            var dialogConfig = {
                view: '/app_plugins/vendr/views/dialogs/custompricingedit.html',
                size: 'small',
                config: {
                    currencies: vm.options.currencies,
                    countryRegion: countryRegion,
                    countryId: countryId,
                    regionId: regionId,
                    name: countryRegion.name,
                    prices: vm.content.prices.filter(function (itm) {
                        return itm.countryId === countryId && itm.regionId === regionId;
                    })
                },
                submit: function (model) {

                    // Get all prices excluding ones for this country/region
                    var prices = vm.content.prices.filter(function (itm) {
                        return !(itm.countryId === countryId && itm.regionId === regionId);
                    });

                    // Add country region prices back in
                    if (model && model.length > 0) {
                        model.forEach(function (itm) {
                            itm.countryId = countryId;
                            itm.regionId = regionId;
                            prices.push(itm);
                        });
                    }

                    // Update the content model
                    vm.content.prices = prices;

                    // Close the dialog
                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            };

            editorService.open(dialogConfig);

        };

        vm.buildDefaultPrices = function () {

            var defaultPrices = [];

            vm.options.currencies.forEach(function (currency) {

                var defaultPrice = {
                    currencyCode: currency.code,
                    currencyId: currency.id
                };

                var findFunc = function (itm) {
                    return itm.currencyId === defaultPrice.currencyId
                        && (!itm.countryId || itm.countryId === null)
                        && (!itm.regionId || itm.regionId === null);
                };

                Object.defineProperty(defaultPrice, "value", {
                    get: function () {
                        if (!vm.content.prices) return '';
                        var itm = vm.content.prices.find(findFunc);
                        return itm ? itm.value : '';
                    },
                    set: function (value) {
                        if (!vm.content.prices)
                            vm.content.prices = [];
                        var idx = vm.content.prices.findIndex(findFunc);
                        if (value !== "" && !isNaN(value)) {
                            if (idx === -1) {
                                vm.content.prices.push({
                                    currencyId: defaultPrice.currencyId,
                                    countryId: null,
                                    regionId: null,
                                    value: value
                                });
                            } else {
                                vm.content.prices[idx].value = value;
                            }
                        } else {
                            if (idx !== -1) vm.content.prices.splice(idx, 1);
                        }
                    }
                });

                defaultPrices.push(defaultPrice);

            });

            vm.content.defaultPrices = defaultPrices;
        };

        vm.buildPaymentProviderSettingProperties = function (paymentMethod) {
            vendrPaymentMethodResource.getPaymentProviderScaffold(paymentMethod.paymentProviderAlias).then(function (scaffold) {
                vm.options.paymentProviderScaffold = scaffold;

                var allProperties = (scaffold.settingDefinitions || []).map(function (itm) {

                    var property = {
                        alias: itm.key,
                        label: itm.name,
                        description: itm.description,
                        config: itm.config,
                        view: itm.view,
                        isAdvanced: itm.isAdvanced
                    };

                    if (!itm.view || itm.view === 'dictionaryinput') {
                        property.view = '/app_plugins/vendr/views/propertyeditors/dictionaryinput/dictionaryinput.html';
                        property.config = {
                            containerKey: 'Vendr',
                            keyPrefix: "vendr_" + storeAlias.toLowerCase() + "_paymentmethod_" + (vm.content.alias || $scope.$id)
                        };
                    } else if (!itm.view || itm.view === 'dropdown') {
                        property.view = '/app_plugins/vendr/views/propertyeditors/dropdown/dropdown.html';
                    }

                    Object.defineProperty(property, "value", {
                        get: function () {
                            return vm.content.paymentProviderSettings[itm.key];
                        },
                        set: function (value) {
                            vm.content.paymentProviderSettings[itm.key] = value;                            
                        }
                    });

                    return property;
                });

                vm.options.paymentProviderProperties = allProperties.filter(function (itm) {
                    return !itm.isAdvanced;
                });

                vm.options.advancedPaymentProviderProperties = allProperties.filter(function (itm) {
                    return itm.isAdvanced;
                });
            });
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'PaymentMethod' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrStoreResource.getStoreAlias(storeId).then(function (alias) {
                storeAlias = alias;
            });

            vendrTaxResource.getTaxClasses(storeId).then(function (taxClasses) {
                vm.options.taxClasses = taxClasses;
            });

            vendrCurrencyResource.getCurrencies(storeId).then(function (currencies) {
                vm.options.currencies = currencies;
            });

            vendrCountryResource.getCountriesWithRegions(storeId).then(function (countries) {

                countries.forEach(function (country) {

                    var countryFindFn = function (itm) {
                        return itm.countryId === country.id && (!itm.regionId || itm.regionId === null);
                    };

                    Object.defineProperty(country, "checked", {
                        get: function () {
                            return vm.content.allowedCountryRegions
                                && vm.content.allowedCountryRegions.findIndex(countryFindFn) > -1;
                        },
                        set: function (value) {
                            if (!vm.content.allowedCountryRegions)
                                vm.content.allowedCountryRegions = [];
                            var idx = vm.content.allowedCountryRegions.findIndex(countryFindFn);
                            if (value) {
                                if (idx === -1) vm.content.allowedCountryRegions.push({
                                    countryId: country.id,
                                    regionId: null
                                });
                            } else {
                                if (idx !== -1) vm.content.allowedCountryRegions.splice(idx, 1);
                                if (country.regions && country.regions.length > 0) {
                                    country.regions.forEach(function (region) {
                                        region.checked = false;
                                    });
                                }
                            }
                        }
                    });

                    Object.defineProperty(country, "description", {
                        get: function () {
                            if (!country.checked) return '';
                            if (!vm.content.prices || vm.content.prices.length === 0) return '';
                            var prices = vm.content.prices.filter(countryFindFn).map(function (itm) {
                                var currency = vm.options.currencies.find(function (itm2) {
                                    return itm2.id === itm.currencyId;
                                });
                                return (currency ? currency.code : itm.currencyId) + " " + Number(itm.value).toFixed(2);
                            });
                            return prices.join(" | ");
                        }
                    });

                    if (country.regions && country.regions.length > 0) {

                        country.regions.forEach(function (region) {

                            var countryRegionFindFn = function (itm) {
                                return itm.countryId === region.countryId && itm.regionId === region.id;
                            };

                            Object.defineProperty(region, "checked", {
                                get: function () {
                                    return vm.content.allowedCountryRegions
                                        && vm.content.allowedCountryRegions.findIndex(countryRegionFindFn) > -1;
                                },
                                set: function (value) {
                                    if (!vm.content.allowedCountryRegions)
                                        vm.content.allowedCountryRegions = [];
                                    var idx = vm.content.allowedCountryRegions.findIndex(countryRegionFindFn);
                                    if (value) {
                                        if (idx === -1) vm.content.allowedCountryRegions.push({
                                            countryId: region.countryId,
                                            regionId: region.id
                                        });
                                    } else {
                                        if (idx !== -1) vm.content.allowedCountryRegions.splice(idx, 1);
                                    }
                                }
                            });

                            Object.defineProperty(region, "description", {
                                get: function () {
                                    if (!region.checked) return '';
                                    if (!vm.content.prices || vm.content.prices.length === 0) return '';
                                    var prices = vm.content.prices.filter(countryRegionFindFn).map(function (itm) {
                                        var currency = vm.options.currencies.find(function (itm2) {
                                            return itm2.id === itm.currencyId;
                                        });
                                        return (currency ? currency.code : itm.currencyId) + " " + Number(itm.value).toFixed(2);
                                    });
                                    return prices.join(" | ");
                                }
                            });

                        });

                    }

                });

                vm.options.countryRegions = countries;
            });

            if (create) {

                vendrPaymentMethodResource.createPaymentMethod(storeId, $routeParams.type).then(function (paymentMethod) {
                    vm.buildPaymentProviderSettingProperties(paymentMethod);
                    vm.ready(paymentMethod);
                });

            } else {

                vendrPaymentMethodResource.getPaymentMethod(id).then(function (paymentMethod) {
                    vm.buildPaymentProviderSettingProperties(paymentMethod);
                    vm.ready(paymentMethod);
                });

            }
        };

        vm.ready = function (model) {

            // Format values
            if (model.prices) {
                model.prices.forEach(function (itm) {
                    itm.value = itm.value || itm.value === 0 ? Number(itm.value).toFixed(2) : '';
                });
            }
            
            // Sync editor
            vm.page.loading = false;
            vm.content = model;
            editorState.set(vm.content);

            // Sync tree / breadcrumb
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

                vendrPaymentMethodResource.savePaymentMethod(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/paymentmethod-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save payment method " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        // We need to rebuild the default prices whenever the countries / content items change
        // so watch them and rebuild when this happens
        $scope.$watchGroup(['vm.content', 'vm.options.currencies'], function () {
            if (vm.content && vm.content.storeId && vm.options.currencies && vm.options.currencies.length > 0) {
                vm.buildDefaultPrices();
            }
        });

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'PaymentMethod' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.PaymentMethodEditController', PaymentMethodEditController);

}());
(function () {

    'use strict';

    function PaymentMethodListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrPaymentMethodResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'sku', header: 'SKU' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrPaymentMethodResource.getPaymentMethods(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/paymentmethod-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'PaymentMethod' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",4", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Payment Method',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });

        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'PaymentMethod' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.PaymentMethodListController', PaymentMethodListController);

}());
(function () {

    'use strict';

    function ElementTypePickerController($scope, editorService , elementTypeResource) {

        var vm = this;

        var dialogOptions = {
            view: '/app_plugins/vendr/views/dialogs/elementtypepicker.html',
            size: 'small',
            submit: function (model) {
                vm.model.value = model.id;
                vm.pickedItem = model;
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var vm = this;

        vm.model = $scope.model;
        vm.pickedItem = false;

        if (vm.model.value) {
            elementTypeResource.getAll().then(function (elementTypes) {
                var elementType = elementTypes.find(function (itm) {
                    return itm.key === vm.model.value;
                });
                if (elementType) {
                    vm.pickedItem = {
                        id: elementType.key,
                        name: elementType.name,
                        icon: elementType.icon
                    };
                }
            });
        }

        vm.openPicker = function () {
            editorService.open(dialogOptions);
        };

        vm.removeItem = function () {
            vm.model.value = null;
            vm.pickedItem = false;
        };

        vm.openItem = function () {

        };


    }

    angular.module('vendr').controller('Vendr.Controllers.ElementTypePickerController', ElementTypePickerController);

}());
(function () {

    'use strict';

    function StoreConfigController($scope) {

        var vm = this;

        vm.storePickerProperty = {
            alias: "storeId",
            view: '/app_plugins/vendr/views/propertyeditors/storepicker/storepicker.html'
        };

        Object.defineProperty(vm.storePickerProperty, "value", {
            get: () => vm.model.value.storeId,
            set: (value) => vm.model.value.storeId = value
        });

        vm.model = $scope.model;
        vm.model.value = vm.model.value || {
            storeMode: 'Search',
            storeId: undefined
        };

    }

    angular.module('vendr').controller('Vendr.Controllers.StoreConfigController', StoreConfigController);

}());
(function () {

    'use strict';

    function PrintTemplateEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrUtilsResource, vendrPrintTemplateResource, vendrStoreResource, vendrActions) {

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
                    return "vendr_" + storeAlias.toLowerCase() + "_printtemplate_" + (vm.content.alias || scope.$id).toLowerCase() + "_" + fldName.toLowerCase();
                }
            },
            editorActions: []
        };

        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/printtemplate-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'PrintTemplate' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrStoreResource.getStoreAlias(storeId).then(function (alias) {
                storeAlias = alias;
            });

            vendrUtilsResource.getEnumOptions("TemplateCategory").then(function (opts) {
                vm.options.templateCategories = opts;
            });

            if (create) {

                vendrPrintTemplateResource.createPrintTemplate(storeId).then(function (printTemplate) {
                    vm.ready(printTemplate);
                });

            } else {

                vendrPrintTemplateResource.getPrintTemplate(id).then(function (printTemplate) {
                    vm.ready(printTemplate);
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

                vendrPrintTemplateResource.savePrintTemplate(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/printtemplate-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save print template " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'PrintTemplate' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.PrintTemplateEditController', PrintTemplateEditController);

}());
(function () {

    'use strict';

    function PrintTemplateListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrPrintTemplateResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'category', header: 'Category' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrPrintTemplateResource.getPrintTemplates(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/printtemplate-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'PrintTemplate' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",10,12", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Print Template',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'PrintTemplate' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.PrintTemplateListController', PrintTemplateListController);

}());
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
            view: '/app_plugins/vendr/views/dialogs/productattributepicker.html',
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
(function () {

    'use strict';

    function ProductAttributePresetListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrProductAttributeResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'description', header: 'Description' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrProductAttributeResource.getProductAttributePresets(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/commerce/vendr/productattributepreset-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'ProductAttributePreset' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",10,12", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Product Attribute Preset',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'ProductAttributePreset' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.ProductAttributePresetListController', ProductAttributePresetListController);

}());
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
            view: '/app_plugins/vendr/views/dialogs/translatedvalueeditor.html',
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
(function () {

    'use strict';

    function ProductAttributeListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrProductAttributeResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'alias', header: 'Alias' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrProductAttributeResource.getProductAttributes(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/commerce/vendr/productattribute-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'ProductAttribute' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendr", path: "-1," + storeId + ",10,11", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Product Attribute',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'ProductAttribute' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.ProductAttributeListController', ProductAttributeListController);

}());
(function () {

    'use strict';

    function ConditionalInputController($scope, $timeout)
    {
        var vm = this;

        vm.property = {
            alias: $scope.model.alias + "_conitional",
            view: $scope.model.config.propertyView,
            config: $scope.model.config.propertyConfig
        };

        Object.defineProperty(vm.property, "value", {
            get: function () {
                return $scope.model.value;
            },
            set: function (value) {
                $scope.model.value = value;
                toggleProperties();
            }
        });

        function toggleProperties()
        {
            if ($scope.model.value in $scope.model.config.map) {
                doToggleProperties($scope.model.config.map[$scope.model.value]);
            }
            else if ("default" in $scope.model.config.map) {
                doToggleProperties($scope.model.config.map["default"]);
            }
        }

        function doToggleProperties(config) {

            var $inputEl = $("[data-element='property-" + $scope.model.alias + "']");
            var form = $inputEl.closest("form");

            var hiddenContainer = $(form).find("> .cih");
            if (hiddenContainer.length === 0) {
                $(form).append("<div class='cih' style='display: none;'></div>");
                hiddenContainer = $(form).find("> .cih");
            }

            config.show.forEach(function (toShow) {
                var $s = $("[data-element='property-" + toShow + "']");
                if ($s.closest(".cih").length > 0) {
                    $(form).find(".property-" + toShow + "-placeholder").after($s);
                    $(form).find(".property-" + toShow + "-placeholder").remove();
                }
            });

            config.hide.forEach(function (toHide) {
                var $s = $("[data-element='property-" + toHide + "']");
                if ($s.closest(".cih").length === 0) {
                    $s.after("<span class='property-" + toHide + "-placeholder'></span>");
                    hiddenContainer.append($s);
                }
            });

        }

        $timeout(function () {
            toggleProperties();
        }, 10);
        
    }

    angular.module('vendr').controller('Vendr.Controllers.ConditionalInputController', ConditionalInputController);

}());
(function () {

    'use strict';

    function DictionaryInputController($scope) {

        var vm = this;
        
        vm.model = $scope.model;
        
        vm.generateKey = function () {
            return ($scope.model.config.keyPrefix + "_" + $scope.model.alias).toLowerCase();
        };

    }

    angular.module('vendr').controller('Vendr.Controllers.DictionaryInputController', DictionaryInputController);

}());
(function () {

    'use strict';

    function PricesIncludeTaxController($scope, $routeParams, vendrStoreResource, vendrUtils, vendrRouteCache)
    {
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;

        var vm = this;

        vm.property = {
            alias: $scope.model.alias + "_wrapped",
            view: "boolean",
            config: $scope.model.config
        };

        Object.defineProperty(vm.property, "value", {
            get: function () {
                return $scope.model.value;
            },
            set: function (value) {
                $scope.model.value = value;
            }
        });

        if ($scope.model.value == null && storeId) {
            vendrRouteCache.getOrFetch("currentStore", () => vendrStoreResource.getBasicStore(storeId)).then(function (store) {
                vm.property.value = store.pricesIncludeTax;
            });
        }

    }

    angular.module('vendr').controller('Vendr.Controllers.PricesIncludeTaxController', PricesIncludeTaxController);

}());
(function () {

    'use strict';

    function PriceController($scope, $routeParams, vendrStoreResource,
        vendrCurrencyResource, vendrUtils, vendrRouteCache)
    {
        // Figure out if we are in a config area or in settings where we can
        // parse the store ID from the querystring
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;
        var currentOrParentNodeId = compositeId.length > 1 ? compositeId[1] : compositeId[0];

        var isDocTypeEditorPreview = $routeParams.section == "settings" && $routeParams.tree == "documentTypes";

        var vm = this;

        vm.model = $scope.model;

        vm.loading = true;
        vm.store = null;
        vm.prices = null;

        var initStore = function (store, value) {
            if (store) {
                vm.store = store;
                vendrRouteCache.getOrFetch("store_"+ store.id +"_currencies", function () {
                    return vendrCurrencyResource.getCurrencies(vm.store.id);
                })
                .then(function (currencies) {
                    var prices = [];
                    currencies.forEach(function (currency) {
                        prices.push({
                            currencyId: currency.id,
                            currencyCode: currency.code,
                            value: value && value[currency.id] ? value[currency.id] : ''
                        });
                    });
                    vm.prices = prices;
                    vm.loading = false;
                });
            } else {
                vm.store = null;
                vm.prices = null;
                vm.loading = false;
            }
        };

        var init = function (value) {

            if (!isDocTypeEditorPreview) {
                vendrRouteCache.getOrFetch("currentStore", function () {
                    if (!storeId) {
                        return vendrStoreResource.getBasicStoreByNodeId(currentOrParentNodeId);
                    } else {
                        return vendrStoreResource.getBasicStore(storeId);
                    }
                })
                .then(function (store) {
                    initStore(store, value);
                });
            } else {
                initStore(null, null);
            }

        };

        // Here we declare a special method which will be called whenever the value has changed from the server
        // this is instead of doing a watch on the model.value = faster
        $scope.model.onValueChanged = function (newVal, oldVal) {
            //console.log(newVal);
        };
        
        var unsubscribe = [
            $scope.$on("formSubmitting", function () {
                if (!vm.loading && vm.store && vm.prices) {

                    var value = {};

                    vm.prices.forEach(function (price) {
                        if (price.value !== "" && !isNaN(price.value)) {
                            value[price.currencyId] = price.value;
                        }
                    });

                    if (_.isEmpty(value))
                        value = undefined;

                    $scope.model.value = value;
                }
            }),
            $scope.$on("formSubmitted", function () {
                init($scope.model.value);
            })
        ];

        // When the element is disposed we need to unsubscribe!
        // NOTE: this is very important otherwise if this is part of a modal, the listener still exists because the dom
        // element might still be there even after the modal has been hidden.
        $scope.$on('$destroy', function () {
            unsubscribe.forEach(function (u) {
                u();
            });
        });

        init($scope.model.value);
    }

    angular.module('vendr').controller('Vendr.Controllers.PriceController', PriceController);

}());
(function () {

    'use strict';

    function StockController($scope, $routeParams, $timeout, editorState, editorService, angularHelper, vendrProductResource)
    {
        var currentNode = editorState.getCurrent();
        var productReference = currentNode.id > 0 ? currentNode.key : undefined;
        var productVariantReference = undefined;

        var isDocTypeEditorPreview = $routeParams.section == "settings" && $routeParams.tree == "documentTypes";

        var vm = this;
        vm.model = $scope.model;

        var vendrVariantEditor = editorService.getEditors().find(e => e.vendrVariantEditor);
        if (vendrVariantEditor) {
            productVariantReference = vendrVariantEditor.content.key;
        }

        // As multi variants can be loaded / unloaded within
        // the same editing session, we have to check whether
        // a stock level has been set previously that hasn't
        // yet been persisted by saving the parent node. If this
        // is the case then use this unpersisted value.
        var hasUnpersistedValue = productVariantReference
            && vm.model.value
            && vm.model.value != -1
            && vm.model.value != "-1";

        // We don't use any stored stock value as we fetch it from
        // the product service every time. 
        // So we store a stock value in a seperate varaiable and 
        // only submit it's value if it changes.
        // We also set the stored model value to -1 initially 
        // to ensure it's only handled in the backend
        // if it's value is different.
        vm.model.value = hasUnpersistedValue ? vm.model.value : -1;
        vm.stockLevel = hasUnpersistedValue ? vm.model.value : 0;
        vm.syncStockLevel = function () {
            if (!vm.loading) {
                vm.model.value = vm.stockLevel;
            }
        };

        vm.loading = true;
        
        var init = function () {
            if (productReference && !isDocTypeEditorPreview && !hasUnpersistedValue) {
                vendrProductResource.getStock(productReference, productVariantReference).then(function (stock) {
                    vm.stockLevel = stock || 0;
                    vm.loading = false;
                });
            } else {
                vm.loading = false;
            }
        };

        init();
    }

    angular.module('vendr').controller('Vendr.Controllers.StockController', StockController);

}());
(function () {

    'use strict';

    function StoreEntityPickerController($scope, $routeParams, editorService,
        vendrStoreResource, vendrEntityResource, vendrUtils, vendrRouteCache)
    {
        // Figure out if we are in a config area or in settings where we can
        // parse the store ID from the querystring
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;
        var currentOrParentNodeId = compositeId.length > 1 ? compositeId[1] : compositeId[0];
        var entityType = $scope.model.config.entityType;
        var storeConfig = $scope.model.config.storeConfig || { storeMode: 'Search' };

        if (storeConfig.storeMode === 'All')
            storeId = -1;

        if (storeConfig.storeMode === 'Explicit')
            storeId = storeConfig.storeId;

        var dialogOptions = {
            view: '/app_plugins/vendr/views/dialogs/storeentitypicker.html',
            size: 'small',
            config: {
                storeId: -1,
                entityType: entityType
            },
            submit: function (model) {
                if (model.store) {
                    vm.store = model.store;
                }
                vm.model.value = model.id;
                vm.pickedItem = model;
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var vm = this;

        vm.model = $scope.model;
        vm.pickedItem = false;
        vm.loading = true;
        vm.store = null;
        vm.showStoreInName = storeConfig.storeMode === 'All';

        vm.openPicker = function () {
            editorService.open(dialogOptions);
        };

        vm.removeItem = function () {
            vm.model.value = null;
            vm.pickedItem = false;
        };

        vm.openItem = function () {

        };

        var initStore = function (store, value) {
            vm.store = store;
            if (store && storeConfig.storeMode !== 'All') {
                dialogOptions.config.storeId = store.id;
            }
            if (value) {
                vendrEntityResource.getEntity(entityType, value).then(function (entity) {
                    vm.pickedItem = entity;
                    vm.loading = false;
                });
            } else {
                vm.loading = false;
            }
        };

        var init = function (value) {

            if (!storeId) {
                // Search for Store ID
                vendrStoreResource.getBasicStoreByNodeId(currentOrParentNodeId).then(function (store) {
                    initStore(store, value);
                });
            } else if (storeId !== -1) {
                // Explicit store
                vendrStoreResource.getBasicStore(storeId).then(function (store) {
                    initStore(store, value);
                });
            } else if (value) {
                vendrEntityResource.getStoreByEntityId(entityType, value).then(function (store) {
                    initStore(store, value);
                });
            } else {
                // All store
                initStore({ id: -1 }, value);
            }

        };

        var unsubscribe = [
            $scope.$on("formSubmitted", function () {
                init($scope.model.value);
            })
        ];

        // When the element is disposed we need to unsubscribe!
        // NOTE: this is very important otherwise if this is part of a modal, the listener still exists because the dom
        // element might still be there even after the modal has been hidden.
        $scope.$on('$destroy', function () {
            unsubscribe.forEach(function (u) {
                u();
            });
        });

        init(vm.model.value);
    }

    angular.module('vendr').controller('Vendr.Controllers.StoreEntityPickerController', StoreEntityPickerController);

}());
(function () {

    'use strict';

    function StorePickerController($scope, editorService,
        vendrStoreResource)
    {
        var dialogOptions = {
            view: '/app_plugins/vendr/views/dialogs/storepicker.html',
            size: 'small',
            submit: function (model) {
                vm.model.value = model.id;
                vm.pickedItem = model;
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var vm = this;
        
        vm.model = $scope.model;
        vm.pickedItem = false;

        if (vm.model.value) {
            vendrStoreResource.getBasicStore(vm.model.value).then(function (store) {
                vm.pickedItem = store;
            });
        }

        vm.openPicker = function () {
            editorService.open(dialogOptions);
        };

        vm.removeItem = function () {
            vm.model.value = null;
            vm.pickedItem = false;
        };

        vm.openItem = function () {
            
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.StorePickerController', StorePickerController);

}());
(function () {

    'use strict';

    function TaxClassPickerController($scope, $routeParams, editorService,
        vendrStoreResource, vendrTaxResource, vendrUtils)
    {
        // Figure out if we are in a config area or in settings where we can
        // parse the store ID from the querystring
        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId.length > 1 ? compositeId[0] : null;
        var currentOrParentNodeId = compositeId.length > 1 ? compositeId[1] : compositeId[0];

        var dialogOptions = {
            view: '/app_plugins/vendr/views/dialogs/taxclasspicker.html',
            size: 'small',
            config: {
                storeId: -1
            },
            submit: function (model) {
                vm.model.value = model.id;
                vm.pickedItem = model;
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var vm = this;

        vm.model = $scope.model;
        vm.pickedItem = false;
        vm.loading = true;
        vm.store = null;

        vm.openPicker = function () {
            editorService.open(dialogOptions);
        };

        vm.removeItem = function () {
            vm.model.value = null;
            vm.pickedItem = false;
        };

        vm.openItem = function () {

        };

        var initStore = function (store, value) {
            vm.store = store;
            dialogOptions.config.storeId = store.id;
            if (value) {
                vendrTaxResource.getTaxClass(value).then(function (entity) {
                    vm.pickedItem = entity;
                    vm.loading = false;
                });
            } else {
                vm.loading = false;
            }
        };

        var init = function (value) {

            if (!storeId) {
                vendrStoreResource.getBasicStoreByNodeId(currentOrParentNodeId).then(function (store) {
                    initStore(store, value);
                });
            } else {
                vendrStoreResource.getBasicStore(storeId).then(function (store) {
                    initStore(store, value);
                });
            }

        };

        init(vm.model.value);
    }

    angular.module('vendr').controller('Vendr.Controllers.TaxClassPickerController', TaxClassPickerController);

}());
(function () {

    'use strict';

    function UmbracoMemberGroupsPickerController($scope, editorService, memberGroupResource) 
    {
        $scope.pickGroup = function() {
            editorService.memberGroupPicker({
                multiPicker: true,
                submit: function (model) {
                    var selectedGroupIds = _.map(model.selectedMemberGroups
                        ? model.selectedMemberGroups
                        : [model.selectedMemberGroup],
                        function(id) { return parseInt(id) }
                    );
                    memberGroupResource.getByIds(selectedGroupIds).then(function (selectedGroups) {
                        $scope.model.value = $scope.model.value || [];
                        _.each(selectedGroups, function(group) {
                            var foundIndex = $scope.model.value.findIndex(function (itm) {
                                return itm == group.name;
                            });
                            if (foundIndex == -1){
                                $scope.model.value.push(group.name);
                            }
                        });
                    });
                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            });
        }

        $scope.removeGroup = function (group) {
            var foundIndex = $scope.model.value.findIndex(function (itm) {
                return itm == group;
            });
            if (foundIndex > -1){
                $scope.model.value.splice(foundIndex, 1);
            }
        }
    }

    angular.module('vendr').controller('Vendr.Controllers.UmbracoMemberGroupsPickerController', UmbracoMemberGroupsPickerController);

}());
(function () {

    'use strict';

    function VariantsEditorController($scope, $routeParams, $element, angularHelper, eventsService, vendrVariantsEditorState)
    {
        var vm = this;

        var isDocTypeEditorPreview = $routeParams.section == "settings" && $routeParams.tree == "documentTypes";

        var init = function () {

            // Ensure model has a baseline value
            if (typeof vm.model.value !== 'object' || vm.model.value === null) {
                vm.model.value = {};
            }

            // Ensure we have an umbVariantContent
            if (vm.umbProperty && !vm.umbVariantContent)
            {
                // not found, then fallback to searching the scope chain, this may be needed when DOM inheritance isn't maintained but scope
                // inheritance is (i.e.infinite editing)
                var found = angularHelper.traverseScopeChain($scope, s => s && s.vm && s.vm.constructor.name === "umbVariantContentController");
                vm.umbVariantContent = found ? found.vm : null;
                if (!vm.umbVariantContent) {
                    throw "Could not find umbVariantContent in the $scope chain";
                }
            }

            // If the prop editor value changes on the server, we'll need to raise an event
            // so our content app can be notified
            vm.model.onValueChanged = function (newVal) {

                // We need to ensure that the property model value is an object, this is needed for modelObject to recive a reference and keep that updated.
                if (typeof newVal !== 'object' || newVal === null) {
                    vm.model.value = newVal = {};
                }

                eventsService.emit("variantsEditor.modelValueChanged", { value: newVal });

            }

            // For some reason the block list API needs to know the scope of existance
            // so we work this out now to pass to the variants editor state object
            var scopeOfExistence = $scope;
            if (vm.umbVariantContentEditors && vm.umbVariantContentEditors.getScope) {
                scopeOfExistence = vm.umbVariantContentEditors.getScope();
            } else if (vm.umbElementEditorContent && vm.umbElementEditorContent.getScope) {
                scopeOfExistence = vm.umbElementEditorContent.getScope();
            }

            // We don't actually do anything in the property editor itself,
            // instead we register the current model with the variants editor
            // state service such that the variants content app can gain access
            // to it, then we leave it to the content app to do everything.
            vendrVariantsEditorState.set({
                model: vm.model,
                propertyForm: vm.propertyForm,
                umbProperty: vm.umbProperty,
                umbVariantContent: vm.umbVariantContent,
                umbVariantContentEditors: vm.umbVariantContentEditors,
                umbElementEditorContent: vm.umbElementEditorContent,
                scope: $scope,
                scopeOfExistence: scopeOfExistence,
            });

        };

        vm.$onInit = function () {
            if (!isDocTypeEditorPreview) {
                init();
            }
        }

        $scope.$on("$destroy", function () {
            vendrVariantsEditorState.reset();
        });
    }

    angular
        .module("vendr")
        .component("vendrVariantsEditor", {
            template: "<div></div>",
            controller: VariantsEditorController,
            controllerAs: "vm",
            bindings: {
                model: "="
            },
            require: {
                propertyForm: "^form",
                umbProperty: "?^umbProperty",
                umbVariantContent: '?^^umbVariantContent',
                umbVariantContentEditors: '?^^umbVariantContentEditors',
                umbElementEditorContent: '?^^umbElementEditorContent'
            }
        });

    // angular.module('vendr').controller('Vendr.Controllers.VariantsEditorController', VariantsEditorController);

}());
(function () {

    'use strict';

    function RegionEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, treeService,
        vendrUtils, vendrCountryResource, vendrShippingMethodResource, vendrPaymentMethodResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var countryId = compositeId[1];
        var id = compositeId[2];
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
            isCreate: create,
            shippingMethods: [],
            paymentMethods: [],
            editorActions: []
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/country-edit/" + vendrUtils.createCompositeId([storeId, countryId]))
                .search("view", "regions");
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Region' }).then(result => {
                vm.options.editorActions = result;
            });
            
            vendrShippingMethodResource.getShippingMethods(storeId).then(function (shippingMethods) {
                if (create)
                    shippingMethods.splice(0, 0, { name: 'Inherit', id: '' });
                vm.options.shippingMethods = shippingMethods;
            });

            vendrPaymentMethodResource.getPaymentMethods(storeId).then(function (paymentMethods) {
                if (create)
                    paymentMethods.splice(0, 0, { name: 'Inherit', id: '' });
                vm.options.paymentMethods = paymentMethods;
            });

            if (create) {

                vendrCountryResource.createRegion(storeId, countryId).then(function (model) {
                    vm.ready(model);
                });

            } else {

                vendrCountryResource.getRegion(id).then(function (model) {
                    vm.ready(model);
                });

            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            // sync state
            editorState.set(vm.content);

            // The country regions are edited within the country editor so it means we have to go
            // a few level back to sync, and then navigate back to get the decendants to get
            // the actual menu node to sync to. This is all pretty nasty though and we should 
            // probably look for an alternative option (maybe a custom API controller)
            var pathToSync = create ? vm.content.path.slice(0, -1) : vm.content.path.slice(0, -2);
            navigationService.syncTree({ tree: "vendrsettings", path: pathToSync, forceReload: true }).then(function (syncArgs) {
                treeService.getChildren({ node: syncArgs.node }).then(function (nodes) {
                    var countryNode = nodes.find(function (itm) {
                        return itm.id === countryId;
                    });
                    if (!create) {
                        treeService.getChildren({ node: countryNode }).then(function (nodes2) {
                            var node = nodes2.find(function (itm) {
                                return itm.id === id;
                            });
                            vm.page.menu.currentNode = node;
                            vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(node);
                        });
                    } else {
                        vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(countryNode);
                        vm.page.breadcrumb.items.push({ name: 'Untitled' });
                    }
                });
            });
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrCountryResource.saveRegion(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/region-edit/" + vendrUtils.createCompositeId([storeId, countryId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save region " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'Region' && args.storeId === storeId && args.parentId === countryId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.RegionEditController', RegionEditController);

}());
(function () {

    'use strict';

    // NB: The country region list is different to other lists as this
    // list is shown as a content app within the country editor and thus
    // a lot of chrome already exists within that view

    function RegionListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrCountryResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
        var countryId = compositeId[1];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'code', header: 'Code' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath).search({});
            }
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'Region' }).then(result => {
                vm.options.bulkActions = result;
            });

            if ($scope.model.page.menu.currentNode) {
                vm.initFromNode($scope.model.page.menu.currentNode);
            } else {
                var destroyWatcher = $scope.$watch("model.page.menu.currentNode", function (newValue) {
                    if (newValue) {
                        vm.initFromNode(newValue);
                        destroyWatcher();
                    }
                });
            }

        };

        vm.loadItems = function (callback) {
            vendrCountryResource.getRegions(storeId, countryId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/region-edit/' + vendrUtils.createCompositeId([storeId, countryId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.initFromNode = function () {

            treeService.getMenu({ treeNode: $scope.model.page.menu.currentNode }).then(function (menu) {

                var currentSection = appState.getSectionState("currentSection");
                var currentNode = $scope.model.page.menu.currentNode;

                var createMenuAction = menu.menuItems.find(function (itm) {
                    return itm.alias === 'create';
                });

                if (createMenuAction) {
                    vm.options.createActions.push({
                        name: 'Create Region',
                        doAction: function () {
                            appState.setMenuState("currentNode", currentNode);
                            navigationService.executeMenuAction(createMenuAction,
                                currentNode,
                                currentSection);
                        }
                    });
                }

                vm.loadItems(function () {
                    vm.page.loading = false;
                });

            });

        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'Region' && args.storeId === storeId && args.parentId === countryId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.RegionListController', RegionListController);

}());
(function () {

    'use strict';

    function SettingsViewController($scope, $rootScope, $routeParams, navigationService, vendrUtils, vendrLicensingResource, vendrRouteCache)
    {
        $scope.vendrInfo = vendrUtils.getSettings("vendrInfo");

        vendrRouteCache.getOrFetch("vendrLicensingInfo",
            () => vendrLicensingResource.getLicensingInfo()).then(function (data) {
            $scope.licensingInfo = data;
        });

        navigationService.syncTree({ tree: "vendrsettings", path: ["-1"], forceReload: false, activate: true });

    };

    angular.module('vendr').controller('Vendr.Controllers.SettingsViewController', SettingsViewController);

}());
(function () {

    'use strict';

    function ShippingMethodEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, treeService, navigationService, editorService,
        vendrUtils, vendrShippingMethodResource, vendrCountryResource, vendrCurrencyResource, vendrTaxResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
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
            taxClasses: [],
            currencies: [],
            countryRegions: [],
            editorActions: []
        };
        vm.content = {
            defaultPrices: []
        };

        vm.back = function () {
            $location.path("/settings/vendrsettings/shippingmethod-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.openCustomPricesDialog = function (countryRegion) {

            var isCountry = !countryRegion.countryId;
            var countryId = isCountry ? countryRegion.id : countryRegion.countryId;
            var regionId = isCountry ? null : countryRegion.id;

            var dialogConfig = {
                view: '/app_plugins/vendr/views/dialogs/custompricingedit.html',
                size: 'small',
                config: {
                    currencies: vm.options.currencies,
                    countryRegion: countryRegion,
                    countryId: countryId,
                    regionId: regionId,
                    name: countryRegion.name,
                    prices: vm.content.prices.filter(function (itm) {
                        return itm.countryId === countryId && itm.regionId === regionId;
                    })
                },
                submit: function (model) {

                    // Get all prices excluding ones for this country/region
                    var prices = vm.content.prices.filter(function (itm) {
                        return !(itm.countryId === countryId && itm.regionId === regionId);
                    });

                    // Add country region prices back in
                    if (model && model.length > 0) {
                        model.forEach(function (itm) {
                            itm.countryId = countryId;
                            itm.regionId = regionId;
                            prices.push(itm);
                        });
                    }

                    // Update the content model
                    vm.content.prices = prices;

                    // Close the dialog
                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            };

            editorService.open(dialogConfig);

        };

        vm.buildDefaultPrices = function () {

            var defaultPrices = [];

            vm.options.currencies.forEach(function (currency) {

                var defaultPrice = {
                    currencyCode: currency.code,
                    currencyId: currency.id
                };

                var findFun = function (itm) {
                    return itm.currencyId === defaultPrice.currencyId
                        && (!itm.countryId || itm.countryId === null)
                        && (!itm.regionId || itm.regionId === null);
                };

                Object.defineProperty(defaultPrice, "value", {
                    get: function () {
                        if (!vm.content.prices) return '';
                        var itm = vm.content.prices.find(findFun);
                        return itm ? itm.value : '';
                    },
                    set: function (value) {
                        if (!vm.content.prices)
                            vm.content.prices = [];
                        var idx = vm.content.prices.findIndex(findFun);
                        if (value !== "" && !isNaN(value)) {
                            if (idx === -1) {
                                vm.content.prices.push({
                                    currencyId: defaultPrice.currencyId,
                                    countryId: null,
                                    regionId: null,
                                    value: value
                                });
                            } else {
                                vm.content.prices[idx].value = value;
                            }
                        } else {
                            if (idx !== -1) vm.content.prices.splice(idx, 1);
                        }
                    }
                });

                defaultPrices.push(defaultPrice);

            });

            vm.content.defaultPrices = defaultPrices;
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'ShippingMethod' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrTaxResource.getTaxClasses(storeId).then(function (taxClasses) {
                vm.options.taxClasses = taxClasses;
            });

            vendrCurrencyResource.getCurrencies(storeId).then(function (currencies) {
                vm.options.currencies = currencies;
            });

            vendrCountryResource.getCountriesWithRegions(storeId).then(function (countries) {

                countries.forEach(function (country) {

                    var countryFindFn = function (itm) {
                        return itm.countryId === country.id && (!itm.regionId || itm.regionId === null);
                    };

                    Object.defineProperty(country, "checked", {
                        get: function () {
                            return vm.content.allowedCountryRegions
                                && vm.content.allowedCountryRegions.findIndex(countryFindFn) > -1;
                        },
                        set: function (value) {
                            if (!vm.content.allowedCountryRegions)
                                vm.content.allowedCountryRegions = [];
                            var idx = vm.content.allowedCountryRegions.findIndex(countryFindFn);
                            if (value) {
                                if (idx === -1) vm.content.allowedCountryRegions.push({
                                    countryId: country.id,
                                    regionId: null
                                });
                            } else {
                                if (idx !== -1) vm.content.allowedCountryRegions.splice(idx, 1);
                                if (country.regions && country.regions.length > 0) {
                                    country.regions.forEach(function (region) {
                                        region.checked = false;
                                    });
                                }
                            }
                        }
                    });

                    Object.defineProperty(country, "description", {
                        get: function () {
                            if (!country.checked) return '';
                            if (!vm.content.prices || vm.content.prices.length === 0) return '';
                            var prices = vm.content.prices.filter(countryFindFn).map(function (itm) {
                                var currency = vm.options.currencies.find(function (itm2) {
                                    return itm2.id === itm.currencyId;
                                });
                                return (currency ? currency.code : itm.currencyId) + " " + Number(itm.value).toFixed(2);
                            });
                            return prices.join(" | ");
                        }
                    });

                    if (country.regions && country.regions.length > 0) {

                        country.regions.forEach(function (region) {

                            var countryRegionFindFn = function (itm) {
                                return itm.countryId === region.countryId && itm.regionId === region.id;
                            };

                            Object.defineProperty(region, "checked", {
                                get: function () {
                                    return vm.content.allowedCountryRegions
                                        && vm.content.allowedCountryRegions.findIndex(countryRegionFindFn) > -1;
                                },
                                set: function (value) {
                                    if (!vm.content.allowedCountryRegions)
                                        vm.content.allowedCountryRegions = [];
                                    var idx = vm.content.allowedCountryRegions.findIndex(countryRegionFindFn);
                                    if (value) {
                                        if (idx === -1) vm.content.allowedCountryRegions.push({
                                            countryId: region.countryId,
                                            regionId: region.id
                                        });
                                    } else {
                                        if (idx !== -1) vm.content.allowedCountryRegions.splice(idx, 1);
                                    }
                                }
                            });

                            Object.defineProperty(region, "description", {
                                get: function () {
                                    if (!region.checked) return '';
                                    if (!vm.content.prices || vm.content.prices.length === 0) return '';
                                    var prices = vm.content.prices.filter(countryRegionFindFn).map(function (itm) {
                                        var currency = vm.options.currencies.find(function (itm2) {
                                            return itm2.id === itm.currencyId;
                                        });
                                        return (currency ? currency.code : itm.currencyId) + " " + Number(itm.value).toFixed(2);
                                    });
                                    return prices.join(" | ");
                                }
                            });

                        });

                    }

                });

                vm.options.countryRegions = countries;
            });

            if (create) {

                vendrShippingMethodResource.createShippingMethod(storeId).then(function (shippingMethod) {
                    vm.ready(shippingMethod);
                });

            } else {

                vendrShippingMethodResource.getShippingMethod(id).then(function (shippingMethod) {
                    vm.ready(shippingMethod);
                });

            }
        };

        vm.ready = function (model) {

            // Format values
            if (model.prices) {
                model.prices.forEach(function (itm) {
                    itm.value = itm.value || itm.value === 0 ? Number(itm.value).toFixed(2) : '';
                });
            }

            // Sync editor
            vm.page.loading = false;
            vm.content = model;
            editorState.set(vm.content);

            // Sync tree / breadcrumb
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

                vendrShippingMethodResource.saveShippingMethod(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/shippingmethod-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save shipping method " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        // We need to rebuild the default prices whenever the countries / content items change
        // so watch them and rebuild when this happens
        $scope.$watchGroup(['vm.content', 'vm.options.currencies'], function () {
            if (vm.content && vm.content.storeId && vm.options.currencies && vm.options.currencies.length > 0) {
                vm.buildDefaultPrices();
            }
        });

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'ShippingMethod' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.ShippingMethodEditController', ShippingMethodEditController);

}());
(function () {

    'use strict';

    function ShippingMethodListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrShippingMethodResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'sku', header: 'SKU' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrShippingMethodResource.getShippingMethods(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.routePath = '/settings/vendrsettings/shippingmethod-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'ShippingMethod' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",3", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Shipping Method',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'ShippingMethod' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.ShippingMethodListController', ShippingMethodListController);

}());
(function () {

    'use strict';

    function StoreEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, navigationService, userGroupsResource, usersResource,
        vendrStoreResource, vendrCurrencyResource, vendrCountryResource, vendrTaxResource,
        vendrOrderStatusResource, vendrEmailTemplateResource,
        vendrLicensingResource, vendrRouteCache, vendrActions) {

        var id = $routeParams.id;
        var create = id === '-1';

        var vm = this;

        vm.page = { };
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.navigation = [
            {
                'name': 'Settings',
                'alias': 'settings',
                'icon': 'icon-settings',
                'view': '/app_plugins/vendr/views/store/subviews/settings.html',
                'active': true
            },
            {
                'name': 'Permissions',
                'alias': 'permissions',
                'icon': 'icon-lock',
                'view': '/app_plugins/vendr/views/store/subviews/permissions.html'
            }
        ];

        vm.options = {
            currencies: [],
            countries: [],
            taxClasses: [],
            orderStatuses: [],
            emailTemplates: [],
            giftCardActivationMethods: [
                { key: 'Manual', value: 'Manual' },
                { key: 'Automatic', value: 'Automatic' },
                { key: 'OrderStatus', value: 'Order Status' }
            ],
            userRoles: [],
            users: [],
            editorActions: []
        };

        vm.content = {};

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: id, entityType: 'Store' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrRouteCache.getOrFetch("vendrLicensingInfo",
                () => vendrLicensingResource.getLicensingInfo()).then(function (data) {
                    vm.licensingInfo = data;
                });

            userGroupsResource.getUserGroups().then(function (userGroups) {
                vm.options.userRoles = userGroups.map(function (itm) {

                    var userRole = {
                        alias: itm.alias,
                        name: itm.name
                    };

                    Object.defineProperty(userRole, "checked", {
                        get: function () {
                            return vm.content.allowedUserRoles
                                && vm.content.allowedUserRoles.indexOf(userRole.alias) > -1;
                        },
                        set: function (value) {
                            if (!vm.content.allowedUserRoles)
                                vm.content.allowedUserRoles = [];
                            var idx = vm.content.allowedUserRoles.indexOf(userRole.alias);
                            if (value) {
                                if (idx === -1) vm.content.allowedUserRoles.push(userRole.alias);
                            } else {
                                if (idx !== -1) vm.content.allowedUserRoles.splice(idx, 1);
                            }
                        }
                    });

                    return userRole;
                });
            });

            usersResource.getPagedResults({ pageSize: 1000 }).then(function (pagedUsers) {
                vm.options.users = pagedUsers.items.map(function (itm) {

                    var user = {
                        id: itm.id.toString(), // Umbraco members don't really have a key
                        name: itm.name
                    };

                    Object.defineProperty(user, "checked", {
                        get: function () {
                            return vm.content.allowedUsers
                                && vm.content.allowedUsers.indexOf(user.id) > -1;
                        },
                        set: function (value) {
                            if (!vm.content.allowedUsers)
                                vm.content.allowedUsers = [];
                            var idx = vm.content.allowedUsers.indexOf(user.id);
                            if (value) {
                                if (idx === -1) vm.content.allowedUsers.push(user.id);
                            } else {
                                if (idx !== -1) vm.content.allowedUsers.splice(idx, 1);
                            }
                        }
                    });

                    return user;
                });
            });

            if (create) {

                vendrStoreResource.createStore().then(function (store) {
                    vm.ready(store);
                });

            } else {

                vendrCurrencyResource.getCurrencies(id).then(function (currencies) {
                    vm.options.currencies = currencies;
                });

                vendrCountryResource.getCountries(id).then(function (countries) {
                    vm.options.countries = countries;
                });

                vendrTaxResource.getTaxClasses(id).then(function (taxClasses) {
                    vm.options.taxClasses = taxClasses;
                });

                vendrOrderStatusResource.getOrderStatuses(id).then(function (orderStatuses) {
                    vm.options.orderStatuses = orderStatuses;
                });

                vendrEmailTemplateResource.getEmailTemplates(id).then(function (emailTemplates) {
                    vm.options.emailTemplates = emailTemplates;
                });

                vendrStoreResource.getStore(id).then(function (store) {
                    vm.ready(store);
                });

            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            if (!vm.content.orderEditorConfig || vm.content.orderEditorConfig === "")
                vm.content.orderEditorConfig = "/app_plugins/vendr/config/order.editor.config.js";

            // sync state
            editorState.set(vm.content);

            if (!create) {
                navigationService.syncTree({ tree: "vendrsettings", path: vm.content.path, forceReload: true }).then(function (syncArgs) {
                    vm.page.menu.currentNode = syncArgs.node;
                });
            }
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrStoreResource.saveStore(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";
                    
                    if (create) {
                        $location.path("/settings/vendrsettings/store-edit/" + saved.id);
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save store " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.StoreEditController', StoreEditController);

}());
(function () {

    'use strict';

    function StoreViewController($scope, $routeParams, $location,
        vendrStoreResource, navigationService, vendrActivityLogResource,
        vendrLicensingResource, vendrRouteCache) {

        var id = $routeParams.id;

        var vm = this;

        vm.loading = true;
        vm.stats = undefined;
        vm.actions = [];

        vm.activityLogLoading = true;
        vm.activityLogs = {
            items: [],
            pageNumber: 1,
            pageSize: 10
        };

        vm.loadActivityLog = function (page) {
            vm.activityLogLoading = true;
            vendrActivityLogResource.getActivityLogs(id, page, vm.activityLogs.pageSize).then(function (activityLogs) {
                vm.activityLogs = activityLogs;
                vm.activityLogLoading = false;
            });
        }

        vm.refresh = function () {
            vm.loading = true;
            vm.init(true);
        }

        vm.init = function (noSync) {

            vendrRouteCache.getOrFetch("vendrLicensingInfo",
                () => vendrLicensingResource.getLicensingInfo()).then(function (data) {
                    vm.licensingInfo = data;
                });

            if (!noSync) {
                navigationService.syncTree({ tree: "vendr", path: "-1," + id, forceReload: true });
            }

            vendrStoreResource.getStore(id).then(function (store) {
                vm.store = store;
                vendrStoreResource.getStoreStatsForToday(id).then(function (stats) {
                    vm.stats = stats;
                    vendrStoreResource.getStoreActionsForToday(id).then(function (actions) {
                        vm.actions = actions;
                        vm.loading = false;
                    })
                })
            });

            vm.loadActivityLog(1);

        };  

        vm.init();

    };

    angular.module('vendr').controller('Vendr.Controllers.StoreViewController', StoreViewController);

}());
(function () {

    'use strict';

    function TaxClassEditController($scope, $routeParams, $location, formHelper,
        appState, editorState, localizationService, notificationsService, treeService, navigationService,
        vendrUtils, vendrTaxResource, vendrCountryResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];
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
            countryRegions: [],
            editorActions: []
        };
        vm.content = {};

        vm.back = function () {
            $location.path("/settings/vendrsettings/taxclass-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'TaxClass' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrCountryResource.getCountriesWithRegions(storeId).then(function (countries) {
                countries.forEach(function (country) {

                    Object.defineProperty(country, "taxRate", {
                        get: function () {
                            if (!vm.content.countryRegionTaxRates)
                                return "";

                            var idx = vm.content.countryRegionTaxRates.findIndex(function (itm) {
                                return itm.countryId === country.id && !itm.regionId;
                            });

                            return idx > -1 ? vm.content.countryRegionTaxRates[idx].taxRate : "";
                        },
                        set: function (value) {
                            if (!vm.content.countryRegionTaxRates)
                                vm.content.countryRegionTaxRates = [];

                            var idx = vm.content.countryRegionTaxRates.findIndex(function (itm) {
                                return itm.countryId === country.id && !itm.regionId;
                            });

                            if (idx > -1) {
                                if (value) {
                                    vm.content.countryRegionTaxRates[idx].taxRate = value;
                                } else {
                                    vm.content.countryRegionTaxRates.splice(idx, 1);
                                }
                            } else {
                                vm.content.countryRegionTaxRates.push({ countryId: country.id, regionId: null, taxRate: value });
                            }
                        }
                    });

                    country.regions = country.regions || [];
                    country.regions.forEach(function (region) {

                        Object.defineProperty(region, "taxRate", {
                            get: function () {
                                if (!vm.content.countryRegionTaxRates)
                                    return "";

                                var idx = vm.content.countryRegionTaxRates.findIndex(function (itm) {
                                    return itm.countryId === country.id && itm.regionId === region.id;
                                });

                                return idx > -1 ? vm.content.countryRegionTaxRates[idx].taxRate : "";
                            },
                            set: function (value) {
                                if (!vm.content.countryRegionTaxRates)
                                    vm.content.countryRegionTaxRates = [];

                                var idx = vm.content.countryRegionTaxRates.findIndex(function (itm) {
                                    return itm.countryId === country.id && itm.regionId === region.id;
                                });

                                if (idx > -1) {
                                    if (value) {
                                        vm.content.countryRegionTaxRates[idx].taxRate = value;
                                    } else {
                                        vm.content.countryRegionTaxRates.splice(idx, 1);
                                    }
                                } else {
                                    vm.content.countryRegionTaxRates.push({ countryId: country.id, regionId: region.id, taxRate: value });
                                }
                            }
                        });

                    });

                    vm.options.countryRegions = countries;
                });
            });

            if (create) {

                vendrTaxResource.createTaxClass(storeId).then(function (taxClass) {
                    vm.ready(taxClass);
                });

            } else {

                vendrTaxResource.getTaxClass(id).then(function (taxClass) {
                    vm.ready(taxClass);
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

                vendrTaxResource.saveTaxClass(vm.content).then(function (saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    if (create) {
                        $location.path("/settings/vendrsettings/taxclass-edit/" + vendrUtils.createCompositeId([storeId, saved.id]));
                    }
                    else {
                        vm.ready(saved);
                    }

                }, function (err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save tax class " + vm.content.name,
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if (args.entityType === 'TaxClass' && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.TaxClassEditController', TaxClassEditController);

}());
(function () {

    'use strict';

    function TaxClassListController($scope, $location, $routeParams, $q,
        appState, localizationService, treeService, navigationService,
        vendrUtils, vendrTaxResource, vendrActions) {

        var compositeId = vendrUtils.parseCompositeId($routeParams.id);
        var storeId = compositeId[0];

        var vm = this;

        vm.page = {};
        vm.page.loading = true;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            createActions: [],
            bulkActions: [],
            items: [],
            itemProperties: [
                { alias: 'defaultTaxRate', header: 'Default Tax Rate' }
            ],
            itemClick: function (itm) {
                $location.path(itm.routePath);
            }
        };

        vm.loadItems = function (callback) {
            vendrTaxResource.getTaxClasses(storeId).then(function (entities) {
                entities.forEach(function (itm) {
                    itm.defaultTaxRate = itm.defaultTaxRate + "%";
                    itm.routePath = '/settings/vendrsettings/taxclass-edit/' + vendrUtils.createCompositeId([storeId, itm.id]);
                });
                vm.options.items = entities;
                if (callback) callback();
            });
        };

        vm.init = function () {

            vendrActions.getBulkActions({ storeId: storeId, entityType: 'TaxClass' }).then(result => {
                vm.options.bulkActions = result;
            });

            navigationService.syncTree({ tree: "vendrsettings", path: "-1,1," + storeId + ",7", forceReload: true }).then(function (syncArgs) {
                vm.page.menu.currentNode = syncArgs.node;
                vm.page.breadcrumb.items = vendrUtils.createSettingsBreadcrumbFromTreeNode(syncArgs.node);
                treeService.getMenu({ treeNode: vm.page.menu.currentNode }).then(function (menu) {

                    var createMenuAction = menu.menuItems.find(function (itm) {
                        return itm.alias === 'create';
                    });

                    if (createMenuAction) {
                        vm.options.createActions.push({
                            name: 'Create Tax Class',
                            doAction: function () {
                                appState.setMenuState("currentNode", vm.page.menu.currentNode);
                                navigationService.executeMenuAction(createMenuAction,
                                    vm.page.menu.currentNode,
                                    vm.page.menu.currentSection);
                            }
                        });
                    }

                    vm.loadItems(function () {
                        vm.page.loading = false;
                    });

                });
            });
           
        };

        vm.init();

        var onVendrEvent = function (evt, args) {
            if (args.entityType === 'TaxClass' && args.storeId === storeId) {
                vm.page.loading = true;
                vm.loadItems(function () {
                    vm.page.loading = false;
                });
            }
        };

        $scope.$on("vendrEntitiesSorted", onVendrEvent);
        $scope.$on("vendrEntityDelete", onVendrEvent);

    };

    angular.module('vendr').controller('Vendr.Controllers.TaxClassListController', TaxClassListController);

}());
