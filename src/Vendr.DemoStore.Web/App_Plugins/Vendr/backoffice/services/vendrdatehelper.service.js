(function () {

    'use strict';

    function vendrDateHelper() {

        function treatAsUTC(date) {
            var result = new Date(date);
            result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
            return result;
        }

        function daysBetween(startDate, endDate) {
            var millisecondsPerDay = 24 * 60 * 60 * 1000;
            return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
        }

        var api = {

            getISODateString: function (date) {
                return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                    .toISOString()
                    .split("T")[0];
            },

            getLocalTimezoneOffset: function () {
                return -(new Date().getTimezoneOffset()); // Invert the offset for ISO8601
            },

            getToday: function () {
                var now = new Date();
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            },

            getDaysBetween: function (from, to, inclusive) {
                var days = daysBetween(from, to);
                return days + (inclusive ? 1 : 0);
            },

            getNamedDateRanges: function () {

                var today = api.getToday();

                return [
                    {
                        name: "Last 7 days",
                        alias: "last7",
                        range: [today.addDays(-6), today],
                        prevPeriod: [today.addDays(-13), today.addDays(-7)],
                        prevYear: [today.addDays(-6).addYears(-1), today.addYears(-1)]
                    },
                    {
                        name: "Last 30 days",
                        alias: "last30",
                        range: [today.addDays(-29), today],
                        prevPeriod: [today.addDays(-59), today.addDays(-30)],
                        prevYear: [today.addDays(-29).addYears(-1), today.addYears(-1)]
                    },
                    {
                        name: "This Month",
                        alias: "thisMonth",
                        range: [new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth() + 1, 1).addDays(-1)],
                        prevPeriod: [new Date(today.getFullYear(), today.getMonth(), 1).addMonths(-1), new Date(today.getFullYear(), today.getMonth(), 1).addDays(-1)],
                        prevYear: [new Date(today.getFullYear(), today.getMonth(), 1).addYears(-1), new Date(today.getFullYear(), today.getMonth() + 1, 1).addDays(-1).addYears(-1)]
                    },
                    {
                        name: "Last Month",
                        alias: "lastMonth",
                        range: [new Date(today.getFullYear(), today.getMonth() - 1, 1), new Date(today.getFullYear(), today.getMonth(), 1).addDays(-1)],
                        prevPeriod: [new Date(today.getFullYear(), today.getMonth() - 2, 1), new Date(today.getFullYear(), today.getMonth() - 1, 1).addDays(-1)],
                        prevYear: [new Date(today.getFullYear(), today.getMonth() - 1, 1).addYears(-1), new Date(today.getFullYear(), today.getMonth(), 1).addDays(-1).addYears(-1)]
                    }
                ];

            },

            formatDateRange: function (range) {
                var str = range[0].toLocaleString('default', { month: 'short' }) + " " + range[0].getDate();
                if (range[0].getFullYear() != range[1].getFullYear()) {
                    str += ", " + range[0].getFullYear();
                }
                str += " - ";
                str += range[1].toLocaleString('default', { month: 'short' }) + " " + range[1].getDate() + ", " + range[1].getFullYear();
                return str;
            },

        };

        return api;

    };

    angular.module('vendr.services').factory('vendrDateHelper', vendrDateHelper);

}());