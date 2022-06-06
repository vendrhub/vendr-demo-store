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