(function () {

    'use strict';

    function EditPropertiesController($scope)
    {
        var order = $scope.model.config.order;
        var orderLine = $scope.model.config.orderLine;
        var content = orderLine || order;

        var vm = this;
        vm.title = "Edit Properties";
        vm.editorConfig = $scope.model.config.editorConfig;
        vm.content = {
            properties: []
        };

        mapProperties(vm.editorConfig.properties);
        
        vm.save = function () {
            if ($scope.model.submit) {
                $scope.model.submit(vm.content);
            }
        };

        vm.cancel = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };

        function mapProperties (cfg) {
            for (const cfgKey in cfg) {

                var alias = cfg[cfgKey].alias;

                var prop = content.properties[alias] || { value: "", isReadOnly: false, isServerSideOnly: false };

                var property = {
                    alias: alias,
                    label: cfg[cfgKey].label || alias,
                    description: cfg[cfgKey].description,
                    config: cfg[cfgKey].config || {},
                    view: cfg[cfgKey].view || 'textbox',

                    value: prop.value,
                    isReadOnly: prop.isReadOnly,
                    isServerSideOnly: prop.isServerSideOnly
                };

                // Push some additional config into the property config
                property.config.storeId = $scope.model.config.orderId;
                property.config.orderId = $scope.model.config.orderId;
                property.config.orderLineId = $scope.model.config.orderLineId;

                if (prop.isReadOnly || cfg[cfgKey].isReadOnly) { // isServerSideOnly?
                    property.view = "readonlyvalue";
                }

                if (property.view === 'dropdown') {
                    property.view = '/App_Plugins/Vendr/backoffice/views/propertyeditors/dropdown/dropdown.html';
                }

                vm.content.properties.push(property);
            }
        }
    }

    angular.module('vendr').controller('Vendr.Controllers.EditPropertiesController', EditPropertiesController);

}());