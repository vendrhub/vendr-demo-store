(function () {

    'use strict';

    function groupBy($parse) {
        return _.memoize(function (items, field) {
            var getter = $parse(field);
            return _.groupBy(items, function (item) {
                return getter(item);
            }, function (items, field) {
                return items.length + field;
            });
        });
    }

    angular.module('vendr.filters').filter('vendrGroupBy', groupBy);

}());