(function () {

    'use strict';

    function ActionsProvider() {

        var provider = this;

        provider.bulkActions = [
            ['$q', 'vendrEntityResource', function ($q, vendrEntityResource) {
                return {
                    name: 'Delete',
                    icon: 'icon-trash',
                    doAction: function (bulkItem) {
                        return vendrEntityResource.deleteEntity(bulkItem.entityType, bulkItem.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") + "?");
                    },
                    condition: function (ctx) {
                        return true;
                    }
                }
            }]
        ];

        provider.menuActions = [];

        provider.$get = ['$injector', function ($injector) {

            var compiledBulkActions = [];
            var compiledMenuActions = [];

            provider.bulkActions.forEach(function (itm, idx) {
                var compiled = $injector.invoke(itm);
                if (!compiled.sortOrder) {
                    compiled.sortOrder = (idx + 1) * 100;
                }
                compiledBulkActions.push(compiled);
            });

            provider.menuActions.forEach(function (itm) {
                compiledMenuActions.push(itm); //$injector.invoke(itm));
            });

            // We can pre-sort the bulk actions now as we have all the bulk actions
            // defined in javascript
            compiledBulkActions.sort(function (a, b) {
                return a.sortOrder < b.sortOrder ? -1 : (a.sortOrder > b.sortOrder ? 1 : 0);
            });

            // We can't pre-sort the menuActions as we combine these
            // together with the system defined menu items which we
            // capture with an interceptor

            return {
                getBulkActions: function (ctx) {
                    return compiledBulkActions.filter(function (itm) {
                        return !itm.condition || itm.condition(ctx);
                    });
                },
                getMenuActions: function (ctx) {
                    return compiledMenuActions.filter(function (itm) {
                        return !itm.condition || itm.condition(ctx);
                    });
                }
            };

        }];
    };

    angular.module('vendr').provider('vendrActions', ActionsProvider);

}());
