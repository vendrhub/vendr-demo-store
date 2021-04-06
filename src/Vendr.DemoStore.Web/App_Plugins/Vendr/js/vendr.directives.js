(function () {

    'use strict';

    function vendrAnalyticsChartWidget($rootScope, $timeout) {

        function link(scope, el, attr, ctrl) {

            scope.errored = false;
            scope.loading = true;

            scope.comparing = false;

            scope.value;
            scope.percentageChange;
            scope.percentagePointChange;

            scope.chart = {
                type: scope.chartType || 'line',
                labels: [],
                data: [],
                series: [],
                colors: ['#63aeec', '#f5c1bc'],
                options: angular.merge({}, {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    scales: {
                        xAxes: [{
                            gridLines: {
                                display: false
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    },
                    elements: {
                        line: {
                            tension: 0
                        }
                    }
                }, scope.chartOptions || {})
            };

            var init = function () {

                scope.errored = false;
                scope.loading = true;

                $timeout(function () {
                    $rootScope.$broadcast("VendrAnalyticsWidgetChanged", scope.config);
                }, 1);

                scope.onLoadData({ timeframe: scope.timeframe }).then(function (data) {

                    scope.comparing = scope.timeframe.compareTo;

                    scope.value = data.value;
                    scope.percentageChange = data.percentageChange;
                    scope.percentagePointChange = data.percentagePointChange;

                    scope.chart.labels = data.datasets[0].labels;
                    scope.chart.series = data.datasets.map(function (ds) {
                        return ds.name;
                    });
                    scope.chart.data = data.datasets.map(function (ds) {
                        return ds.data;
                    });

                    scope.chart.options.legend.display = data.datasets.length > 1;

                    scope.loading = false;

                    $timeout(function () {
                        $rootScope.$broadcast("VendrAnalyticsWidgetChanged", scope.config);
                    }, 1);
                }, function (err) {
                    scope.loading = false;
                    scope.errored = true;
                    scope.errorMessage = err.data.message || err.data.Message || err.errorMsg;
                });

            };

            init();

            $rootScope.$on("VendrAnalyticsTimeframeChanged", function (evt, timeframe) {
                scope.timeframe = timeframe;
                init();
            });

        }

        var directive = {
            restrict: 'E',
            replace: true,
            transclude: true,
            template: `<div>
    <umb-load-indicator ng-if="loading"></umb-load-indicator>

    <div ng-if="!loading && !errored">
        <div class="vendr-split">
            <h3 class="mt-0">{{ value.valueFormatted }}</h3>
            <h4 class="mt-0 "
                ng-class="{ 'color-grey': !percentageChange || percentageChange.value == 0, 'color-green' : percentageChange && percentageChange.value > 0, 'color-red' : percentageChange && percentageChange.value < 0 }"
                ng-if="comparing">
                <i class="fa" ng-class="{ 'fa-caret-up': percentageChange.value > 0, 'fa-caret-down': percentageChange.value < 0 }" ng-if="percentageChange"></i> 
                {{ percentageChange ? percentageChange.valueFormatted.replace('-', '') : 'N/A' }}
                <span class="text-12" ng-if="percentagePointChange">({{ percentagePointChange.valueFormatted.replace('-', '') }})</span>
            </h4>
        </div>
        <ng-transclude></ng-transclude>
        <canvas chart-base
                chart-type="chart.type"
                chart-data="chart.data"
                chart-labels="chart.labels"
                chart-series="chart.series"
                chart-colors="chart.colors"
                chart-options="chart.options">
        </canvas>
    </div>

    <umb-empty-state
        ng-if="!loading && errored"
        position="center">
        Unable to load report: {{errorMessage}}
    </umb-empty-state>  
</div>`,
            scope: {
                config: '=',
                timeframe: '<',
                chartType: '=?',
                chartOptions: '=?',
                onLoadData: '&'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrAnalyticsChartWidget', vendrAnalyticsChartWidget);

}());
(function () {

    'use strict';

    function vendrAnalyticsWidget() {

        function link(scope, el, attr, ctrl) {
            
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-analytics-widget">
    <umb-box class="mb-0">
        <umb-box-header title="{{config.name}}"><i class="fa fa-info-circle" ng-if="config.description" title="{{config.description}}"></i></umb-box-header>
        <umb-box-content class="block-form">
            <div ng-include="config.view" style="position: relative; min-height: 100px;"></div>
        </umb-box-content>
    </umb-box>
</div>`,
            scope: {
                config: '=',
                timeframe: '<'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrAnalyticsWidget', vendrAnalyticsWidget);

}());
(function () {

    'use strict';

    function vendrAutoSizeIframe() {

        function link(scope, element, attrs) {

            element.on('load', function () {

                var iFrameHeight = element[0].contentWindow.document.body.scrollHeight + 'px';
                var iFrameWidth = '100%';

                element.css('width', iFrameWidth);
                element.css('height', iFrameHeight);

            });
        }

        var directive = {
            restrict: 'A',
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrAutoSizeIframe', vendrAutoSizeIframe);

}());
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

    function vendrCompile($compile) {

        function link(scope, el, attr, ctrl) {
            el.html(scope.template).show();
            $compile(el.contents())(scope);
        }

        var directive = {
            restrict: 'A',
            scope: {
                template: '<',
                model: '<',
                refScope: '<'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrCompile', vendrCompile);

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
            template:'<div class="vendr-input" style="position: relative;"><input type="text" ng-attr-autocomplete="{{ \'nope-\' + $id }}" ng-model="ngModel" auto-complete="autoCompleteOptions" prevent-enter-submit> <a ng-click="openDictionaryEditor()" class="vendr-input--action"><i class="icon icon-book-alt" aria-hidden="true"></i></a></div>',
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

    function vendrEditorActions(notificationsService) {

        function link(scope, el, attr, ctrl) {

            scope.getActionName = function (editorAction) {
                return typeof editorAction.name === 'function'
                    ? editorAction.name(scope.model)
                    : editorAction.name;
            }

            scope.performEditorAction = function (editorAction) {
                editorAction.action(scope.model).then(function (resp) {
                    if (resp && !resp.canceled) {
                        notificationsService.success(scope.getActionName(editorAction) + " Successful",
                            resp.message || scope.getActionName(editorAction) + " successfully executed.");
                    }
                }, function (err) {
                    notificationsService.error(scope.getActionName(editorAction) + " Error",
                        err.message || "Unable to perform action '" + scope.getActionName(editorAction) + "'. Please check the error log for details.");
                });
            }

        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div>
                <umb-box ng-if="editorActions && editorActions.length > 0">
                    <umb-box-header title="Actions"></umb-box-header>
                    <umb-box-content class="block-form">
                        <button type="button" class="btn btn-block"
                            ng-repeat="editorAction in editorActions"
                            ng-class="{ 'btn-action' : $index === 0 }"
                            ng-click="performEditorAction(editorAction)">{{ getActionName(editorAction) }}</button>
                    </umb-box-content>
                </umb-box>
            </div>`,
            scope: {
                editorActions: '<',
                model: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrEditorActions', vendrEditorActions);

}());
(function () {

    'use strict';


    function vendrFilter() {

        function VendrFunctionController($scope) {

            var vm = this;

            vm.loading = true;
            vm.filter = $scope.filter;

            vm.showFilterOptions = false;
            vm.filterOptions = [];
            vm.groupedFilterOptions = {};

            vm.getFilterNames = function () {
                var names = vm.filterOptions.filter(function (itm) {
                    return itm.selected;
                }).map(function (itm) {
                    return (itm.group ? itm.group + " - " : "") + itm.name;
                });
                return names.length > 0 ? names.join(", ") : "All";
            };

            vm.someVisibleValues = function (values) {
                return values.some((val) => !val.hidden);
            }

            vm.setFilter = function (filterOption) {

                var filters = vm.filter.value;

                if (filterOption.selected) {
                    filters.push(filterOption.id);
                } else {
                    var index = filters.indexOf(filterOption.id);
                    filters.splice(index, 1);
                }

                vm.filter.value = filters;

                $scope.onChange({ filter: { alias: vm.alias, options: vm.filter.value } });

            };

            vm.clearFilter = function () {
                if (vm.filter.value.length > 0) {
                    vm.filterOptions.forEach(opt => {
                        opt.selected = false;
                    });
                    vm.filter.value = [];
                    $scope.onChange({ filter: { alias: vm.alias, options: vm.filter.value } });
                }
            };

            vm.filter.getFilterOptions().then(function (filterOptions) {

                var gfo = [];
                var currentGroup = null;

                filterOptions.forEach(itm => {
                    itm.selected = vm.filter.value.findIndex(itm2 => itm2.toString() === itm.id.toString()) > -1;
                    if (!currentGroup || currentGroup.group !== itm.group) {
                        currentGroup = { group: itm.group, items: [itm] }
                        gfo.push(currentGroup)
                    } else {
                        currentGroup.items.push(itm);
                    }
                });
                vm.filterOptions = filterOptions;

                vm.groupedFilterOptions = gfo;
                vm.loading = false;
            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr vendr-filter flex" style="position: relative;">
                <div class="flex" style="position: relative;" ng-show="!vm.loading">
                    <button type="button" class="btn btn-link dropdown-toggle flex" ng-click="vm.showFilterOptions = !vm.showFilterOptions" title="{{ vm.getFilterNames() }}" aria-haspopup="true" aria-expanded="{{vm.showFilterOptions === undefined ? false : vm.showFilterOptions}}">
                        <span>{{vm.filter.name}}:</span>
                        <span class="bold truncate dib" style="margin-left: 5px; margin-right: 3px; max-width: 150px;">{{ vm.getFilterNames() }}</span>
                        <span class="caret"></span>
                    </button>
                    <umb-dropdown class="pull-left" ng-if="vm.showFilterOptions" on-close="vm.showFilterOptions = false;" style="padding-top: 8px">
                        <umb-dropdown-item ng-repeat-start="g in vm.groupedFilterOptions" ng-if="g.group && g.group !== 'undefined' && vm.someVisibleValues(g.items)" style="padding: 8px 20px 0 16px;">
                            <strong>{{ g.group }}</strong>
                        </umb-dropdown-item>
                        <umb-dropdown-item ng-repeat="filterOption in g.items" ng-if="!filterOption.hidden" ng-repeat-end style="padding: 8px 20px 8px 16px;">
                            <div class="flex items-center">
                                <umb-checkbox input-id="filter-{{vm.filter.alias}}-{{$index}}" name="filter-{{vm.filter.alias}}" model="filterOption.selected" on-change="vm.setFilter(filterOption)"></umb-checkbox>
                                <label for="filter-{{vm.filter.alias}}-{{$index}}" class="m-0">
                                    <span ng-if="!filterOption.color" class="m-0 nowrap">{{filterOption.name}}</span>
                                    <umb-badge ng-if="filterOption.color" class="{{ 'm-0 nowrap umb-badge--s vendr-bg--' + filterOption.color }}">{{filterOption.name}}</umb-badge>
                                </label>
                            </div>
                        </umb-dropdown-item>
                        <umb-dropdown-item style="padding-top: 8px"></umb-dropdown-item>
                        <umb-dropdown-item ng-if="vm.filter.value.length > 0">
                            <hr class="m-0" />
                            <button type="button" ng-click="vm.clearFilter()" style="padding-left: 16px; display: flex; width: 100%;"><i class="icon icon-delete mr-10" aria-hidden="true"></i> Clear</button>
                        </umb-dropdown-item>
                    </umb-dropdown>
                </div>
            </div>`,
            scope: {
                filter: '=',
                onChange: "&"
            },
            controller: VendrFunctionController,
            controllerAs: 'vm'
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrFilter', vendrFilter);

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
                <div ng-if="value == emptyGuid"><umb-badge size="xs">Unsaved</umb-badge></div>
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
                scope.loadItems();
            };

            scope.reset = function () {
                scope.filter.term = "";
            };

            scope.loadItems = function (parentId) {
                scope.items = [];
                scope.loading = true;
                scope.onLoadItems({ parentId: parentId }).then(function (data) {
                    scope.items = data;
                    scope.loading = false;
                });
            };

            scope.back = function () {
                scope.onBack({ scope: scope });
            };

            scope.select = function(item) {
                scope.onSelect({ item: item, scope: scope });
            };

            scope.close = function() {
                scope.onClose();
            };

            scope.init();
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template:'<div class="vendr"><umb-load-indicator ng-if="loading"></umb-load-indicator><umb-editor-view><umb-editor-header name="title" name-locked="true" hide-alias="true" hide-icon="true" hide-description="true"></umb-editor-header><umb-editor-container><umb-box ng-if="items.length > 0"><umb-box-content><div style="display: flex; margin-bottom: 20px;" ng-if="parentItem"><button type="button" class="umb-editor-header__back" style="width: 30px;" ng-click="back()"><i class="fa fa-arrow-left" aria-hidden="true"></i> <span class="sr-only">Go back</span></button><div style="padding-left: 10px;"><h4 style="margin: 0; font-weight: bold; font-size: 16px;">{{ parentItem.name }}</h4><small style="margin: 0; font-size: 12px; color: #a2a1a6;">{{ parentItem.id }}</small></div></div><div class="umb-control-group" ng-if="filter.enabled"><div class="form-search"><i class="icon-search" aria-hidden="true"></i> <input type="text" ng-model="filter.term" class="umb-search-field search-query input-block-level -full-width-input" localize="placeholder" placeholder="@placeholders_filter" umb-auto-focus no-dirty-check></div></div><ul class="umb-actions umb-actions-child"><li class="umb-action" ng-repeat="item in items | filter:filter.term"><a class="umb-action-link" ng-click="select(item)"><i class="large icon {{item.icon}} color-{{item.color}}" aria-hidden="true"></i> <span class="menu-label"><span ng-bind="item.name"></span> <small ng-bind="item.id"></small></span></a></li></ul></umb-box-content></umb-box><umb-empty-state ng-if="!loading && items.length == 0" position="center"><p>There are no items available to choose from.</p></umb-empty-state></umb-editor-container><umb-editor-footer><umb-editor-footer-content-right><umb-button type="button" button-style="link" label-key="general_close" shortcut="esc" action="close()"></umb-button></umb-editor-footer-content-right></umb-editor-footer></umb-editor-view></div>',
            scope: {
                config: '=',
                parentItem: '=',
                onBack: '&',
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

    function vendrLicenseCheck(vendrUtils, vendrLicensingResource, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {
            vendrRouteCache.getOrFetch("vendrLicensingInfo",
                () => vendrLicensingResource.getLicensingInfo()).then(function (data) {
                scope.licensingInfo = data;
            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template:'<div><div ng-if="licensingInfo"><vendr-message ng-if="!licensingInfo.isLicensed" type="\'warn\'" heading="\'Trial Mode\'" icon="\'exclamation-triangle\'"><p>Vendr is currently running in unlicensed mode and will be limited to a maximum of {{licensingInfo.limitations.maxFinalizedOrders}} finalized orders. You can purchase a license from <a href="https://vendr.net?ref=lic-check" target="_blank">the Vendr website</a>.</p></vendr-message><vendr-message ng-if="licensingInfo.isLicensed && licensingInfo.isExpiring" type="\'warn\'" heading="\'License Expiring\'" icon="\'exclamation-triangle\'"><p>You are currently using Vendr with a license that is due to expire. If you have a trial license, please purchase a full license from <a href="https://vendr.net?ref=lic-check" target="_blank">the Vendr website</a>. If you are using a subscription license, this should have renewed by now so please review your error log for any issues with the renewal process.</p></vendr-message></div></div>',
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrLicenseCheck', vendrLicenseCheck);

}());
(function () {

    'use strict';

    function vendrLowercase() {

        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {

                element.on('keypress', function (e) {
                    var char = e.char || String.fromCharCode(e.charCode);
                    if (!/^[a-z0-9]$/i.test(char)) {
                        e.preventDefault();
                        return false;
                    }
                });

                function parser(value) {
                    if (ctrl.$isEmpty(value)) {
                        return value;
                    }
                    var formatedValue = value.toLowerCase();
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
                    return value.toLowerCase();
                }

                ctrl.$formatters.push(formatter);
                ctrl.$parsers.push(parser);
            }
        };

    }

    angular.module('vendr.directives').directive('vendrLowercase', vendrLowercase);

}());
(function () {

    'use strict';

    function vendrMasonryGrid($rootScope, $timeout, assetsService) {

        function link(scope, el, attr, ctrl)
        {
            var masonry = null;

            var cfg = {
                container: '#vendr-masonry-grid-' + scope.$id
            };

            if (scope.vendrMasonryGrid) {
                cfg = Object.assign(cfg, scope.vendrMasonryGrid)
            }

            $timeout(function () { // Give angular time to do it's firt render of child items
                masonry = new MiniMasonry(cfg);
            }, 1);

            $rootScope.$on('vendrMasonryGridChanged', function () {
                if (masonry) {
                    masonry.layout();
                }
            });
        }

        var directive = {
            restrict: 'A',
            replace: true,
            transclude: true,
            link: link,
            template: `<div id="vendr-masonry-grid-{{$id}}" ng-transclude></div>`,
            scope: {
                vendrMasonryGrid: '='
            }
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrMasonryGrid', vendrMasonryGrid);

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
            template:'<div class="vendr-message vendr-message--{{type}}"><h4 ng-if="heading" class="vendr-message__heading"><i class="fa fa-{{icon}} vendr-message__icon" ng-if="icon" aria-hidden="true"></i>{{heading}}</h4><i class="fa fa-{{icon}} vendr-message__icon-watermark" ng-if="icon" aria-hidden="true"></i><div class="vendr-message__body"><ng-transclude></ng-transclude><div class="vendr-message__body"></div></div></div>',
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

    function vendrOrderSearch($rootScope, $timeout, $location, angularHelper, assetsService, vendrOrderResource, vendrUtils) {

        function link(scope, el, attr, ctrl) {

            var typeahead;

            assetsService.loadJs("lib/typeahead.js/typeahead.bundle.min.js").then(function () {

                var sources = {
                    // see: https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#options
                    // name = the data set name, we'll make this the tag group name + culture
                    name: "vendr_order_search_" + scope.storeId,
                    display: "orderNumber",
                    //source: tagsHound
                    source: function (query, syncCallback, asyncCallback) {
                        vendrOrderResource.searchOrders(scope.storeId, {
                            pageNumber: 1,
                            pageSize: 10,
                            searchTerm: query
                        }).then(function (entities) {
                            entities.items.forEach(function (itm) {
                                itm.routePath = '/commerce/vendr/order-edit/' + vendrUtils.createCompositeId([scope.storeId, itm.id]);
                            });
                            asyncCallback(entities.items);
                        });
                    },
                    templates: {
                        suggestion: function (data) {
                            return '<div class="vendr-search__result"><span class="vendr-search__result__icon"><i class="icon ' + data.icon + '"></i></span><span class="vendr-search__result__body"><span class="vendr-search__result__heading">#' + data.orderNumber + '</span><br /><span class="vendr-search__result__sub-heading">' + data.customerFullName + '</span></span></div>';
                        }
                    }
                };

                var opts = {
                    hint: true,
                    highlight: true,
                    cacheKey: new Date(),
                    minLength: 1
                };

                typeahead = el.find('input').typeahead(opts, sources)
                    .bind("typeahead:selected", function (obj, datum, name) {
                        angularHelper.safeApply($rootScope, function () {
                            $location.path(datum.routePath);
                        });
                    }).bind("typeahead:autocompleted", function (obj, datum, name) {
                        angularHelper.safeApply($rootScope, function () {
                            $location.path(datum.routePath);
                        });
                    });

            });

        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-search">
    <span><i class="fa fa-search vendr-search__icon"></i></span><span class="vendr-search__input-wrapper"><input type="text" placeholder="Search for an Order" class="vendr-search__input" /></span>
</div>`,
            scope: {
                storeId: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrOrderSearch', vendrOrderSearch);

}());
(function () {

    'use strict';

    function vendrPageSize() {

        function link(scope, el, attr, ctrl) {
            scope.handleChange = function () {
                if (scope.onChange) {
                    scope.onChange({ pageSize: scope.pageSize })
                }
            }
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<select class="vendr-page-size" 
                ng-model="pageSize" 
                ng-options="size for size in pageSizes"
                ng-change="handleChange()">
            </select>`,
            scope: {
                pageSizes: '=',
                pageSize: '=',
                onChange: '&'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrPageSize', vendrPageSize);

}());
(function () {

    'use strict';

    // Helpers
    function vendrDiscountRewardProviderScaffoldToConfig(scaffold, vendrUtils) {
        return {
            id: vendrUtils.generateGuid(),
            rewardProviderAlias: scaffold.alias,
            settings: scaffold.settingDefinitions.reduce(function (map, obj) {
                map[obj.key] = null;
                return map;
            }, {})
        };
    }

    // Reward Builder
    function vendrRewardBuilder($rootScope, $timeout, $q, editorService, vendrDiscountResource, vendrUtils, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {

            scope.ready = false;

            var discountRewardProviderPickerDialogOptions = {
                view: '/app_plugins/vendr/views/dialogs/discountrewardproviderpicker.html',
                size: 'small',
                config: { },
                submit: function (model) {
                    vendrRouteCache.getOrFetch("discountRewardProviderScaffold_" + model.alias,
                        () => vendrDiscountResource.getDiscountRewardProviderScaffold(model.alias)).then(function (scaffold) {

                        // Create config and add to children
                        scope.ngModel = scope.ngModel || [];

                        var configScaffold = vendrDiscountRewardProviderScaffoldToConfig(scaffold, vendrUtils);

                        // Open the settings editor
                        settingsEditorDialogOptions.config.name = "Edit " + scaffold.name;
                        settingsEditorDialogOptions.config.scaffold = configScaffold;
                        settingsEditorDialogOptions.config.settings = configScaffold.settings;
                        settingsEditorDialogOptions.config.loadSettingDefinitions = function () {
                            return $q.when(scaffold.settingDefinitions);
                        };

                        editorService.open(settingsEditorDialogOptions);

                    });
                },
                close: function () {
                    editorService.close();
                }
            };

            var settingsEditorDialogOptions = {
                view: '/app_plugins/vendr/views/dialogs/settingseditor.html',
                size: 'small',
                config: {},
                submit: function (settings) {

                    // NB: If you edit this, be sure to also edit the settingsEditorOptions in the
                    // rule directive below

                    // Grab scaffold from config
                    var configScaffold = this.config.scaffold;

                    // Map settings back to scaffold
                    Object.keys(settings).forEach(function (key) {
                        configScaffold.settings[key] = settings[key];
                    });

                    // Add scaffold to config
                    scope.ngModel.push(configScaffold);

                    // Close the dialog
                    editorService.closeAll();
                },
                close: function () {
                    editorService.close();
                }
            };

            scope.sortableOptions = {
                axis: "y",
                cursor: "move",
                handle: ".handle",
                placeholder: 'sortable-placeholder',
                items: ".vendr-reward-builder__item",
                forcePlaceholderSize: true
            };

            scope.addReward = function () {
                editorService.open(discountRewardProviderPickerDialogOptions);
            };

            scope.$on("deleteRewardBuilderItem", function (evt, data) {
                scope.ngModel.splice(data.index, 1);
            });

            // We only fetch the defs here to ensure the cache is set
            // so that child rules can reuse them
            vendrRouteCache.getOrFetch("discountRewardProviderDefs",
                () => vendrDiscountResource.getDiscountRewardProviderDefinitions()).then(function (defs) {

                if (!scope.ngModel) {
                    scope.ngModel = [];
                }

                scope.ready = true;
            });
            
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-reward-builder">
                <div ng-if="ready">
                    <div ui-sortable="sortableOptions" ng-model="ngModel">
                        <div class="vendr-reward-builder__item" ng-repeat="itm in ngModel track by itm.id">
                            <vendr-reward-builder-reward ng-model="itm" index="$index">
                            </vendr-reward-builder-reward>
                        </div>
                    </div>
                    <button type="button" class="umb-node-preview-add" ng-click="addReward()">
                        <span>Add Reward</span>
                        <span class="sr-only">...</span>
                    </button>
                </div>
            </div>`,
            scope: {
                ngModel: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrRewardBuilder', vendrRewardBuilder);

    // Reward 
    function vendrRewardBuilderReward($rootScope, $interpolate, editorService, vendrDiscountResource, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {

            function generateLabelModel() {

                var item = angular.copy(scope.ngModel.settings || {});

                item["$index"] = scope.index;
                item["$level"] = scope.level;

                item["$rewardName"] = scope.discountRewardDefinition.name;
                item["$rewardAlias"] = scope.discountRewardDefinition.alias;

                scope.labelModel = item;

            };

            var settingsEditorDialogOptions = {
                view: '/app_plugins/vendr/views/dialogs/settingseditor.html',
                size: 'small',
                config: {
                    loadSettingDefinitions: function () {
                        return vendrRouteCache.getOrFetch("discountRewardProviderScaffold_" + scope.ngModel.rewardProviderAlias, 
                            () => vendrDiscountResource.getDiscountRewardProviderScaffold(scope.ngModel.rewardProviderAlias))
                            .then(function (scaffold) {
                                return scaffold.settingDefinitions;
                            });
                    },
                    settings: scope.ngModel.settings
                },
                submit: function (settings) {
                    // Map settings back to ngModel
                    Object.keys(settings).forEach(function (key) {
                        scope.ngModel.settings[key] = settings[key];
                    });
                    // Regenerate the label model
                    generateLabelModel();
                    // Close the dialog
                    editorService.closeAll();
                },
                close: function () {
                    editorService.closeAll();
                }
            };

            scope.editReward = function () {
                editorService.open(settingsEditorDialogOptions);
            };

            scope.deleteReward = function () {
                // We can't delete ourselves so we emit an event for the parent group to do it
                scope.$emit("deleteRewardBuilderItem", { index: scope.index });
            };

            scope.$on("editRewardBuilderItem", function (evt, data) {
                if (data.index === scope.index) {
                    scope.editReward();
                }
            });

            vendrRouteCache.get("discountRewardProviderDefs").then(function (defs) {

                scope.discountRewardDefinition = defs.find((el) => el.alias == scope.ngModel.rewardProviderAlias);

                scope.labelView = scope.discountRewardDefinition.labelView.endsWith(".html")
                    ? scope.discountRewardDefinition.labelView
                    : "/app_plugins/vendr/views/discount/rewards/labelViews/" + scope.discountRewardDefinition.labelView + ".html";

                settingsEditorDialogOptions.config.name = "Edit " + scope.discountRewardDefinition.name;

                generateLabelModel();

            });

        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div>
                <div class="vendr-reward-builder__reward" ng-if="discountRewardDefinition">
                    <div class="vendr-split">
                        <div class="flex items-center">
                            <span class="px-10 -ml-5 handle cursor-move" prevent-default><i class="fa fa-ellipsis-v" title="Move Reward" aria-hidden="true"></i></span>
                            <button type="button" ng-click="editReward()" class="btn-reset strong pr-5" title="Edit Reward">
                                <vendr-scoped-include view="labelView" model="labelModel" ng-if="labelView"></vendr-scoped-include>
                            </button>
                        </div>
                        <div class="flex items-center">
                            <button type="button" ng-click="editReward()" class="mr-5 vendr-inline-button" title="Edit Reward" aria-hidden="true"><i class="fa fa-pencil" aria-hidden="true"></i></button>
                            <button type="button" ng-click="deleteReward()" class="vendr-inline-button" title="Remove Reward" aria-hidden="true"><i class="fa fa-trash" aria-hidden="true"></i></button>
                        </div>
                    </div>
                </div>
            </div>`,
            scope: {
                ngModel: '=',
                index: '='
            },
            link: link
        };

        return directive;
    };

    angular.module('vendr.directives').directive('vendrRewardBuilderReward', vendrRewardBuilderReward);

}());
(function () {

    'use strict';

    // Helpers
    function vendrDiscountRuleProviderScaffoldToConfig(scaffold, vendrUtils) {
        return {
            id: vendrUtils.generateGuid(),
            ruleProviderAlias: scaffold.alias,
            settings: scaffold.settingDefinitions.reduce(function (map, obj) {
                map[obj.key] = null;
                return map;
            }, {}),
            children: []
        };
    }

    // Rule Builder
    function vendrRuleBuilder($rootScope, vendrDiscountResource, vendrUtils, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {

            scope.ready = false;

            // We only fetch the defs here to ensure the cache is set
            // so that child rules can reuse them
            vendrRouteCache.getOrFetch("discountRuleProviderDefs", () => vendrDiscountResource.getDiscountRuleProviderDefinitions()).then(function (defs) {
                if (!scope.ngModel) {
                    vendrDiscountResource.getDiscountRuleProviderScaffold("groupDiscountRule").then(function (scaffold) {
                        scope.ngModel = vendrDiscountRuleProviderScaffoldToConfig(scaffold, vendrUtils);
                        scope.ready = true;
                    });
                } else {
                    scope.ready = true;
                }
            });
            
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-rule-builder">
                <vendr-rule-builder-item ng-if="ngModel && ready"
                    ng-model="ngModel" level="0" index="0">
                </vendr-rule-builder-item>
            </div>`,
            scope: {
                ngModel: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrRuleBuilder', vendrRuleBuilder);

    // Item
    function vendrRuleBuilderItem() {

        function link(scope, el, attr, ctrl) { }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-rule-builder__group-item">
                <vendr-rule-builder-rule-group ng-if="ngModel.ruleProviderAlias == 'groupDiscountRule'" ng-model="ngModel" level="level" index="index"></vendr-rule-builder-rule-group>
                <vendr-rule-builder-rule ng-if="ngModel.ruleProviderAlias != 'groupDiscountRule'" ng-model="ngModel" level="level" index="index"></vendr-rule-builder-rule>
            </div >`,
            scope: {
                ngModel: '=',
                level: '=',
                index: '='
            },
            link: link
        };

        return directive;
    };

    angular.module('vendr.directives').directive('vendrRuleBuilderItem', vendrRuleBuilderItem);

    // Rule Group
    function vendrRuleBuilderRuleGroup($rootScope, $timeout, $q, editorService, vendrDiscountResource, vendrUtils, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {

            scope.matchTypes = ["All", "Any"];

            if (!scope.ngModel.settings.matchType) {
                scope.ngModel.settings.matchType = scope.matchTypes[0];
            }

            var discountRuleProviderPickerDialogOptions = {
                view: '/app_plugins/vendr/views/dialogs/discountruleproviderpicker.html',
                size: 'small',
                config: { },
                submit: function (model) {
                    vendrRouteCache.getOrFetch("discountRuleProviderScaffold_" + model.alias,
                        () => vendrDiscountResource.getDiscountRuleProviderScaffold(model.alias)).then(function (scaffold) {

                        // Create config and add to children
                        scope.ngModel.children = scope.ngModel.children || [];

                        var configScaffold = vendrDiscountRuleProviderScaffoldToConfig(scaffold, vendrUtils);
                        
                        // Close the dialog or open the editor depending on the rule
                        if (scaffold.alias === "groupDiscountRule") {

                            scope.ngModel.children.push(configScaffold);
                            editorService.close();

                        } else {

                            settingsEditorDialogOptions.config.name = "Edit " + scaffold.name;
                            settingsEditorDialogOptions.config.scaffold = configScaffold;
                            settingsEditorDialogOptions.config.settings = configScaffold.settings;
                            settingsEditorDialogOptions.config.loadSettingDefinitions = function () {
                                return $q.when(scaffold.settingDefinitions);
                            };

                            editorService.open(settingsEditorDialogOptions);
                        }
                    });
                },
                close: function () {
                    editorService.close();
                }
            };

            var settingsEditorDialogOptions = {
                view: '/app_plugins/vendr/views/dialogs/settingseditor.html',
                size: 'small',
                config: { },
                submit: function (settings) {

                    // NB: If you edit this, be sure to also edit the settingsEditorOptions in the
                    // rule directive below

                    // Grab scaffold from config
                    var configScaffold = this.config.scaffold;

                    // Map settings back to scaffold
                    Object.keys(settings).forEach(function (key) {
                        configScaffold.settings[key] = settings[key];
                    });

                    // Add scaffold to config
                    scope.ngModel.children.push(configScaffold);

                    // Close the dialog
                    editorService.closeAll();
                },
                close: function () {
                    editorService.close();
                }
            };

            scope.sortableOptions = {
                axis: "y",
                cursor: "move",
                handle: ".handle--" + scope.level,
                placeholder: 'sortable-placeholder',
                items: ".vendr-rule-builder__group-item",
                forcePlaceholderSize: true
            };

            scope.addRule = function () {
                editorService.open(discountRuleProviderPickerDialogOptions);
            };

            scope.deleteGroup = function () {
                if (scope.level > 0) {
                    // We can't delete ourselves so we emit an event for the parent group to do it
                    scope.$emit("deleteRuleBuilderItem", { level: scope.level, index: scope.index });
                }
            };

            scope.$on("deleteRuleBuilderItem", function (evt, data) {
                if (data.level === scope.level + 1) {
                    scope.ngModel.children.splice(data.index, 1);
                }
            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-rule-builder__group">
                <div class="vendr-rule-builder__group-header py-5">
                    <div class="vendr-split">
                        <div class="flex items-center px-10">
                            <a href="#" class="px-10 -ml-5 handle handle--{{level - 1}}" ng-if="level > 0" title="Move Rule" aria-hidden="true"><i class="fa fa-ellipsis-v"></i></a>
                            <span class="mr-10 strong">Match:</span><select ng-model="ngModel.settings.matchType" ng-options="matchType for matchType in matchTypes"></select>
                        </div>
                        <div class="flex items-center"><button type="button" class="btn" ng-click="deleteGroup()" ng-if="level > 0" title="Remove Group" aria-hidden="true"><i class="fa fa-trash"></i></button></div>
                    </div>
                </div>
                <div class="vendr-rule-builder__group-inner">
                    <div ui-sortable="sortableOptions" ng-model="ngModel.children">
                        <vendr-rule-builder-item ng-model="itm" 
                            ng-repeat="itm in ngModel.children track by itm.id" 
                            level="level + 1"
                            index="$index">
                        </vendr-rule-builder-item>
                    </div>
                    <button type="button" class="umb-node-preview-add" ng-click="addRule()">
                        <span>Add Rule</span>
                        <span class="sr-only">...</span>
                    </button>
                </div>
            </div>`,
            scope: {
                ngModel: '=',
                level: '=',
                index: '='
            },
            link: link
        };

        return directive;
    };

    angular.module('vendr.directives').directive('vendrRuleBuilderRuleGroup', vendrRuleBuilderRuleGroup);

    // Rule 
    function vendrRuleBuilderRule($rootScope, $interpolate, editorService, vendrDiscountResource, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {

            function generateLabelModel() {

                var item = angular.copy(scope.ngModel.settings || {});

                item["$index"] = scope.index;
                item["$level"] = scope.level;

                item["$ruleName"] = scope.discountRuleDefinition.name;
                item["$ruleAlias"] = scope.discountRuleDefinition.alias;

                scope.labelModel = item;

            }

            var settingsEditorDialogOptions = {
                view: '/app_plugins/vendr/views/dialogs/settingseditor.html',
                size: 'small',
                config: {
                    loadSettingDefinitions: function () {
                        return vendrRouteCache.getOrFetch("discountRuleProviderScaffold_" + scope.ngModel.ruleProviderAlias, 
                            () => vendrDiscountResource.getDiscountRuleProviderScaffold(scope.ngModel.ruleProviderAlias)).then(function (scaffold) {
                            return scaffold.settingDefinitions;
                        });
                    },
                    settings: scope.ngModel.settings
                },
                submit: function (settings) {

                    // NB: If you edit this, be sure to also edit the settingsEditorOptions in the
                    // group directive above

                    // Map settings back to ngModel
                    Object.keys(settings).forEach(function (key) {
                        scope.ngModel.settings[key] = settings[key];
                    });

                    // Regenerate the label model
                    generateLabelModel();

                    // Close the dialog
                    editorService.closeAll();

                },
                close: function () {
                    editorService.closeAll();
                }
            };

            scope.editRule = function () {
                editorService.open(settingsEditorDialogOptions);
            };

            scope.deleteRule = function () {
                if (scope.level > 0) {
                    // We can't delete ourselves so we emit an event for the parent group to do it
                    scope.$emit("deleteRuleBuilderItem", { level: scope.level, index: scope.index });
                }
            };

            scope.$on("editRuleBuilderItem", function (evt, data) {
                if (data.level === scope.level && data.index === scope.index) {
                    scope.editRule();
                }
            });

            vendrRouteCache.get("discountRuleProviderDefs").then(function (defs) {

                scope.discountRuleDefinition = defs.find((el) => el.alias == scope.ngModel.ruleProviderAlias);

                scope.labelView = scope.discountRuleDefinition.labelView.endsWith(".html")
                    ? scope.discountRuleDefinition.labelView
                    : "/app_plugins/vendr/views/discount/rules/labelViews/" + scope.discountRuleDefinition.labelView + ".html";

                settingsEditorDialogOptions.config.name = "Edit " + scope.discountRuleDefinition.name;

                generateLabelModel();

            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div>
                <div class="vendr-rule-builder__rule" ng-if="discountRuleDefinition">
                    <div class="vendr-split">
                        <div class="flex items-center">
                            <span class="px-10 -ml-5 cursor-move handle handle--{{level - 1}}" ng-if="level > 0" title="Move Rule" aria-hidden="true"><i class="fa fa-ellipsis-v"></i></span>
                            <button type="button" ng-click="editRule()" class="btn-reset strong pr-5" title="Edit Rule">
                                <vendr-scoped-include view="labelView" model="labelModel" ng-if="labelView"></vendr-scoped-include>
                            </button>
                        </div>
                        <div class="flex items-center">
                            <button type="button" ng-click="editRule()" class="vendr-inline-button mr-5" title="Edit Rule" aria-hidden="true"><i class="fa fa-pencil"></i></button>
                            <button type="button" ng-click="deleteRule()" class="vendr-inline-button" ng-if="level > 0"  title="Remove Rule" aria-hidden="true"><i class="fa fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>`,
            scope: {
                ngModel: '=',
                level: '=',
                index: '='
            },
            link: link
        };

        return directive;
    };

    angular.module('vendr.directives').directive('vendrRuleBuilderRule', vendrRuleBuilderRule);

}());
(function () {

    'use strict';

    function vendrScopedInclude() {

        var directive = {
            restrict: 'E',
            replace: true,
            template: '<ng-include src="view"></ng-include>',
            scope: {
                view: '=',
                model: '='
            }
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrScopedInclude', vendrScopedInclude);

}());
(function () {

    'use strict';

    function vendrTableController($interpolate, $sce, iconHelper) {

        var vm = this;

        vm.clickItem = function (item, $index, $event) {
            if (vm.onClick && !($event.metaKey || $event.ctrlKey)) {
                vm.onClick({ item: item, $index: $index, $event: $event });
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
        template:'<div><div class="vendr-table umb-table" ng-if="vm.items"><div class="umb-table-head"><div class="umb-table-row"><div class="umb-table-cell vendr-table-cell"><a style="text-decoration: none;" ng-show="vm.allowSelectAll" ng-click="vm.selectAll()"><umb-checkmark checked="vm.isSelectedAll()" size="xs"></umb-checkmark></a></div><div class="umb-table-cell vendr-table-cell umb-table__name"><button type="button" class="btn-reset umb-table-head__link" ng-click="vm.sort(\'Name\', vm.allowSorting, true)" ng-class="{ \'sortable\': vm.allowSorting }" ng-attr-title="{{ vm.allowSorting ? \'Sort by Name\' : \'\' }}"><span>{{ vm.itemProperties.length > 0 && vm.itemProperties[0].alias == \'name\' && vm.itemProperties[0].header ? vm.itemProperties[0].header : \'Name\' }}</span> <i class="umb-table-head__icon icon" aria-hidden="true" ng-class="{\'icon-navigation-up\': vm.isSortDirection(\'Name\', \'asc\'), \'icon-navigation-down\': vm.isSortDirection(\'Name\', \'desc\')}" ng-if="vm.allowSorting"></i></button></div><div class="umb-table-cell vendr-table-cell vendr-table-cell--{{column.align}} vendr-table-cell--{{column.alias}}" ng-repeat="column in vm.itemProperties track by column.alias" ng-if="column.alias != \'name\'"><button type="button" class="btn-reset umb-table-head__link" ng-click="vm.sort(column.alias, vm.allowSorting && column.allowSorting, column.isSystem)" ng-class="{\'sortable\': column.allowSorting}" ng-attr-title="{{ vm.allowSorting && column.allowSorting ? \'Sort by \' + column.header : \'\' }}"><span ng-bind="column.header"></span> <i class="umb-table-head__icon icon" aria-hidden="true" ng-class="{\'icon-navigation-up\': vm.isSortDirection(column.alias, \'asc\'), \'icon-navigation-down\': vm.isSortDirection(column.alias, \'desc\')}" ng-if="vm.allowSorting"></i></button></div></div></div><div class="umb-table-body"><div class="umb-table-row -selectable" ng-repeat="item in vm.items track by $index" ng-class="{ \'-selected\' : item.selected }" ng-click="vm.selectItem(item, $index, $event)"><div class="umb-table-cell vendr-table-cell"><i class="umb-table-body__icon umb-table-body__fileicon {{item.icon}}" aria-hidden="true" ng-class="vm.getIcon(item)"></i> <i class="umb-table-body__icon umb-table-body__checkicon icon-check" aria-hidden="true"></i></div><div class="umb-table-cell vendr-table-cell umb-table__name"><a title="{{ item.name }}" class="umb-table-body__link" ng-href="{{\'#\' + item.editPath}}" ng-click="vm.clickItem(item, $index, $event)"><span ng-if="vm.itemProperties.length > 0 && vm.itemProperties[0].alias == \'name\'"><span ng-attr-data-placeholder="{{vm.itemProperties[0].placeholder}}" ng-if="vm.itemProperties[0].template && !vm.itemProperties[0].refScope" ng-bind-html="vm.renderTemplate(vm.itemProperties[0].template, item)" class="vendr-table-cell__value"></span> <span ng-attr-data-placeholder="{{vm.itemProperties[0].placeholder}}" ng-if="vm.itemProperties[0].template && vm.itemProperties[0].refScope" vendr-compile template="vm.itemProperties[0].template" model="item" ref-scope="vm.itemProperties[0].refScope" class="vendr-table-cell__value"></span> <span ng-attr-data-placeholder="{{vm.itemProperties[0].placeholder}}" ng-if="!vm.itemProperties[0].template && vm.itemProperties[0].getter" ng-bind="vm.itemProperties[0].getter(item)" class="vendr-table-cell__value"></span> <span ng-attr-data-placeholder="{{vm.itemProperties[0].placeholder}}" ng-if="!vm.itemProperties[0].template && !vm.itemProperties[0].getter" ng-bind="item.name" class="vendr-table-cell__value"></span></span> <span ng-if="vm.itemProperties.length == 0 || vm.itemProperties[0].alias != \'name\'">{{item.name}}</span></a></div><div class="umb-table-cell vendr-table-cell vendr-table-cell--{{column.align}} vendr-table-cell--{{column.alias}}" ng-repeat="column in vm.itemProperties track by column.alias" ng-if="column.alias != \'name\'"><span title="{{column.header}}: {{item[column.alias]}}" ng-attr-data-placeholder="vm.itemProperties[0].placeholder"><span ng-attr-data-placeholder="{{column.placeholder}}" ng-if="column.template && !column.refScope" ng-bind-html="vm.renderTemplate(column.template, item)" class="vendr-table-cell__value"></span> <span ng-attr-data-placeholder="{{column.placeholder}}" ng-if="column.template && column.refScope" vendr-compile template="column.template" model="item" ref-scope="column.refScope" class="vendr-table-cell__value"></span> <span ng-attr-data-placeholder="{{column.placeholder}}" ng-if="!column.template && column.getter" ng-bind="column.getter(item)" class="vendr-table-cell__value"></span> <span ng-attr-data-placeholder="{{column.placeholder}}" ng-if="!column.template && !column.getter" ng-bind="item[column.alias]" class="vendr-table-cell__value"></span></span></div></div></div></div><umb-empty-state ng-hide="vm.items" position="center"><localize key="content_listViewNoItems">There are no items show in the list.</localize></umb-empty-state></div>',
        controller: vendrTableController,
        controllerAs: 'vm',
        bindings: {
            items: '<',
            itemProperties: '<',
            allowSelectAll: '<',
            allowSorting: '<',
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

            scope.options = {
                filterTerm: '',
                filteredItems: scope.items || [],
                orderBy: "name",
                orderDirection: "asc",
                bulkActionsAllowed: scope.bulkActions && scope.bulkActions.length > 0,
                allowSorting: scope.allowSorting
            };

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

            scope.loadItems = function () {
                scope.loading = true;
                scope.clearSelection();
                scope.onLoadItems({
                    searchTerm: scope.options.filterTerm,
                    pageNumber: scope.pagination.pageNumber,
                    pageSize: scope.pagination.pageSize,
                    orderBy: scope.options.orderBy,
                    orderDirection: scope.options.orderDirection
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

        }

        var directive = {
            restrict: 'E',
            replace: true,
            template:'<div class="vendr"><div class="umb-property-editor umb-listview"><umb-editor-sub-header ng-class="{\'--state-selection\':(selection.length > 0)}"><umb-editor-sub-header-content-left><umb-editor-sub-header-section ng-if="(createActions && createActions.length > 0 && (selection.length == 0))"><div class="btn-group" ng-show="createActions.length == 1"><button type="button" class="btn btn-outline umb-outline" ng-click="createActions[0].doAction()"><i class="{{createActions[0].icon}}" aria-hidden="true"></i> {{createActions[0].name}}</button></div><div class="btn-group" ng-show="createActions.length > 1"><button type="button" class="btn btn-outline umb-outline dropdown-toggle" data-toggle="dropdown"><span ng-click="createActions[0].doAction()"><i class="{{createActions[0].icon}}" aria-hidden="true"></i> {{createActions[0].name}}</span> <span class="caret" ng-click="page.createDropdownOpen = !page.createDropdownOpen"></span></button><umb-dropdown ng-if="page.createDropdownOpen" on-close="page.createDropdownOpen = false"><umb-dropdown-item ng-repeat="createAction in createActions" ng-if="$index > 0"><a ng-click="createAction.doAction()"><i class="{{createAction.icon}}" aria-hidden="true"></i> {{createAction.name}}</a></umb-dropdown-item></umb-dropdown></div></umb-editor-sub-header-section><vendr-filter ng-repeat="fltr in filters track by fltr.alias" ng-show="!selection || selection.length == 0" filter="fltr" on-change="doFilter()"></vendr-filter><umb-editor-sub-header-section ng-show="(selection.length > 0)"><umb-button type="button" label="Clear selection" label-key="buttons_clearSelection" button-style="white" action="clearSelection()" disabled="bulkActionInProgress"></umb-button></umb-editor-sub-header-section><umb-editor-sub-header-section ng-show="(selection.length > 0)"><strong ng-show="!bulkActionInProgress">{{ selection.length }}&nbsp;<localize key="general_of">of</localize>&nbsp;{{ options.filteredItems.length }}&nbsp;<localize key="general_selected">items selected</localize></strong> <strong ng-show="bulkActionInProgress" ng-bind="bulkActionStatus"></strong><umb-loader position="bottom" ng-show="bulkActionInProgress"></umb-loader></umb-editor-sub-header-section></umb-editor-sub-header-content-left><umb-editor-sub-header-content-right><umb-editor-sub-header-section ng-show="(selection.length == 0)"><div class="form-search -no-margin-bottom pull-right" novalidate><div class="inner-addon left-addon"><i class="icon icon-search" ng-click="doFilter()" aria-hidden="true"></i> <input class="form-control search-input" type="text" localize="placeholder" placeholder="@general_typeToSearch" ng-model="options.filterTerm" ng-change="doFilter()" ng-keydown="doFilter()" prevent-enter-submit no-dirty-check></div></div></umb-editor-sub-header-section><umb-editor-sub-header-section ng-show="(selection.length > 0) && (options.bulkActionsAllowed)"><umb-button ng-repeat="bulkAction in bulkActions" type="button" button-style="white" label="{{ bulkAction.name }}" icon="{{ bulkAction.icon }}" action="doBulkAction(bulkAction)" disabled="bulkActionInProgress" size="xs" add-ellipsis="true"></umb-button></umb-editor-sub-header-section></umb-editor-sub-header-content-right></umb-editor-sub-header><div ng-if="!loading"><vendr-table ng-if="options.filteredItems && options.filteredItems.length > 0" items="options.filteredItems" allow-select-all="options.bulkActionsAllowed" allow-sorting="options.allowSorting" item-properties="itemProperties" on-select="selectItem(item, $index, $event)" on-click="itemClick(item, $index, $event)" on-select-all="selectAll($event)" on-selected-all="areAllSelected()" on-sorting-direction="setSortDirection(col, direction)" on-sort="sortItems(field, allow, isSystem)"></vendr-table><umb-empty-state ng-if="!options.filteredItems || options.filteredItems.length === 0" position="center"><div>No items found</div></umb-empty-state></div><umb-load-indicator ng-show="loading"></umb-load-indicator><div class="flex justify-center" ng-show="!loading && paginated && pagination.totalPages"><umb-pagination page-number="pagination.pageNumber" total-pages="pagination.totalPages" on-next="goToPage" on-prev="goToPage" on-go-to-page="goToPage"></umb-pagination><vendr-page-size page-sizes="[30,75,150,300,600]" page-size="pagination.pageSize" on-change="setPageSize(pageSize)"></vendr-page-size></div></div></div>',
            scope: {
                loading: "<",
                createActions: "<",
                bulkActions: "<",
                filters: "<",
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
            template:'<div class="vendr-toggle"><umb-toggle checked="checked" on-click="toggle()"></umb-toggle><div class="vendr-toggle__content" ng-click="toggle()"><div>{{ name }}</div><div class="vendr-toggle__description">{{ description }}</div></div><div class="vendr-toggle__action" ng-if="checkedActionLabel && onCheckedAction && checked"><button type="button" class="vendr-toggle__action-btn btn btn-info" ng-click="onCheckedAction()">{{ checkedActionLabel }}</button></div></div>',
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
            template:'<div class="vendr-toggle-list"><vendr-toggle name="\'All\'" checked="allChecked" ng-if="toggleAll"></vendr-toggle><vendr-toggle ng-repeat-start="item in ngModel" checked="item.checked" name="item.name" description="item.description" checked-action-label="checkedActionLabel" on-checked-action="onCheckedAction(item)"></vendr-toggle><vendr-toggle ng-repeat="item2 in item[itemsKey || \'items\']" ng-if="item.checked" checked="item2.checked" name="item2.name" description="item2.description" checked-action-label="checkedActionLabel" on-checked-action="onCheckedAction(item2)" class="vendr-toggle--indented" ng-repeat-end></vendr-toggle></div>',
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
