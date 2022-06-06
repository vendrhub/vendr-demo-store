(function () {

    'use strict';

    // Create Vendr.directives module
    angular.module('vendr.directives', [
        'umbraco.directives'
    ]);

    // Inject module into Umbraco APP
    angular.module('umbraco').requires.push('vendr.directives');

}());