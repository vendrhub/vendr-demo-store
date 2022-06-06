(function () {

    'use strict';

    function vendrAutoSizeIframe() {

        function link(scope, element, attrs) {

            element.on('load', function () {

                var iFrameHeight = element[0].contentWindow.document.body.scrollHeight + 'px';
                var iFrameWidth = '100%';

                element.css('width', iFrameWidth);
                element.css('height', iFrameHeight);

            });
        }

        var directive = {
            restrict: 'A',
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrAutoSizeIframe', vendrAutoSizeIframe);

}());