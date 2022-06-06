(function () {

    'use strict';

    // Create Vendr module
    angular.module('vendr', [
        'umbraco.resources',
        'vendr.interceptors',
        'vendr.decorators',
        'vendr.filters'
    ]);

    // Inject module into Umbraco APP
    angular.module('umbraco').requires.push('vendr');

}());