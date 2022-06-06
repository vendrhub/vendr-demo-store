(function () {

    'use strict';

    function ElementTypePickerController($scope, editorService , elementTypeResource) {

        var vm = this;

        var dialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/dialogs/elementtypepicker.html',
            size: 'small',
            submit: function (model) {
                vm.model.value = model.id;
                vm.pickedItem = model;
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var vm = this;

        vm.model = $scope.model;
        vm.pickedItem = false;

        if (vm.model.value) {
            elementTypeResource.getAll().then(function (elementTypes) {
                var elementType = elementTypes.find(function (itm) {
                    return itm.key === vm.model.value;
                });
                if (elementType) {
                    vm.pickedItem = {
                        id: elementType.key,
                        name: elementType.name,
                        icon: elementType.icon
                    };
                }
            });
        }

        vm.openPicker = function () {
            editorService.open(dialogOptions);
        };

        vm.removeItem = function () {
            vm.model.value = null;
            vm.pickedItem = false;
        };

        vm.openItem = function () {

        };


    }

    angular.module('vendr').controller('Vendr.Controllers.ElementTypePickerController', ElementTypePickerController);

}());