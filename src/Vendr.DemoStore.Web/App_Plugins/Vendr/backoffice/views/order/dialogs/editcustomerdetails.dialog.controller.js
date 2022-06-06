(function () {

    'use strict';

    function EditCustomerDetailsController($scope, vendrOrderResource,
        vendrCountryResource, vendrRouteCache)
    {
        var order = $scope.model.config.order;

        var vm = this;
        vm.title = "Edit Customer Details";
        vm.editorConfig = $scope.model.config.editorConfig;
        vm.content = {
            customerFirstName: order.customerFirstName,
            customerLastName: order.customerLastName,
            customerEmail: order.customerEmail,
            paymentCountryId: order.paymentCountryId,
            paymentCountry: order.paymentCountry,
            paymentRegionId: order.paymentRegionId,
            paymentRegion: order.paymentRegion,
            shippingCountryId: order.shippingCountryId,
            shippingCountry: order.shippingCountry,
            shippingRegionId: order.shippingRegionId,
            shippingRegion: order.shippingRegion,
            properties: {}
        };

        ensureProperties(vm.editorConfig.customer);
        ensureProperties(vm.editorConfig.billing);
        ensureProperties(vm.editorConfig.shipping);

        vm.options = {
            countries: [],
            countryRegionMap: {},
            shippingSameAsBilling: vm.editorConfig.shipping.sameAsBilling && vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value == vm.editorConfig.shipping.sameAsBilling.trueValue
        };

        vm.toggleShippingSameAsBilling = function () 
        {
            if (vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value == vm.editorConfig.shipping.sameAsBilling.trueValue) {
                vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value = vm.editorConfig.shipping.sameAsBilling.falseValue;
            } else {
                vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value = vm.editorConfig.shipping.sameAsBilling.trueValue;
            }
            vm.options.shippingSameAsBilling = vm.content.properties[vm.editorConfig.shipping.sameAsBilling.alias].value == vm.editorConfig.shipping.sameAsBilling.trueValue;
        };

        vm.clearPaymentRegion = function () {
            vm.content.paymentRegionId = undefined;    
        }

        vm.clearShippingRegion = function () {
            vm.content.shippingRegionId = undefined;
        }
        
        vm.save = function () {
            if ($scope.model.submit) {
                
                if (vm.options.shippingSameAsBilling) 
                {
                    vm.content.shippingCountryId = vm.content.paymentCountryId;
                    vm.content.shippingRegionId = vm.content.paymentRegionId;

                    copyProperty(vm.editorConfig.shipping.firstName, vm.content.customerFirstName);
                    copyProperty(vm.editorConfig.shipping.lastName, vm.content.customerLastName);
                    copyProperty(vm.editorConfig.shipping.company, vm.editorConfig.customer.company);
                    copyProperty(vm.editorConfig.shipping.email, vm.content.customerEmail);
                    copyProperty(vm.editorConfig.shipping.addressLine1, vm.editorConfig.billing.addressLine1);
                    copyProperty(vm.editorConfig.shipping.addressLine2, vm.editorConfig.billing.addressLine2);
                    copyProperty(vm.editorConfig.shipping.city, vm.editorConfig.billing.city);
                    copyProperty(vm.editorConfig.shipping.zipCode, vm.editorConfig.billing.zipCode);
                    copyProperty(vm.editorConfig.shipping.telephone, vm.editorConfig.billing.telephone);
                }

                // Pass the country / region entities for easier UI updating
                vm.content.paymentCountry = vm.options.countries.find(x => x.id === vm.content.paymentCountryId);
                vm.content.paymentRegion = vm.content.paymentCountry && vm.content.paymentRegionId ? vm.content.paymentCountry.regions.find(x => x.id === vm.content.paymentRegionId) : null;
                vm.content.shippingCountry = vm.options.countries.find(x => x.id === vm.content.shippingCountryId);
                vm.content.shippingRegion = vm.content.shippingCountry && vm.content.shippingRegionId ? vm.content.shippingCountry.regions.find(x => x.id === vm.content.shippingRegionId) : null;

                $scope.model.submit(vm.content);
            }
        };

        vm.cancel = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
        
        vendrRouteCache.getOrFetch("countriesWithRegions", function () {
            return vendrCountryResource.getCountriesWithRegions($scope.model.config.storeId);
        })
        .then(function (countries) {
            vm.options.countries = countries;
            countries.forEach(country => {
                vm.options.countryRegionMap[country.id] = country.regions;    
            });
        });

        function ensureProperties (cfg) {
            for (const prop in cfg) {
                var alias = cfg[prop].alias;
                vm.content.properties[alias] = order.properties[alias] || { value: "", isReadOnly: false, isServerSideOnly: false };
            }
        }
        
        function copyProperty(target, src) 
        {
             if (!target)
                 return;

             if (!src) {
                 vm.content.properties[target.alias].value = "";
             } else {
                 vm.content.properties[target.alias].value = (typeof src === 'string' ? src : vm.content.properties[src.alias].value);
             }
        }
    }

    angular.module('vendr').controller('Vendr.Controllers.EditCustomerDetailsController', EditCustomerDetailsController);

}());