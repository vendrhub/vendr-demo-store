(function () {

    'use strict';

    // Create Vendr.decorators module
    angular.module('vendr.decorators', [
        'umbraco'
    ]);

}());
(function () {

    'use strict';

    // Create Vendr.directives module
    angular.module('vendr.directives', [
        'umbraco.directives'
    ]);

    // Inject module into Umbraco APP
    angular.module('umbraco').requires.push('vendr.directives');

}());
(function () {

    'use strict';

    // Create Vendr.directives module
    angular.module('vendr.filters', [
        'umbraco.filters'
    ]);

    // Inject module into Umbraco APP
    angular.module('umbraco').requires.push('vendr.filters');

}());
(function () {

    'use strict';

    // Create Vendr.interceptors module
    angular.module('vendr.interceptors', [])
        .config(['$httpProvider', function ($httpProvider) {
            $httpProvider.interceptors.push('routeRewritesInterceptor');
            $httpProvider.interceptors.push('menuActionsInterceptor');
        }]);

}());
(function () {

    'use strict';

    // Create Vendr.resources module
    angular.module('vendr.resources', [
        'umbraco.resources'
    ]);

    // Inject module into Umbraco APP
    angular.module('umbraco').requires.push('vendr.resources');

}());
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
(function () {

    'use strict';

    // Inject modules into Umbraco APP
    angular.module('umbraco').requires.push('ngSanitize');
    angular.module('umbraco').requires.push('autoCompleteModule');
    angular.module('umbraco').requires.push('ng-currency');

}());
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
