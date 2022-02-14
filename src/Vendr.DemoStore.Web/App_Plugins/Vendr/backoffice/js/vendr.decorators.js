(function () {

    'use strict';

    angular.module('vendr.decorators')
        .config(['$provide', function ($provide) {

            $provide.decorator('contentAppHelper', ['$delegate', function contentAppHelperDecorator($delegate) {

                // Add Vendr Variants content app to list of content based apps
                if ($delegate.CONTENT_BASED_APPS.indexOf("vendrVariants") === -1)
                    $delegate.CONTENT_BASED_APPS.push("vendrVariants");

                return $delegate;

            }]);

        }]);

}());
