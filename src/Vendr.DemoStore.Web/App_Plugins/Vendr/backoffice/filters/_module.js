(function () {

    'use strict';

    // Create Vendr.directives module
    angular.module('vendr.filters', [
        'umbraco.filters'
    ]);

    // Inject module into Umbraco APP
    angular.module('umbraco').requires.push('vendr.filters');

}());