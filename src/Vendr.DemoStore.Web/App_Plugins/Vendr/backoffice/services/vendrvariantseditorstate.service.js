(function () {

    'use strict';

    function vendrVariantsEditorState($rootScope, eventsService) {

        var current = null;

        var api = {

            set: function (state) {
                current = state;
                eventsService.emit("variantsEditorState.changed", { state: state });
            },

            reset: function () {
                current = null;
            },

            getCurrent: function () {
                return current;
            }

        };

        $rootScope.$on('$routeChangeSuccess', () => api.reset());

        return api;
    };

    angular.module('vendr.services').factory('vendrVariantsEditorState', vendrVariantsEditorState);

}());