(function () {

    'use strict';

    // Create Vendr.services module
    angular.module('vendr.services', [
        'umbraco.services',
        'umbraco.resources'
    ]);

    // Inject module into Umbraco APP
    angular.module('umbraco').requires.push('vendr.services');

}());