(function () {

    'use strict';

    function TranslatedValueEditorDialogController($scope, editorState, formHelper, languageResource, vendrRouteCache) {

        var cfg = $scope.model.config;

        var vm = this;

        vm.page = {};
        vm.page.name = cfg.name;
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';

        vm.options = {
            languages: []
        };
        vm.content = {};

        vm.init = function () {

            vendrRouteCache.getOrFetch("languages", function () {
                return languageResource.getAll();
            })
            .then(function (languages) {
                vm.options.languages = languages;
                vm.ready(angular.copy(cfg.values || {}));
            });

        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            //share state
            editorState.set(vm.content);
        };

        vm.save = function () {
            if (formHelper.submitForm({ scope: $scope })) {
                $scope.model.submit(vm.content);
            }
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.TranslatedValueEditorDialogController', TranslatedValueEditorDialogController);

}());