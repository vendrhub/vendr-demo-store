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
            template:'<div class="vendr-color-picker"><umb-color-swatches colors="colors" use-color-class="true" selected-color="internalSelectedColor" on-select="internalOnSelect(color)" size="m"></umb-color-swatches></div>',
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
        vendrDictionaryResource, editorService, overlayService) {

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
                            } else {

                                overlayService.open({
                                    title: "Create Dictionary Item",
                                    view: "default",
                                    content: "Dictionary item with key '" + scope.ngModel + "' does not exist. Create it?",
                                    submitButtonLabelKey: "general_yes",
                                    closeButtonLabelKey: "general_cancel",
                                    submit: function () {
                                        overlayService.close();
                                        setTimeout(function () {
                                            launchDictionaryEditorDialog({
                                                id: '-1',
                                                parentId: containerId,
                                                name: scope.ngModel.substr(1)
                                            });
                                        }, 1);
                                    },
                                    close: function () {
                                        overlayService.close();
                                    }
                                });
                            }
                        });
                    } else if (scope.ngModel) {

                        overlayService.open({
                            title: "Convert to Dictionary Item",
                            view: "default",
                            content: "Convert value '" + scope.ngModel + "' into a dictionary item?",
                            submitButtonLabelKey: "general_yes",
                            closeButtonLabelKey: "general_cancel",
                            submit: function () {
                                overlayService.close();
                                setTimeout(function () {
                                    launchDictionaryEditorDialog({
                                        id: '-1',
                                        parentId: containerId,
                                        name: scope.onGenerateKey(scope.name),
                                        value: scope.ngModel
                                    });
                                }, 1);
                            },
                            close: function () {
                                overlayService.close();
                            }
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
            template:'<div class="vendr-input" style="position: relative;"><input type="text" ng-attr-autocomplete="{{ \'nope-\' + $id }}" ng-model="ngModel" auto-complete="autoCompleteOptions" prevent-enter-submit> <a ng-click="openDictionaryEditor()" class="vendr-input--action"><i class="icon icon-book-alt"></i></a></div>',
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

    function vendrIdLabel() {

        function link(scope, el, attr, ctrl) {
            scope.emptyGuid = "00000000-0000-0000-0000-000000000000";
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div>
                <div ng-if="value == emptyGuid"><umb-badge size="xs">Undefined</umb-badge></div>
                <div ng-if="value != emptyGuid" > {{ value }}</div >
            </div>`,
            scope: {
                value: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrIdLabel', vendrIdLabel);

}());
(function () {

    'use strict';

    function vendrItemPicker() {

        function link(scope, el, attr, ctrl) {

            scope.loading = true;
            scope.title = scope.config.title;
            scope.filter = {
                enabled: scope.config.enableFilter,
                term: ""
            };
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
            template:'<div class="vendr"><umb-load-indicator ng-if="loading"></umb-load-indicator><umb-editor-view><umb-editor-header name="title" name-locked="true" hide-alias="true" hide-icon="true" hide-description="true"></umb-editor-header><umb-editor-container><umb-box ng-if="items.length > 0"><umb-box-content><div class="umb-control-group" ng-if="filter.enabled"><div class="form-search"><i class="icon-search"></i> <input type="text" ng-model="filter.tearm" class="umb-search-field search-query input-block-level -full-width-input" localize="placeholder" placeholder="@placeholders_filter" umb-auto-focus no-dirty-check></div></div><ul class="umb-actions umb-actions-child"><li class="umb-action" ng-repeat="item in items | filter:filter.tearm"><a class="umb-action-link" ng-click="select(item)"><i class="large icon {{item.icon}} color-{{item.color}}"></i> <span class="menu-label"><span ng-bind="item.name"></span> <small ng-bind="item.id"></small></span></a></li></ul></umb-box-content></umb-box><umb-empty-state ng-if="!loading && items.length == 0" position="center"><p>There are no items available to choose from.</p></umb-empty-state></umb-editor-container><umb-editor-footer><umb-editor-footer-content-right><umb-button type="button" button-style="link" label-key="general_close" shortcut="esc" action="close()"></umb-button></umb-editor-footer-content-right></umb-editor-footer></umb-editor-view></div>',
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
            template:'<vendr-message ng-if="!licenseInfo.isLicensed" type="\'warn\'" heading="\'Trial Mode\'" icon="\'exclamation-triangle\'"><p>Vendr is currently running in trial mode and will be limited to a maximum of {{licenseInfo.trialMaxOrders}} finalized orders. When you are ready to go live, please purchase a license from <a href="https://getvendr.net?ref=lic-check" target="_blank">the Vendr website</a>.</p></vendr-message>',
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
            template:'<div class="vendr-message vendr-message--{{type}}"><h4 ng-if="heading" class="vendr-message__heading"><i class="fa fa-{{icon}} vendr-message__icon" ng-if="icon"></i>{{heading}}</h4><i class="fa fa-{{icon}} vendr-message__icon-watermark" ng-if="icon"></i><div class="vendr-message__body"><ng-transclude></ng-transclude><div class="vendr-message__body"></div></div></div>',
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
        template:'<div><div class="vendr-table umb-table" ng-if="vm.items"><div class="umb-table-head"><div class="umb-table-row"><div class="umb-table-cell vendr-table-cell"><a style="text-decoration: none;" ng-show="vm.allowSelectAll" ng-click="vm.selectAll()"><umb-checkmark checked="vm.isSelectedAll()" size="xs"></umb-checkmark></a></div><div class="umb-table-cell vendr-table-cell umb-table__name"><a class="umb-table-head__link sortable" href="#" ng-click="vm.sort(\'Name\', true, true)" prevent-default><localize key="general_name">Name</localize><i class="umb-table-head__icon icon" ng-class="{\'icon-navigation-up\': vm.isSortDirection(\'Name\', \'asc\'), \'icon-navigation-down\': vm.isSortDirection(\'Name\', \'desc\')}"></i></a></div><div class="umb-table-cell vendr-table-cell vendr-table-cell--{{column.align}}" ng-repeat="column in vm.itemProperties track by column.alias" ng-if="column.alias != \'name\'"><a class="umb-table-head__link" title="Sort by {{ column.header }}" href="#" ng-click="vm.sort(column.alias, column.allowSorting, column.isSystem)" ng-class="{\'sortable\':column.allowSorting}" prevent-default><span ng-bind="column.header"></span> <i class="umb-table-head__icon icon" ng-class="{\'icon-navigation-up\': vm.isSortDirection(column.alias, \'asc\'), \'icon-navigation-down\': vm.isSortDirection(column.alias, \'desc\')}"></i></a></div></div></div><div class="umb-table-body"><div class="umb-table-row -selectable" ng-repeat="item in vm.items track by $index" ng-class="{ \'-selected\' : item.selected }" ng-click="vm.selectItem(item, $index, $event)"><div class="umb-table-cell vendr-table-cell"><i class="umb-table-body__icon umb-table-body__fileicon {{item.icon}}" ng-class="vm.getIcon(item)"></i> <i class="umb-table-body__icon umb-table-body__checkicon icon-check"></i></div><div class="umb-table-cell vendr-table-cell umb-table__name"><a title="{{ item.name }}" class="umb-table-body__link" ng-href="{{\'#\' + item.editPath}}" ng-click="vm.clickItem(item, $event)"><span ng-if="vm.itemProperties.length > 0 && vm.itemProperties[0].alias == \'name\'"><span ng-if="vm.itemProperties[0].template" ng-bind-html="vm.renderTemplate(vm.itemProperties[0].template, item)"></span> <span ng-if="!vm.itemProperties[0].template" ng-bind="item.name"></span></span> <span ng-if="vm.itemProperties.length == 0 || vm.itemProperties[0].alias != \'name\'">{{item.name}}</span></a></div><div class="umb-table-cell vendr-table-cell vendr-table-cell--{{column.align}}" ng-repeat="column in vm.itemProperties track by column.alias" ng-if="column.alias != \'name\'"><span title="{{column.header}}: {{item[column.alias]}}"><span ng-if="column.template" ng-bind-html="vm.renderTemplate(column.template, item)"></span> <span ng-if="!column.template" ng-bind="item[column.alias]"></span></span></div></div></div></div><umb-empty-state ng-hide="vm.items" position="center"><localize key="content_listViewNoItems">There are no items show in the list.</localize></umb-empty-state></div>',
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

    function vendrTableView($q, $routeParams, $timeout, listViewHelper, localizationService, notificationsService, overlayService) {

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

            function performBulkAction(name, fn, getStatusMsg, getSuccessMsg, getConfirmMsg) {
                var selected = scope.selection;

                if (selected.length === 0)
                    return;

                getConfirmMsg(selected.length).then(function (msg) {

                    if (msg) {

                        const confirm = {
                            title: name,
                            view: "default",
                            content: msg,
                            submitButtonLabelKey: "general_yes",
                            closeButtonLabelKey: "general_cancel",
                            submitButtonStyle: "danger",
                            submit: function () {
                                performBulkActionInner(selected, fn, getStatusMsg, getSuccessMsg);
                                overlayService.close();
                            },
                            close: function () {
                                overlayService.close();
                            }
                        };

                        overlayService.open(confirm);

                    } else {
                        performBulkActionInner(selected, fn, getStatusMsg, getSuccessMsg);
                    }
                });
            }

            function performBulkActionInner(selected, fn, getStatusMsg, getSuccessMsg) {
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
                performBulkAction(bulkAction.name, 
                    bulkAction.doAction,
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
                listViewHelper.selectAllItemsToggle(scope.options.filteredItems, scope.selection);
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
            template:'<div class="vendr"><div class="umb-property-editor umb-listview"><umb-editor-sub-header ng-class="{\'--state-selection\':(selection.length > 0)}"><umb-editor-sub-header-content-left><umb-editor-sub-header-section ng-if="(createActions && createActions.length > 0 && (selection.length == 0))"><div class="btn-group" ng-show="createActions.length == 1"><a class="btn btn-white" ng-click="createActions[0].doAction()"><i class="{{createActions[0].icon}}"></i> {{createActions[0].name}}</a></div><div class="btn-group" ng-show="createActions.length > 1"><a class="btn btn-white dropdown-toggle" data-toggle="dropdown" ng-href><span ng-click="createActions[0].doAction()"><i class="{{createActions[0].icon}}"></i> {{createActions[0].name}}</span> <span class="caret" ng-click="page.createDropdownOpen = !page.createDropdownOpen"></span></a><umb-dropdown ng-if="page.createDropdownOpen" on-close="page.createDropdownOpen = false"><umb-dropdown-item ng-repeat="createAction in createActions" ng-if="$index > 0"><a ng-click="createAction.doAction()"><i class="{{createAction.icon}}"></i> {{createAction.name}}</a></umb-dropdown-item></umb-dropdown></div></umb-editor-sub-header-section><umb-editor-sub-header-section ng-show="(selection.length > 0)"><umb-button type="button" label="Clear selection" label-key="buttons_clearSelection" button-style="white" action="clearSelection()" disabled="bulkActionInProgress"></umb-button></umb-editor-sub-header-section><umb-editor-sub-header-section ng-show="(selection.length > 0)"><strong ng-show="!bulkActionInProgress">{{ selection.length }}<localize key="general_of">of</localize>{{ options.filteredItems.length }}<localize key="general_selected">items selected</localize></strong> <strong ng-show="bulkActionInProgress" ng-bind="bulkActionStatus"></strong><div class="umb-loader-wrapper -bottom" style="margin-bottom: 0;" ng-show="bulkActionInProgress"><div class="umb-loader"></div></div></umb-editor-sub-header-section></umb-editor-sub-header-content-left><umb-editor-sub-header-content-right><umb-editor-sub-header-section ng-show="(selection.length == 0)"><div class="form-search -no-margin-bottom pull-right" novalidate><div class="inner-addon left-addon"><i class="icon icon-search" ng-click="doFilter()"></i> <input class="form-control search-input" type="text" localize="placeholder" placeholder="@general_typeToSearch" ng-model="options.filterTerm" ng-change="doFilter()" ng-keydown="doFilter()" prevent-enter-submit no-dirty-check></div></div></umb-editor-sub-header-section><umb-editor-sub-header-section ng-show="(selection.length > 0) && (options.bulkActionsAllowed)"><umb-button ng-repeat="bulkAction in bulkActions" type="button" button-style="white" label="{{ bulkAction.name }}" icon="{{ bulkAction.icon }}" action="doBulkAction(bulkAction)" disabled="bulkActionInProgress" size="xs" add-ellipsis="true"></umb-button></umb-editor-sub-header-section></umb-editor-sub-header-content-right></umb-editor-sub-header><div ng-if="!loading"><vendr-table ng-if="options.filteredItems && options.filteredItems.length > 0" items="options.filteredItems" allow-select-all="options.bulkActionsAllowed" item-properties="itemProperties" on-select="selectItem(item, $index, $event)" on-click="itemClick(item)" on-select-all="selectAll($event)" on-selected-all="areAllSelected()"></vendr-table><umb-empty-state ng-if="!options.filteredItems || options.filteredItems.length === 0" position="center"><div>No items found</div></umb-empty-state></div><umb-load-indicator ng-show="loading"></umb-load-indicator><div class="flex justify-center"><umb-pagination ng-show="!loading && paginated && pagination.totalPages" page-number="pagination.pageNumber" total-pages="pagination.totalPages" on-next="goToPage" on-prev="goToPage" on-go-to-page="goToPage"></umb-pagination></div></div><umb-overlay ng-if="ysodOverlay.show" model="ysodOverlay" position="right" view="ysodOverlay.view"></umb-overlay></div>',
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
            template:'<div class="vendr-toggle"><umb-toggle checked="checked" on-click="toggle()"></umb-toggle><div class="vendr-toggle__content" ng-click="toggle()"><div>{{ name }}</div><div class="vendr-toggle__description">{{ description }}</div></div><div class="vendr-toggle__action" ng-if="checkedActionLabel && onCheckedAction && checked"><a class="vendr-toggle__action-btn btn btn-info" ng-click="onCheckedAction()" prevent-default>{{ checkedActionLabel }}</a></div></div>',
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
            template:'<div class="vendr-toggle-list"><vendr-toggle name="\'All\'" checked="allChecked" ng-if="toggleAll"><vendr-toggle ng-repeat-start="item in ngModel" checked="item.checked" name="item.name" description="item.description" checked-action-label="checkedActionLabel" on-checked-action="onCheckedAction(item)"><vendr-toggle ng-repeat="item2 in item[itemsKey || \'items\']" ng-if="item.checked" checked="item2.checked" name="item2.name" description="item2.description" checked-action-label="checkedActionLabel" on-checked-action="onCheckedAction(item2)" class="vendr-toggle--indented" ng-repeat-end></vendr-toggle></vendr-toggle></vendr-toggle></div>',
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
(function () {

    'use strict';

    function vendrUppercase() {

        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {

                element.on('keypress', function (e) {
                    var char = e.char || String.fromCharCode(e.charCode);
                    if (!/^[A-Z0-9]$/i.test(char)) {
                        e.preventDefault();
                        return false;
                    }
                });

                function parser(value) {
                    if (ctrl.$isEmpty(value)) {
                        return value;
                    }
                    var formatedValue = value.toUpperCase();
                    if (ctrl.$viewValue !== formatedValue) {
                        ctrl.$setViewValue(formatedValue);
                        ctrl.$render();
                    }
                    return formatedValue;
                }

                function formatter(value) {
                    if (ctrl.$isEmpty(value)) {
                        return value;
                    }
                    return value.toUpperCase();
                }

                ctrl.$formatters.push(formatter);
                ctrl.$parsers.push(parser);
            }
        };

    }

    angular.module('vendr.directives').directive('vendrUppercase', vendrUppercase);

}());
