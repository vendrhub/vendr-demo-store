(function () {

    'use strict';

    function vendrIdLabel() {

        function link(scope, el, attr, ctrl) {
            scope.emptyGuid = "00000000-0000-0000-0000-000000000000";
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div>
                <div ng-if="value == emptyGuid"><umb-badge size="xs">Unsaved</umb-badge></div>
                <div ng-if="value != emptyGuid" > {{ value }}</div >
            </div>`,
            scope: {
                value: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrIdLabel', vendrIdLabel);

}());