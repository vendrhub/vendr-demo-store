(function () {

    'use strict';

    function splitCamelCase() {

        return function (input) {

            if (typeof input !== "string") {
                return input;
            }

            return input
                .replace(/([A-Z])/g, (match) => ` ${match}`)
                .replace(/^./, (match) => match.toUpperCase())
                .trim();
        };

    }

    angular.module('vendr.filters').filter('vendrSplitCamelCase', splitCamelCase);

}());