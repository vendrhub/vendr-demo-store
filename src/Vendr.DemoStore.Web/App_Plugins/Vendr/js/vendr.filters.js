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
(function () {

    'use strict';

    // Cache for node names so we don't make a ton of requests
    var vendrEntityNameCache = {
        id: "",
        keys: new Map()
    };

    function entityName(editorState, vendrEntityResource, vendrRouteCache) {

        function filter(entityId, entityType) {

            // Check we have a value at all
            if (entityId === "" || entityId.toString() === "0") {
                return "";
            }

            var currentNode = editorState.getCurrent();

            // Ensure a unique cache per editor instance
            var key = "vendrEntityName_" + (currentNode.key || currentNode.id);
            if (vendrEntityNameCache.id !== key) {
                vendrEntityNameCache.id = key;
                vendrEntityNameCache.keys.clear();
            }

            // See if there is a value in the cache and use that
            if (vendrEntityNameCache.keys.has(entityId)) {
                return vendrEntityNameCache.keys.get(entityId);
            }
            else
            {
                // No value, so go fetch one 
                // We'll put a temp value in the cache though so we don't 
                // make a load of requests while we wait for a response
                vendrEntityNameCache.keys.set(entityId, "Loading...");

                vendrRouteCache.getOrFetch("entity_" + entityType + "_" + entityId,
                    () => vendrEntityResource.getEntity(entityType, entityId)).then(function (entity) {
                    vendrEntityNameCache.keys.set(entity.id, entity.name);
                });

                return vendrEntityNameCache.keys.get(entityId);

            }

        };

        filter.$stateful = true;

        return filter;

    }

    angular.module('vendr.filters').filter('vendrEntityName', entityName);

}());
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
(function () {

    'use strict';

    // Cache for node names so we don't make a ton of requests
    var vendrNodeNameCache = {
        id: "",
        keys: new Map()
    };

    function nodeName(editorState, entityResource, vendrRouteCache) {

        function filter(input) {

            // Check we have a value at all
            if (input === "" || input.toString() === "0") {
                return "";
            }

            var currentNode = editorState.getCurrent();

            // Ensure a unique cache per editor instance
            var key = "vendrNodeName_" + (currentNode.key || currentNode.id);
            if (vendrNodeNameCache.id !== key) {
                vendrNodeNameCache.id = key;
                vendrNodeNameCache.keys.clear();
            }

            // MNTP values are comma separated IDs. We'll only fetch the first one for the NC header.
            var ids = input.split(',');
            var lookupId = ids[0];

            // See if there is a value in the cache and use that
            if (vendrNodeNameCache.keys.has(lookupId)) {
                return vendrNodeNameCache.keys.get(lookupId);
            }

            // No value, so go fetch one 
            // We'll put a temp value in the cache though so we don't 
            // make a load of requests while we wait for a response
            vendrNodeNameCache.keys.set(lookupId, "Loading...");

            var type = lookupId.indexOf("umb://media/") === 0
                ? "Media"
                : lookupId.indexOf("umb://member/") === 0
                    ? "Member"
                    : "Document";

            vendrRouteCache.getOrFetch("umbracoEntity_" + type + "_" + lookupId,
                () => entityResource.getById(lookupId, type)).then(function (ent) {
                        vendrNodeNameCache.keys.set(lookupId, ent.name);
                });

            return vendrNodeNameCache.keys.get(lookupId);

        }

        filter.$stateful = true;

        return filter;
    }

    angular.module('vendr.filters').filter('vendrNodeName', nodeName);

}());
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
