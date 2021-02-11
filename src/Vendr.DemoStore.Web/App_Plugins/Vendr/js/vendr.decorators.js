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
//(function () {

//    'use strict';

//    function listViewDecorator($delegate, $location) {

//        return function (constructor, locals) {

//            var ctrl = $delegate.apply(null, arguments);

//            // The core list view controls have hard coded approaches to what happens when you
//            // click to navigate to an item expecting a specific url structure. Unfortunately,
//            // for any third party package, this structure is unlikely to match so to compensate
//            // we decorate the controllers and allow passing in an editPath on the list view items

//            if (locals.$attrs && locals.$attrs.ngController) {

//                // Override Umbraco.PropertyEditors.ListView.ListLayoutController.clickItem method
//                if (locals.$attrs.ngController.match(/^Umbraco\.PropertyEditors\.ListView\.ListLayoutController\b/i)) {

//                    return angular.extend(function () {
//                        var ctrlInst = ctrl();
//                        var baseClickItem = ctrlInst.clickItem;
//                        ctrlInst.clickItem = function (item) {
//                            if (item.editPath) {
//                                $location.url(item.editPath);
//                            } else {
//                                baseClickItem(item);
//                            }
//                        };
//                        return ctrlInst;
//                    }, ctrl);

//                }

//                // Override Umbraco.PropertyEditors.ListView.GridLayoutController.goToItem method
//                if (locals.$attrs.ngController.match(/^Umbraco\.PropertyEditors\.ListView\.GridLayoutController\b/i)) {

//                    return angular.extend(function () {
//                        var ctrlInst = ctrl();
//                        var baseGoToItem = ctrl.goToItem;
//                        ctrl.goToItem = function (item) {
//                            if (item.editPath) {
//                                $location.url(item.editPath);
//                            } else {
//                                baseGoToItem(item);
//                            }
//                        };
//                        return ctrlInst;
//                    }, ctrl);
                    
//                }

//            }

//            return ctrl;

//        };

//    }

//    angular.module('vendr.decorators').decorator('$controller', listViewDecorator);

//}());
