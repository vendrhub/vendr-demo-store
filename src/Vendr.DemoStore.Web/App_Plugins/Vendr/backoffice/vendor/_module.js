(function () {

    'use strict';

    // Inject modules into Umbraco APP
    angular.module('umbraco').requires.push('ngSanitize');
    angular.module('umbraco').requires.push('autoCompleteModule');
    angular.module('umbraco').requires.push('ng-currency');
    angular.module('umbraco').requires.push('ngPatternRestrict');

}());