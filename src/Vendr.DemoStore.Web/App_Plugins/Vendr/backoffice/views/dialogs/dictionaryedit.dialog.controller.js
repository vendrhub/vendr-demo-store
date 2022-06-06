(function () {

    'use strict';

    function DictionaryEditDialogController($scope, $timeout, editorState,
        notificationsService, formHelper, contentEditingHelper,
        vendrDictionaryResource, languageResource) {

        var cfg = $scope.model.config;
        var id = cfg.id;
        var create = id === '-1';

        var vm = this;

        vm.page = {};
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';

        vm.options = {};
        vm.content = {};

        vm.nameDirty = false;

        vm.init = function () {

            if (!create) {

                vendrDictionaryResource.getDictionaryItemById(id).then(function (entity) {
                    vm.ready(entity);
                });

            } else {

                var template = {
                    id: -1,
                    name: cfg.name,
                    translations: []
                };

                languageResource.getAll().then(function (languages) {
                    languages.forEach(function (itm) {
                        template.translations.push({
                            isoCode: itm.culture,
                            languageId: itm.id,
                            displayName: itm.name,
                            translation: cfg.value || ''
                        });
                    });
                });

                vm.ready(template);
            }
        };

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            //share state
            editorState.set(vm.content);
        };

        vm.save = function () {

            var doSave = function (model, nameDirty) {
                model.nameIsDirty = nameDirty;
                return vendrDictionaryResource.saveDictionaryItem(model).then(function (data) {
                        formHelper.resetForm({ scope: $scope, notifications: data.notifications });
                        vm.page.saveButtonState = "success";
                        $timeout(function () {
                            $scope.model.submit({ key: data.name });
                        }, 500);
                    },
                    function (err) {
                        vm.page.saveButtonState = "error";
                        contentEditingHelper.handleSaveError({
                            redirectOnFailure: false,
                            err: err
                        });
                        notificationsService.error(err.data.message || err.data.Message);
                    });
            };

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                // Umbraco expects dictionary items to exist before we can
                // post save, so we have to call create first
                if (create) {
                    vendrDictionaryResource.createDictionaryItem(cfg.parentId, vm.content.name).then(function (entity) {
                        vm.content.id = entity.id;
                        vm.content.key = entity.key;
                        vm.content.parentId = entity.parentId;
                        vm.nameDirty = false;
                        doSave(vm.content, vm.nameDirty);
                    });
                } else {
                    doSave(vm.content, vm.nameDirty);
                }
            }

        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();

        $scope.$watch("vm.content.name", function (newVal, oldVal) {
            //when the value changes, we need to set the name dirty
            if (newVal && (newVal !== oldVal) && typeof (oldVal) !== "undefined") {
                vm.nameDirty = true;
            }
        });
    }

    angular.module('vendr').controller('Vendr.Controllers.DictionaryEditDialogController', DictionaryEditDialogController);

}());