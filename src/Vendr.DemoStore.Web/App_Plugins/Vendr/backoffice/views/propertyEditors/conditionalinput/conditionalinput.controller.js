(function () {

    'use strict';

    function ConditionalInputController($scope, $timeout)
    {
        var vm = this;

        vm.property = {
            alias: $scope.model.alias + "_conitional",
            view: $scope.model.config.propertyView,
            config: $scope.model.config.propertyConfig
        };

        Object.defineProperty(vm.property, "value", {
            get: function () {
                return $scope.model.value;
            },
            set: function (value) {
                $scope.model.value = value;
                toggleProperties();
            }
        });

        function toggleProperties()
        {
            if ($scope.model.value in $scope.model.config.map) {
                doToggleProperties($scope.model.config.map[$scope.model.value]);
            }
            else if ("default" in $scope.model.config.map) {
                doToggleProperties($scope.model.config.map["default"]);
            }
        }

        function doToggleProperties(config) {

            var $inputEl = $("[data-element='property-" + $scope.model.alias + "']");
            var form = $inputEl.closest("form");

            var hiddenContainer = $(form).find("> .cih");
            if (hiddenContainer.length === 0) {
                $(form).append("<div class='cih' style='display: none;'></div>");
                hiddenContainer = $(form).find("> .cih");
            }

            config.show.forEach(function (toShow) {
                var $s = $("[data-element='property-" + toShow + "']");
                if ($s.closest(".cih").length > 0) {
                    $(form).find(".property-" + toShow + "-placeholder").after($s);
                    $(form).find(".property-" + toShow + "-placeholder").remove();
                }
            });

            config.hide.forEach(function (toHide) {
                var $s = $("[data-element='property-" + toHide + "']");
                if ($s.closest(".cih").length === 0) {
                    $s.after("<span class='property-" + toHide + "-placeholder'></span>");
                    hiddenContainer.append($s);
                }
            });

        }

        $timeout(function () {
            toggleProperties();
        }, 10);
        
    }

    angular.module('vendr').controller('Vendr.Controllers.ConditionalInputController', ConditionalInputController);

}());