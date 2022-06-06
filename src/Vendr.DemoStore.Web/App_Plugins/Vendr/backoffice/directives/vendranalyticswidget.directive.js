(function () {

    'use strict';

    function vendrAnalyticsWidget() {

        function link(scope, el, attr, ctrl) {
            
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-analytics-widget">
    <umb-box class="mb-0">
        <umb-box-header title="{{config.name}}"><i class="fa fa-info-circle" ng-if="config.description" title="{{config.description}}"></i></umb-box-header>
        <umb-box-content class="block-form">
            <div ng-include="config.view" style="position: relative; min-height: 100px;"></div>
        </umb-box-content>
    </umb-box>
</div>`,
            scope: {
                config: '=',
                timeframe: '<'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrAnalyticsWidget', vendrAnalyticsWidget);

}());