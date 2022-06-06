(function () {

    'use strict';

    function AdvancedFilterDialogController($scope, $location, $q, editorService, vendrProductResource)
    {
        var vm = this;
    
        vm.title = "Advanced Filter";
        vm.properties = angular.copy($scope.model.config.properties);
        vm.values = $scope.model.config.values;
        
        // Fix properties
        vm.properties.forEach(group => {
            group.properties.forEach(prop => {
                if (vm.values.hasOwnProperty(prop.alias)){
                    if (prop.view === "boolean") {
                        prop.value = vm.values[prop.alias] ? "1" : "0";
                    }
                    else {
                        prop.value = vm.values[prop.alias];
                    }
                }
            });
        });
        
        vm.reset = function () {
            vm.properties.forEach(group => {
                group.properties.forEach(prop => {
                    prop.value = "";
                });
            });
        }
        
        vm.submit = function () {
            if ($scope.model.submit) {
                
                var model = {};

                vm.properties.forEach(group => {
                    group.properties.forEach(prop => {
                        if (prop.view === "boolean") {
                            if (prop.value === "1")
                                model[prop.alias] = true;
                        } else if (prop.value) {
                            model[prop.alias] = prop.value;
                        }
                    })
                });
                
                $scope.model.submit(model);
            }
        }
        
        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.AdvancedFilterDialogController', AdvancedFilterDialogController);

}());