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
            view: '/App_Plugins/Vendr/backoffice/views/analytics/dialogs/timeframe.html',
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