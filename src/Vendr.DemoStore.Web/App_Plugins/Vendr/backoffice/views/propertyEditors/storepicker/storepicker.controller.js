(function () {

    'use strict';

    function StorePickerController($scope, editorService,
        vendrStoreResource)
    {
        var dialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/dialogs/storepicker.html',
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
            vendrStoreResource.getBasicStore(vm.model.value).then(function (store) {
                vm.pickedItem = store;
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

    angular.module('vendr').controller('Vendr.Controllers.StorePickerController', StorePickerController);

}());