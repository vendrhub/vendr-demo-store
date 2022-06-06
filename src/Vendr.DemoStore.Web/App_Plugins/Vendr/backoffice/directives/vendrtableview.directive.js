(function () {

    'use strict';

    function vendrTableView($q, $rootScope, $routeParams, $timeout, listViewHelper, localizationService, notificationsService, editorService, overlayService, vendrLocalStorage) {

        function link(scope, el, attr, ctrl) {

            function notifyAndReload(err, reload, successMsgPromise) {

                // Check if response is ysod
                if (err.status && err.status >= 500) {
                    overlayService.ysod(err);
                }

                $timeout(function () {
                    scope.bulkActionStatus = "";
                    scope.bulkActionInProgress = false;
                    scope.clearSelection();
                }, 200);

                if (reload && scope.onLoadItems) {
                    scope.loading = true;
                    scope.onLoadItems({
                        searchTerm: scope.options.filterTerm,
                        pageNumber: scope.pagination.pageNumber,
                        pageSize: scope.pagination.pageSize
                    });
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

            function doItemActions(selected, config, fn, getStatusMsg, index) {
                return fn(selected[index], config).then(function (content) {
                    index++;
                    getStatusMsg(index, selected.length).then(function (value) {
                        scope.bulkActionStatus = value;
                    });
                    return index < selected.length ? doItemActions(selected, config, fn, getStatusMsg, index) : content;
                }, function (err) {
                    var reload = index > 0;
                    notifyAndReload(err, reload);
                    return err;
                });
            }

            function doBulkAction(selected, config, fn) {
                return fn(selected, config).then(function (content) {
                    return content;
                }, function (err) {
                    notifyAndReload(err, true);
                    return err;
                });
            }

            function performBulkAction(name, configure, fn, getStatusMsg, getSuccessMsg, getConfirmMsg, isBulkAction) {
                var selected = scope.selection;

                if (selected.length === 0)
                    return;

                var selectedItems = scope.selection.map(function (itm) {
                    return scope.options.filteredItems.find(function (itm2) {
                        return itm.id === itm2.id;
                    });
                });

                getConfirmMsg(selectedItems.length).then(function (msg) {
                    if (msg) {
                        const confirm = {
                            title: name,
                            view: "default",
                            content: msg,
                            submitButtonLabelKey: "general_yes",
                            closeButtonLabelKey: "general_cancel",
                            submitButtonStyle: "danger",
                            submit: function () {
                                overlayService.close();
                                // Ensure we wait till the next tick as we don't know what a 
                                // configure action will do so we need to ensure that our UI
                                // is fully finished before it runs
                                $timeout(function () {
                                    configure(selectedItems).then(function (config) {
                                        performBulkActionInner(selectedItems, config, fn, getStatusMsg, getSuccessMsg, isBulkAction);
                                    }).catch(function (e) {
                                        notifyAndReload(e, false, null);
                                    });
                                }, 1);
                            }, 
                            close: function () {
                                overlayService.close();
                            }
                        };
                        overlayService.open(confirm);
                    } else {
                        configure(selectedItems).then(function (config) {
                            performBulkActionInner(selectedItems, config, fn, getStatusMsg, getSuccessMsg, isBulkAction);
                        }).catch(function (e) {
                            notifyAndReload(e, false, null);
                        });
                    }
                });
            }

            function performBulkActionInner(selected, config, fn, getStatusMsg, getSuccessMsg, isBulkAction) {
                scope.bulkActionInProgress = true;

                getStatusMsg(0, selected.length).then(function (value) {
                    scope.bulkActionStatus = value;
                });

                var r = isBulkAction
                    ? doBulkAction(selected, console, fn)
                    : doItemActions(selected, config, fn, getStatusMsg, 0);

                return r.then(function (result) {
                    // executes once the whole selection has been processed
                    // in case of an error (caught by serial), result will be the error
                    if (!(result.data && angular.isArray(result.data.notifications)))
                        notifyAndReload(result,
                            !result.canceled,
                            result.canceled ? null : getSuccessMsg(selected.length));
                });
            }

            var advancedFiltersCacheKey = $routeParams.section + "-"+ $routeParams.method + "-advancedFilter";
            
            scope.options = {
                filterTerm: '',
                filteredItems: scope.items || [],
                advancedFilters: vendrLocalStorage.get(advancedFiltersCacheKey) || [],
                orderBy: "name",
                orderDirection: "asc"
            };

            Object.defineProperty(scope.options, "bulkActionsAllowed", {
                get: () => { return scope.bulkActions && scope.bulkActions.length > 0 }
            });

            Object.defineProperty(scope.options, "allowSorting", {
                get: () => { return scope.allowSorting }
            });
            
            scope.pagination = { pageNumber: 1, totalPages: 1, pageSize: 30 };
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
            }, 750);

            scope.doNonPaginatedFilter = function () {
                var items = scope.items || [];
                var filteredItems = items.filter(function (itm) {

                    var result = false;
                    var term = (scope.options.filterTerm || "").toLowerCase();

                    // See if there is a term match
                    if (term.length > 0) {

                        if ((itm.name || "").toLowerCase().startsWith(term))
                            result = true;

                        if (!result && scope.itemProperties && scope.itemProperties.length > 0) {

                            var found = scope.itemProperties.find(function (prop) {

                                var propValue = prop.getter
                                    ? prop.getter(itm)
                                    : itm[prop.alias];

                                return propValue
                                    ? propValue.toLowerCase().startsWith(term)
                                    : false;
                            });

                            if (found)
                                result = true;
                        }

                    }
                    else
                    {
                        result = true;
                    }

                    // See if there is a filter match
                    if (scope.filters && scope.filters.some((f) => f.value.length > 0) && scope.onFilterItem) {
                        result &= scope.onFilterItem(itm, scope.filters);
                    }

                    return result;
                });

                filteredItems = _.sortBy(filteredItems, function (itm) {

                    var val = "";

                    if (scope.itemProperties && scope.itemProperties.length > 0)
                    {
                        var prop = scope.itemProperties.find(function (p) {
                            return p.alias.toLowerCase() === scope.options.orderBy.toLowerCase();
                        });

                        if (prop) {
                            val = prop.getter
                                ? prop.getter(itm)
                                : itm[prop.alias];
                        }
                    }

                    return val ? val : "zzzzzzzzzz";

                });

                if (scope.options.orderDirection.toLowerCase() === "desc") {
                    filteredItems = filteredItems.reverse();
                }

                scope.options.filteredItems = filteredItems;
            }; 

            scope.doBulkAction = function (bulkAction) {
                performBulkAction(bulkAction.name, 
                    bulkAction.configure || function () { return $q.resolve(null) },
                    bulkAction.bulkAction || bulkAction.itemAction || bulkAction.doAction,
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
                    },
                    !!bulkAction.bulkAction);
            };

            scope.clearSelection = function () {
                if (scope.options.bulkActionsAllowed)
                    listViewHelper.clearSelection(scope.options.filteredItems, null, scope.selection);
            };

            scope.selectAll = function ($event) {
                if (scope.options.bulkActionsAllowed)
                    listViewHelper.selectAllItemsToggle(scope.options.filteredItems, scope.selection);
            };

            scope.selectItem = function (selectedItem, $index, $event) {
                if (scope.options.bulkActionsAllowed)
                    listViewHelper.selectHandler(selectedItem, $index, scope.options.filteredItems, scope.selection, $event);
            };

            scope.areAllSelected = function () {
                return listViewHelper.isSelectedAll(scope.options.filteredItems, scope.selection);
            };

            scope.setSortDirection = function(col, direction) {
                return listViewHelper.setSortingDirection(col, direction, scope.options);
            }

            scope.sortItems = function (field, allow, isSystem) {
                if (allow) {
                    listViewHelper.setSorting(field.toLowerCase(), allow, scope.options);
                    scope.doFilter();
                }
            }

            scope.setPageSize = function (pageSize) {
                scope.pagination.pageNumber = 1;
                scope.pagination.pageSize = pageSize;
                scope.loadItems();
            }

            scope.goToPage = function (pageNumber) {
                scope.pagination.pageNumber = pageNumber;
                scope.loadItems();
            };
            
            scope.openAdvancedFilterDialog = function () {
                if (scope.advancedFilterProperties) {                    
                    editorService.open({
                        view: '/App_Plugins/Vendr/backoffice/views/dialogs/advancedfilter.html',
                        size: 'small',
                        config: {
                            properties: scope.advancedFilterProperties,
                            values: scope.options.advancedFilters.reduce((o, v) => {
                                o[v.alias] = v.value;
                                return o;
                            }, {})
                        },
                        submit: function(model) {
                            scope.options.advancedFilters = Object.keys(model).map(key => {
                                return { alias: key, value: model[key] }
                            });
                            vendrLocalStorage.set(advancedFiltersCacheKey, scope.options.advancedFilters);
                            scope.pagination.pageNumber = 1;
                            scope.loadItems();
                            editorService.close();
                        },
                        close: function () {
                            editorService.close();
                        }
                    });
                }
            }

            scope.loadItems = function (opts) {
                
                scope.loading = true;
                scope.clearSelection();

                opts = opts || {};
                opts = angular.extend({}, {
                    searchTerm: scope.options.filterTerm,
                    pageNumber: scope.pagination.pageNumber,
                    pageSize: scope.pagination.pageSize,
                    orderBy: scope.options.orderBy,
                    orderDirection: scope.options.orderDirection
                }, opts);

                scope.options.advancedFilters.forEach(fltr => {
                    if (fltr.value && fltr.value !== "") {
                        opts[fltr.alias] = fltr.value;
                    } else {
                        delete opts[fltr.alias];
                    }
                });
                
                scope.onLoadItems(opts);
            };

            var unsubscribe = [
                $rootScope.$on("vendrReloadTableViewItems", function (evt, opts) {
                    scope.loadItems(opts);
                })
            ];
            
            scope.$watch('items', function () {
                scope.loading = false;

                if (!scope.paginated) {
                    // If the list view IS NOT paginated, assume the items is just an array
                    scope.options.filteredItems = scope.items;
                } else {
                    // If the list view IS paginated, assume the items are a paged result
                    scope.pagination = {
                        pageNumber: scope.items.pageNumber,
                        totalPages: scope.items.totalPages,
                        pageSize: scope.items.pageSize
                    };
                    scope.options.filteredItems = scope.items.items;
                }
            });

            // If the items array length changes outside of the table
            // then re-calculate the filter
            if (scope.isEditable) {
                scope.$watch('items.length', function () {
                    scope.doFilter();
                });
            }

            // When the element is disposed we need to unsubscribe!
            // NOTE: this is very important otherwise if this is part of a modal, the listener still exists because the dom
            // element might still be there even after the modal has been hidden.
            scope.$on('$destroy', function () {
                unsubscribe.forEach(function (u) {
                    u();
                });
            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/App_Plugins/Vendr/backoffice/views/directives/vendr-table-view.html',
            scope: {
                loading: "<",
                createActions: "<",
                bulkActions: "<",
                filters: "<",
                advancedFilterProperties: "<",
                items: "<",
                itemProperties: "<",
                paginated: "<",
                allowSorting: '<',
                itemClick: "<",
                onFilterItem: "=",
                onLoadItems: "=",
                isEditable: "<"
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrTableView', vendrTableView);

}());