(function () {

    'use strict';

    function vendrColorPicker() {

        function link(scope, el, attr, ctrl) {

            scope.internalSelectedColor = false;

            // NB: The initial space is important!
            // The umbraco swatch-picker component prefixes class name
            // with 'btn-' so we start with a space to break this.
            var classPrefix = " vendr-bg--";

            scope.colors = [
                //{ name: "Black", value: "color-black" },
                { name: "Grey", value: classPrefix + "grey" },
                { name: "Brown", value: classPrefix + "brown" },
                { name: "Blue", value: classPrefix + "blue" },
                { name: "Light Blue", value: classPrefix + "light-blue" },
                { name: "Indigo", value: classPrefix + "indigo" },
                { name: "Purple", value: classPrefix + "purple" },
                { name: "Deep Purple", value: classPrefix + "deep-purple" },
                { name: "Cyan", value: classPrefix + "cyan" },
                { name: "Green", value: classPrefix + "green" },
                { name: "Light Green", value: classPrefix + "light-green" },
                { name: "Lime", value: classPrefix + "lime" },
                { name: "Yellow", value: classPrefix + "yellow" },
                { name: "Amber", value: classPrefix + "amber" },
                { name: "Orange", value: classPrefix + "orange" },
                { name: "Deep Orange", value: classPrefix + "deep-orange" },
                { name: "Red", value: classPrefix + "red" },
                { name: "Pink", value: classPrefix + "pink" }
            ];

            if (scope.selectedColor) {
                var found = _.find(scope.colors, function (c) {
                    return c.value === classPrefix + scope.selectedColor;
                });
                if (found) {
                    scope.internalSelectedColor = found;
                }
            }

            scope.internalOnSelect = function (value) {
                var color = value.value.replace(classPrefix, '');
                scope.selectedColor = color;
                if (scope.onSelect) {
                    scope.onSelect({ color: color });
                }
            };
        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/vendr/views/directives/vendr-color-picker.html',
            scope: {
                selectedColor: '=',
                onSelect: '&'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrColorPicker', vendrColorPicker);

}());
(function () {

    'use strict';

    function vendrDictionaryInput($routeParams, listViewHelper, angularHelper,
        vendrDictionaryResource, editorService) {

        function link(scope, el, attr, ctrl) {

            scope.autoCompleteOptions = {
                minimumChars: 3,
                dropdownCssClass: 'dropdown-menu',
                selectedCssClass: 'vendr-auto-complete-item-selected',
                itemTemplate: "<a>{{entry.item}}</a>",
                noMatchTemplateEnabled: false,
                autoHideDropdown: true,
                data: function (searchKey) {

                    if (!searchKey.startsWith('#'))
                        return false;

                    searchKey = searchKey.substr(1);

                    return vendrDictionaryResource.searchKeys(searchKey, 5, scope.containerKey).then(function (keys) {
                        return keys.map(function (key) {
                            return '#' + key;
                        });
                    });

                },
                itemSelected: function (itm) {
                    scope.ngModel = itm.item;
                }
            };

            scope.openDictionaryEditor = function () {

                var launchDictionaryEditorDialog = function (cfg) {

                    var dictionaryEditorDialogConfig = {
                        view: '/app_plugins/vendr/views/dialogs/dictionaryedit.html',
                        size: 'small',
                        config: cfg,
                        submit: function (model) {
                            if (model) {
                                scope.ngModel = '#' + model.key;
                            }
                            editorService.close();
                        },
                        close: function () {
                            editorService.close();
                        }
                    };

                    editorService.open(dictionaryEditorDialogConfig);
                };

                vendrDictionaryResource.ensureRootDictionaryItem(scope.containerKey).then(function (containerId) {

                    if (scope.ngModel && scope.ngModel.startsWith('#')) {
                        vendrDictionaryResource.tryGetDictionaryItemIdByKey(scope.ngModel.substr(1)).then(function (id) {
                            if (id) {
                                launchDictionaryEditorDialog({
                                    id: id
                                });
                            } else if (confirm("Dictionary item with key '" + scope.ngModel + "' does not exist. Create it?")) {
                                launchDictionaryEditorDialog({
                                    id: '-1',
                                    parentId: containerId,
                                    name: scope.ngModel.substr(1)
                                });
                            }
                        });
                    } else if (scope.ngModel && confirm("Convert value '" + scope.ngModel + "' into a dictionary item?")) {
                        launchDictionaryEditorDialog({
                            id: '-1',
                            parentId: containerId,
                            name: scope.onGenerateKey(scope.name),
                            value: scope.ngModel
                        });
                    } else {
                        launchDictionaryEditorDialog({
                            id: '-1',
                            parentId: containerId,
                            name: scope.onGenerateKey(scope.name),
                            value: ''
                        });
                    }

                });
            };

        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/vendr/views/directives/vendr-dictionary-input.html',
            scope: {
                ngModel: '=',
                name: '@',
                containerKey: '=',
                onGenerateKey: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrDictionaryInput', vendrDictionaryInput);

}());
(function () {

    'use strict';

    function vendrItemPicker() {

        function link(scope, el, attr, ctrl) {

            scope.loading = true;
            scope.title = scope.config.title;
            scope.enableFilter = scope.config.enableFilter;
            scope.orderBy = scope.config.orderBy;
            scope.items = [];

            scope.init = function() {
                scope.onLoadItems().then(function(data) {
                    scope.items = data;
                    scope.loading = false;
                });
            };

            scope.select = function(item) {
                scope.onSelect({ item: item });
            };

            scope.close = function() {
                scope.onClose();
            };

            scope.init();
        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/vendr/views/directives/vendr-item-picker.html',
            scope: {
                config: '=',
                onLoadItems: '&',
                onSelect: '&',
                onClose: '&'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrItemPicker', vendrItemPicker);

}());
(function () {

    'use strict';

    function vendrLicenseCheck(vendrUtils) {

        function link(scope, el, attr, ctrl) {
            scope.licenseInfo = vendrUtils.getSettings("vendrLicenseInfo");
            // console.log(scope.licenseInfo);
        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/vendr/views/directives/vendr-license-check.html',
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrLicenseCheck', vendrLicenseCheck);

}());
(function () {

    'use strict';

    function vendrMediaPicker($routeParams, listViewHelper, angularHelper) {

        function link(scope, el, attr, ctrl) {

            scope.mediaPickerModel = {
                view: 'mediapicker',
                config: {
                    idType: 'udi',
                    multiPicker: scope.multiPicker,
                    onlyImages: scope.onlyImages,
                    disableFolderSelect: scope.disableFolderSelect
                }
            };

            // Proxy the value property to our ngModel property
            Object.defineProperty(scope.mediaPickerModel, "value", {
                get: function () {
                    return scope.ngModel;
                },
                set: function (value) {
                    scope.ngModel = value;
                }
            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: '<div><umb-property-editor model="mediaPickerModel" ng-if="mediaPickerModel"></umb-property-editor></div>',
            scope: {
                ngModel: '=',
                multiPicker: '<',
                onlyImages: '<',
                disableFolderSelect: '<'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrMediaPicker', vendrMediaPicker);

}());
(function () {

    'use strict';

    function vendrMessage() {

        function link(scope, el, attr, ctrl) { }

        var directive = {
            restrict: 'E',
            transclude: true,
            replace: true,
            templateUrl: '/app_plugins/vendr/views/directives/vendr-message.html',
            scope: {
                heading: '<',
                type: '<',
                icon: '<'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrMessage', vendrMessage);

}());
(function () {

    'use strict';

    function vendrTableController($interpolate, $sce, iconHelper) {

        var vm = this;


        vm.clickItem = function (item, $event) {
            if (vm.onClick && !($event.metaKey || $event.ctrlKey)) {
                vm.onClick({ item: item });
                $event.preventDefault();
            }
            $event.stopPropagation();
        };

        vm.selectItem = function (item, $index, $event) {
            if (vm.onSelect) {
                vm.onSelect({ item: item, $index: $index, $event: $event });
                $event.stopPropagation();
            }
        };

        vm.selectAll = function ($event) {
            if (vm.onSelectAll) {
                vm.onSelectAll({ $event: $event });
            }
        };

        vm.isSelectedAll = function () {
            if (vm.onSelectedAll && vm.items && vm.items.length > 0) {
                return vm.onSelectedAll();
            }
        };

        vm.isSortDirection = function (col, direction) {
            if (vm.onSortingDirection) {
                return vm.onSortingDirection({ col: col, direction: direction });
            }
        };

        vm.sort = function (field, allow, isSystem) {
            if (vm.onSort) {
                vm.onSort({ field: field, allow: allow, isSystem: isSystem });
            }
        };

        vm.getIcon = function (entry) {
            return iconHelper.convertFromLegacyIcon(entry.icon);
        };

        vm.renderTemplate = function (template, model) {
            var exp = $interpolate(template);
            return $sce.trustAsHtml(exp(model));
        };
    }

    var component = {
        templateUrl: '/app_plugins/vendr/views/directives/vendr-table.html',
        controller: vendrTableController,
        controllerAs: 'vm',
        bindings: {
            items: '<',
            itemProperties: '<',
            allowSelectAll: '<',
            onSelect: '&',
            onClick: '&',
            onSelectAll: '&',
            onSelectedAll: '&',
            onSortingDirection: '&',
            onSort: '&'
        }
    };

    angular.module('vendr.directives').component('vendrTable', component);

}());
(function () {

    'use strict';

    function vendrTableView($q, $routeParams, $timeout, listViewHelper, localizationService, notificationsService) {

        function link(scope, el, attr, ctrl) {

            function notifyAndReload(err, reload, successMsgPromise) {

                // Check if response is ysod
                if (err.status && err.status >= 500) {

                    // Open ysod overlay
                    scope.ysodOverlay = {
                        view: "ysod",
                        error: err,
                        show: true
                    };

                }

                $timeout(function () {
                    scope.bulkActionStatus = "";
                    scope.bulkActionInProgress = false;
                    scope.clearSelection();
                }, 500);

                if (reload && scope.onLoadItems) {
                    scope.loading = true;
                    scope.onLoadItems();
                }

                if (successMsgPromise) {
                    localizationService.localize("bulk_done")
                        .then(function (v) {
                            successMsgPromise.then(function (successMsg) {
                                notificationsService.success(v, successMsg);
                            });
                        });
                }

            }

            function serial(selected, fn, getStatusMsg, index) {
                return fn(selected[index]).then(function (content) {
                    index++;
                    getStatusMsg(index, selected.length).then(function (value) {
                        scope.bulkActionStatus = value;
                    });
                    return index < selected.length ? serial(selected, fn, getStatusMsg, index) : content;
                }, function (err) {
                    var reload = index > 0;
                    notifyAndReload(err, reload);
                    return err;
                });
            }

            function performBulkAction(fn, getStatusMsg, getSuccessMsg, getConfirmMsg) {
                var selected = scope.selection;

                if (selected.length === 0)
                    return;

                getConfirmMsg(selected.length).then(function (msg) {
                    if (!msg || confirm(msg)) {

                        scope.bulkActionInProgress = true;

                        getStatusMsg(0, selected.length).then(function (value) {
                            scope.bulkActionStatus = value;
                        });

                        return serial(selected, fn, getStatusMsg, 0).then(function (result) {
                            // executes once the whole selection has been processed
                            // in case of an error (caught by serial), result will be the error
                            if (!(result.data && angular.isArray(result.data.notifications)))
                                notifyAndReload(result, true, getSuccessMsg(selected.length));
                        });

                    }
                });
            }

            scope.options = {
                filterTerm: '',
                filteredItems: scope.items || [],
                bulkActionsAllowed: scope.bulkActions && scope.bulkActions.length > 0
            };

            scope.pagination = { pageNumber: 1, totalPages: 1 };
            scope.selection = [];
            scope.bulkActionStatus = '';
            scope.bulkActionInProgress = false;

            scope.doFilter = function () {
                if (scope.paginated) {
                    scope.doPaginatedFilter();
                } else { 
                    scope.doNonPaginatedFilter();
                }
            };

            scope.doPaginatedFilter = _.debounce(function () {
                scope.$apply(function () {
                    scope.pagination.pageNumber = 1;
                    scope.loadItems();
                });
            }, 500);

            scope.doNonPaginatedFilter = function () {
                var items = scope.items || [];
                scope.options.filteredItems = items.filter(function (itm) {
                    if (!scope.options.filterTerm)
                        return true;

                    var term = scope.options.filterTerm.toLowerCase();

                    if (itm.name.toLowerCase().startsWith(term))
                        return true;

                    if (scope.itemProperties && scope.itemProperties.length > 0) {
                        var found = scope.itemProperties.find(function (prop) {
                            return itm[prop.alias].toLowerCase().startsWith(term);
                        });

                        if (found)
                            return true;
                    }
                    return false;
                });
            };

            scope.doBulkAction = function (bulkAction) {
                performBulkAction(bulkAction.doAction,
                    function (count, total) {
                        return bulkAction.getStatusMessage
                            ? bulkAction.getStatusMessage(count, total)
                            : $q.resolve(count + " of " + total + " items processed");
                    },
                    function (total) {
                        return bulkAction.getSuccessMessage
                            ? bulkAction.getSuccessMessage(total)
                            : $q.resolve(total + " items successfully processed");
                    },
                    function (total) {
                        return bulkAction.getConfirmMessage
                            ? bulkAction.getConfirmMessage(total)
                            : $q.resolve(false);
                    });
            };

            scope.clearSelection = function () {
                listViewHelper.clearSelection(scope.options.filteredItems, null, scope.selection);
            };

            scope.selectAll = function ($event) {
                listViewHelper.selectAllItems(scope.options.filteredItems, scope.selection, $event);
            };

            scope.selectItem = function (selectedItem, $index, $event) {
                if (scope.options.bulkActionsAllowed)
                    listViewHelper.selectHandler(selectedItem, $index, scope.options.filteredItems, scope.selection, $event);
            };

            scope.areAllSelected = function () {
                return listViewHelper.isSelectedAll(scope.options.filteredItems, scope.selection);
            };

            scope.goToPage = function (pageNumber) {
                scope.pagination.pageNumber = pageNumber;
                scope.loadItems();
            };

            scope.loadItems = function () {
                scope.loading = true;
                scope.clearSelection();
                scope.onLoadItems({
                    searchTerm: scope.options.filterTerm,
                    pageNumber: scope.pagination.pageNumber
                });
            };

            scope.$watch('items', function () {
                scope.loading = false;

                if (!scope.paginated) {
                    // If the list view IS NOT paginated, assume the items is just an array
                    scope.options.filteredItems = scope.items;
                } else {
                    // If the list view IS paginated, assume the items are a paged result
                    scope.pagination = {
                        pageNumber: scope.items.pageNumber,
                        totalPages: scope.items.totalPages
                    };
                    scope.options.filteredItems = scope.items.items;
                }
            });

        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/vendr/views/directives/vendr-table-view.html',
            scope: {
                loading: "<",
                createActions: "<",
                bulkActions: "<",
                items: "<",
                itemProperties: "<",
                paginated: "<",
                itemClick: "<",
                onLoadItems: "="
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrTableView', vendrTableView);

}());
(function () {

    'use strict';

    function vendrToggle() {

        function link(scope, el, attr, ctrl) {

            scope.toggle = function () {
                scope.checked = !scope.checked;
                if (scope.onChange) {
                    scope.onChange({ 'checked': scope.checked });
                }
            };

        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/vendr/views/directives/vendr-toggle.html',
            scope: {
                checked: '=',
                name: "<",
                description: "<",
                onChange: "&",
                checkedActionLabel: "<",
                onCheckedAction: "&"
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrToggle', vendrToggle);

}());
(function () {

    'use strict';

    function vendrToggleList($routeParams, listViewHelper, angularHelper) {

        function link(scope, el, attr, ctrl) {

            Object.defineProperty(scope, "allChecked", {
                get: function () {
                    return scope.ngModel.every(function (itm) {
                        return itm.checked && (!itm[scope.itemsKey || 'items'] || itm[scope.itemsKey || 'items'].every(function(itm2) {
                            return itm2.checked;
                        }));
                    });
                },
                set: function (value) {
                    scope.ngModel.forEach(function (itm) {
                        itm.checked = value;
                        if (itm[scope.itemsKey || 'items']) {
                            itm[scope.itemsKey || 'items'].forEach(function (itm2) {
                                itm2.checked = value;
                            });
                        }
                    });
                }
            });

        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/vendr/views/directives/vendr-toggle-list.html',
            scope: {
                ngModel: '=',
                toggleAll: '=',
                itemsKey: '@',
                checkedActionLabel: '<',
                onCheckedAction: '<'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrToggleList', vendrToggleList);

}());
