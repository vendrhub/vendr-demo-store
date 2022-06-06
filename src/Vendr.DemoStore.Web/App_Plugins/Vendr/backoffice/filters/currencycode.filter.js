(function () {

    'use strict';

    // Cache for node names so we don't make a ton of requests
    var vendrCurrencyCodeCache = {
        id: "",
        keys: {}
    };

    function currencyCode(editorState, vendrCurrencyResource, vendrRouteCache) {

        function filter(curencyId) {

            // Check we have a value at all
            if (curencyId === "" || curencyId.toString() === "0") {
                return "";
            }

            var currentNode = editorState.getCurrent();

            // Ensure a unique cache per editor instance
            var key = "vendrCurrencyCode_" + (currentNode.key || currentNode.id);
            if (vendrCurrencyCodeCache.id !== key) {
                vendrCurrencyCodeCache.id = key;
                vendrCurrencyCodeCache.keys = {};
            }

            // See if there is a value in the cache and use that
            if (vendrCurrencyCodeCache.keys.hasOwnProperty(curencyId)) {
                return vendrCurrencyCodeCache.keys[curencyId];
            }
            else
            {
                // No value, so go fetch one 
                // We'll put a temp value in the cache though so we don't 
                // make a load of requests while we wait for a response
                vendrCurrencyCodeCache.keys[curencyId] = "Loading...";

                vendrRouteCache.getOrFetch("store_" + currentNode.storeId + "_currencies",
                    () => vendrCurrencyResource.getCurrencies(currentNode.storeId)).then(function (currencies) {
                    vendrCurrencyCodeCache.keys = currencies.reduce(function (map, currency) {
                        map[currency.id] = currency.code;
                        return map;
                    }, {});
                });

                return vendrCurrencyCodeCache.keys[curencyId];

            }

        };

        filter.$stateful = true;

        return filter;

    }

    angular.module('vendr.filters').filter('vendrCurrencyCode', currencyCode);

}());