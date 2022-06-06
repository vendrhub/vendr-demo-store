(function () {

    'use strict';

    function SettingsEditorDialogController($scope, formHelper)
    {
        var cfg = $scope.model.config;

        var vm = this;

        vm.loading = true;

        vm.page = {};
        vm.page.name = cfg.name;
        vm.page.saveButtonState = 'init';

        vm.settings = angular.copy(cfg.settings);
        vm.options = {
            settingDefinitions: []
        };

        vm.init = function () {
            cfg.loadSettingDefinitions().then(function (settingDefinitions) {

                var defs = settingDefinitions.map((itm) => angular.copy(itm));

                // Remap setting definitions into an Umbraco property model
                defs.forEach(function (itm) {

                    itm.alias = itm.key;
                    itm.label = itm.name;

                    Object.defineProperty(itm, "value", {
                        get: function () {
                            return vm.settings[itm.alias];
                        },
                        set: function (value) {
                            vm.settings[itm.alias] = value;
                        }
                    });

                });

                vm.options.settingDefinitions = defs;

                vm.loading = false;
            });
        };

        vm.save = function () {
            if (formHelper.submitForm({ scope: $scope })) {
                $scope.model.submit(vm.settings);
            }
        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.SettingsEditorDialogController', SettingsEditorDialogController);

}());