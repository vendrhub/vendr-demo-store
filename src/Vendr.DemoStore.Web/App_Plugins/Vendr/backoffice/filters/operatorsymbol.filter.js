(function () {

    'use strict';

    function operatorSymbol() {

        var operatorMap = {
            Equal: "=",
            GreaterThan: ">",
            GreaterThanOrEqual: ">=",
            LessThan: "<",
            LessThanOrEqual: "<=",
            NotEqual: "!="
        };

        return function (symbolName) {
            return operatorMap[symbolName] || "?";
        };

    }

    angular.module('vendr.filters').filter('vendrOperatorSymbol', operatorSymbol);

}());