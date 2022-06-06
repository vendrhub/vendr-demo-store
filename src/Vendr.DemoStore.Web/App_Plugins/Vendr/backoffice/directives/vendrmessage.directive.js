(function () {

    'use strict';

    function vendrMessage() {

        function link(scope, el, attr, ctrl) { }

        var directive = {
            restrict: 'E',
            transclude: true,
            replace: true,
            templateUrl: '/App_Plugins/Vendr/backoffice/views/directives/vendr-message.html',
            scope: {
                heading: '<',
                type: '<',
                icon: '<'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrMessage', vendrMessage);

}());