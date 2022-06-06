(function () {

    'use strict';

    function StoreConfigController($scope) {

        var vm = this;

        vm.storePickerProperty = {
            alias: "storeId",
            view: '/App_Plugins/Vendr/backoffice/views/propertyeditors/storepicker/storepicker.html'
        };

        Object.defineProperty(vm.storePickerProperty, "value", {
            get: () => vm.model.value.storeId,
            set: (value) => vm.model.value.storeId = value
        });

        vm.model = $scope.model;
        vm.model.value = vm.model.value || {
            storeMode: 'Search',
            storeId: undefined
        };

    }

    angular.module('vendr').controller('Vendr.Controllers.StoreConfigController', StoreConfigController);

}());