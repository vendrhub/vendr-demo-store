(function () {

    'use strict';

    function VariantsEditorController($scope, $routeParams, $element, angularHelper, eventsService, vendrVariantsEditorState)
    {
        var vm = this;

        var isDocTypeEditorPreview = $routeParams.section == "settings" && $routeParams.tree == "documentTypes";

        var init = function () {

            // Ensure model has a baseline value
            if (typeof vm.model.value !== 'object' || vm.model.value === null) {
                vm.model.value = {};
            }

            // Ensure we have an umbVariantContent
            if (vm.umbProperty && !vm.umbVariantContent)
            {
                // not found, then fallback to searching the scope chain, this may be needed when DOM inheritance isn't maintained but scope
                // inheritance is (i.e.infinite editing)
                var found = angularHelper.traverseScopeChain($scope, s => s && s.vm && s.vm.constructor.name === "umbVariantContentController");
                vm.umbVariantContent = found ? found.vm : null;
                if (!vm.umbVariantContent) {
                    throw "Could not find umbVariantContent in the $scope chain";
                }
            }

            // If the prop editor value changes on the server, we'll need to raise an event
            // so our content app can be notified
            vm.model.onValueChanged = function (newVal) {

                // We need to ensure that the property model value is an object, this is needed for modelObject to recive a reference and keep that updated.
                if (typeof newVal !== 'object' || newVal === null) {
                    vm.model.value = newVal = {};
                }

                eventsService.emit("variantsEditor.modelValueChanged", { value: newVal });

            }

            // For some reason the block list API needs to know the scope of existance
            // so we work this out now to pass to the variants editor state object
            var scopeOfExistence = $scope;
            if (vm.umbVariantContentEditors && vm.umbVariantContentEditors.getScope) {
                scopeOfExistence = vm.umbVariantContentEditors.getScope();
            } else if (vm.umbElementEditorContent && vm.umbElementEditorContent.getScope) {
                scopeOfExistence = vm.umbElementEditorContent.getScope();
            }

            // We don't actually do anything in the property editor itself,
            // instead we register the current model with the variants editor
            // state service such that the variants content app can gain access
            // to it, then we leave it to the content app to do everything.
            vendrVariantsEditorState.set({
                model: vm.model,
                propertyForm: vm.propertyForm,
                umbProperty: vm.umbProperty,
                umbVariantContent: vm.umbVariantContent,
                umbVariantContentEditors: vm.umbVariantContentEditors,
                umbElementEditorContent: vm.umbElementEditorContent,
                scope: $scope,
                scopeOfExistence: scopeOfExistence,
            });

        };

        vm.$onInit = function () {
            if (!isDocTypeEditorPreview) {
                init();
            }
        }

        $scope.$on("$destroy", function () {
            vendrVariantsEditorState.reset();
        });
    }

    angular
        .module("vendr")
        .component("vendrVariantsEditor", {
            template: "<div></div>",
            controller: VariantsEditorController,
            controllerAs: "vm",
            bindings: {
                model: "="
            },
            require: {
                propertyForm: "^form",
                umbProperty: "?^umbProperty",
                umbVariantContent: '?^^umbVariantContent',
                umbVariantContentEditors: '?^^umbVariantContentEditors',
                umbElementEditorContent: '?^^umbElementEditorContent'
            }
        });

    // angular.module('vendr').controller('Vendr.Controllers.VariantsEditorController', VariantsEditorController);

}());