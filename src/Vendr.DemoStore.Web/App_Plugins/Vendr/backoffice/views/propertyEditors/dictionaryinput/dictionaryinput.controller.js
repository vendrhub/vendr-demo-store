(function () {

    'use strict';

    function DictionaryInputController($scope) {

        var vm = this;
        
        vm.model = $scope.model;
        
        vm.generateKey = function () {
            return ($scope.model.config.keyPrefix + "_" + $scope.model.alias).toLowerCase();
        };

    }

    angular.module('vendr').controller('Vendr.Controllers.DictionaryInputController', DictionaryInputController);

}());