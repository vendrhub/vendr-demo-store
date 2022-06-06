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