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