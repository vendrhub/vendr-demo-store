(function () {

    'use strict';

    // Create Vendr.resources module
    angular.module('vendr.resources', [
        'umbraco.resources'
    ]);

    // Inject module into Umbraco APP
    angular.module('umbraco').requires.push('vendr.resources');

}());