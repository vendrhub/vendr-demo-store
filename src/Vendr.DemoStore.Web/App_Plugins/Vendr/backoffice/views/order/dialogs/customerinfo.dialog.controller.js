(function () {

    'use strict';

    function CustomerInfoDialogController($scope, $location, editorService, vendrOrderResource)
    {
        var vm = this;

        vm.loading = true;
        vm.title = "Customer Info";
        vm.registeredCustomer = {
            properties: [],
            isUmbracoMember: false
        };
        vm.orderHistory = [];

        vm.openMember = function (memberKey) {
            editorService.memberEditor({
                id: memberKey,
                submit: function (model) {
                    vendrOrderResource.getOrderRegisteredCustomerInfo($scope.model.config.orderId).then(function (data) {
                        vm.registeredCustomer = data;
                        editorService.close();
                    });
                },
                close: function () {
                    editorService.close();
                }
            });
        }

        vm.openOrder = function (order) {
            if (order.id === $scope.model.config.orderId) {
                vm.close();
            } else {
                editorService.open({
                    view: '/App_Plugins/Vendr/backoffice/views/order/edit.html',
                    infiniteMode: true,
                    config: {
                        storeId: order.storeId,
                        orderId: order.id
                    },
                    submit: function (model) {
                        editorService.close();
                    },
                    close: function () {
                        editorService.close();
                    }
                });
            }
        }

        vendrOrderResource.getOrderRegisteredCustomerInfo($scope.model.config.orderId).then(function (data) {
            vm.registeredCustomer = data;
            vendrOrderResource.getOrderHistoryByOrder($scope.model.config.orderId).then(function (data) {
                vm.orderHistory = data;
                vm.loading = false;
            });
        });

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        };
    }

    angular.module('vendr').controller('Vendr.Controllers.CustomerInfoDialogController', CustomerInfoDialogController);

}());