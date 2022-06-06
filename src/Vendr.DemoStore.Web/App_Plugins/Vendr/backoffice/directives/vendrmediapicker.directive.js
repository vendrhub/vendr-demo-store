(function () {

    'use strict';

    function vendrMediaPicker($routeParams, listViewHelper, angularHelper) {

        function link(scope, el, attr, ctrl) {

            scope.mediaPickerModel = {
                view: 'mediapicker',
                config: {
                    idType: 'udi',
                    multiPicker: scope.multiPicker,
                    onlyImages: scope.onlyImages,
                    disableFolderSelect: scope.disableFolderSelect
                }
            };

            // Proxy the value property to our ngModel property
            Object.defineProperty(scope.mediaPickerModel, "value", {
                get: function () {
                    return scope.ngModel;
                },
                set: function (value) {
                    scope.ngModel = value;
                }
            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: '<div><umb-property-editor model="mediaPickerModel" ng-if="mediaPickerModel"></umb-property-editor></div>',
            scope: {
                ngModel: '=',
                multiPicker: '<',
                onlyImages: '<',
                disableFolderSelect: '<'
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrMediaPicker', vendrMediaPicker);

}());