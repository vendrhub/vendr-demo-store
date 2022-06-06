(function () {

    'use strict';

    function AnalyticsTimeframeDialogController($scope, $location, vendrDateHelper)
    {
        var vm = this;

        var currentTimeframe = $scope.model.config.currentTimeframe;

        var today = vendrDateHelper.getToday();
        var todayEod = vendrDateHelper.getToday().setHours(23, 59, 59, 999);

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
            maxDate: todayEod,
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