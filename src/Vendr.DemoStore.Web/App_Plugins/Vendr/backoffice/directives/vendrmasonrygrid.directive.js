(function () {

    'use strict';

    function vendrMasonryGrid($rootScope, $timeout, assetsService) {

        function link(scope, el, attr, ctrl)
        {
            var masonry = null;

            var cfg = {
                container: '#vendr-masonry-grid-' + scope.$id
            };

            if (scope.vendrMasonryGrid) {
                cfg = Object.assign(cfg, scope.vendrMasonryGrid)
            }

            $timeout(function () { // Give angular time to do it's firt render of child items
                masonry = new MiniMasonry(cfg);
            }, 1);

            $rootScope.$on('vendrMasonryGridChanged', function () {
                if (masonry) {
                    masonry.layout();
                }
            });
        }

        var directive = {
            restrict: 'A',
            replace: true,
            transclude: true,
            link: link,
            template: `<div id="vendr-masonry-grid-{{$id}}" ng-transclude></div>`,
            scope: {
                vendrMasonryGrid: '='
            }
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrMasonryGrid', vendrMasonryGrid);

}());