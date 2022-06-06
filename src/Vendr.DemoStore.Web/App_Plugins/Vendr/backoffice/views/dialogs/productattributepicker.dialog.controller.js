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