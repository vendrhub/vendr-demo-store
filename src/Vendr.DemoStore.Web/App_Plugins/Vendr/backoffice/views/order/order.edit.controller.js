(function () {

    'use strict';

    function OrderEditController($scope, $routeParams, $location, formHelper, angularHelper,
        appState, editorState, editorService, localizationService, notificationsService, navigationService, overlayService,
        vendrUtils, vendrOrderResource, vendrActivityLogResource, vendrActions) {

        var infiniteMode = editorService.getNumberOfEditors() > 0 ? true : false;
        var compositeId = infiniteMode
            ? [$scope.model.config.storeId, $scope.model.config.orderId] 
            : vendrUtils.parseCompositeId($routeParams.id);

        var storeId = compositeId[0];
        var id = compositeId[1];

        var transactionInfoDialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/order/dialogs/transactioninfo.html',
            size: 'small',
            config: {
                storeId: storeId,
                orderId: id
            },
            close: function () {
                editorService.close();
            }
        };

        var customerInfoDialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/order/dialogs/customerinfo.html',
            size: 'small',
            config: {
                storeId: storeId,
                orderId: id
            },
            close: function () {
                editorService.close();
            }
        };

        var editCustomerDetailsDialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/order/dialogs/editcustomerdetails.html',
            config: {
                storeId: storeId,
                orderId: id
            },
            submit: function (model) {

                // Copy model values back over
                vm.content.customerFirstName = model.customerFirstName;
                vm.content.customerLastName = model.customerLastName;
                vm.content.customerEmail = model.customerEmail;
                vm.content.paymentCountryId = model.paymentCountryId;
                vm.content.paymentCountry = model.paymentCountry;
                vm.content.paymentRegionId = model.paymentRegionId;
                vm.content.paymentRegion = model.paymentRegion;
                vm.content.shippingCountryId = model.shippingCountryId;
                vm.content.shippingCountry = model.shippingCountry;
                vm.content.shippingRegionId = model.shippingRegionId;
                vm.content.shippingRegion = model.shippingRegion;

                for (var key in model.properties) {
                    var prop = model.properties[key];
                    if (prop.value) {
                        vm.content.properties[key] = prop;
                    } else {
                        delete vm.content.properties[key];
                    }
                }

                angularHelper.getCurrentForm($scope).$setDirty();
                
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var editPropertiesDialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/order/dialogs/editproperties.html',
            size: 'small',
            config: {
                storeId: storeId,
                orderId: id
            },
            close: function () {
                editorService.close();
            }
        };

        var vm = this;

        vm.page = {};
        vm.page.loading = true;
        vm.page.saveButtonState = 'init';
        vm.page.editView = false;
        vm.page.isInfiniteMode = infiniteMode;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.cancelPaymentButtonState = 'init';
        vm.capturePaymentButtonState = 'init';
        vm.refundPaymentButtonState = 'init';

        vm.options = {
            expandedBundles: [],
            editorActions: [],
        };
        vm.content = {};
        vm.storeId = storeId;

        vm.activityLog = {
            loading: true,
            entries: {
                items: [],
                pageNumber: 1,
                pageSize: 10
            }
        }

        vm.loadActivityLog = function (page) {
            vm.activityLog.loading = true;
            vendrActivityLogResource.getActivityLogsByEntity(id, "Order", page, vm.activityLog.entries.pageSize).then(function (activityLogs) {
                vm.activityLog.entries = activityLogs;
                vm.activityLog.loading = false;
            });
        }

        vm.close = function () {
            if ($scope.model.close) {
                $scope.model.close();
            }
        }

        vm.back = function () {
            $location.path("/commerce/vendr/order-list/" + vendrUtils.createCompositeId([storeId]));
        };

        vm.bundleIsExpanded = function (id) {
            return vm.options.expandedBundles.findIndex(function (v) {
                return v === id;
            }) >= 0;
        };

        vm.toggleBundle = function (id) {
            var idx = vm.options.expandedBundles.findIndex(function (v) {
                return v === id;
            });
            if (idx >= 0) {
                vm.options.expandedBundles.splice(idx, 1);
            } else {
                vm.options.expandedBundles.push(id);
            }
        };

        vm.hasEditableOrderLineProperties = function (orderLine) {
            if (!vm.editorConfig.orderLine.properties)
                return false;

            var editablePropertyConfigs = vm.editorConfig.orderLine.properties
                .filter(function (c) {
                    return c.showInEditor !== false;
                });

            if (editablePropertyConfigs.length === 0)
                return false;

            return true;
        };

        vm.editOrderLineProperties = function (orderLine) {
            editPropertiesDialogOptions.config.order = vm.content;
            editPropertiesDialogOptions.config.orderLineId = orderLine.id;
            editPropertiesDialogOptions.config.orderLine = orderLine;
            editPropertiesDialogOptions.config.editorConfig = {
                properties: vm.editorConfig.orderLine.properties
            };
            editPropertiesDialogOptions.submit = function (model) {
                model.properties.forEach(function (itm, idx) {
                    orderLine.properties[itm.alias] = {
                        value: itm.value,
                        isReadOnly: itm.isReadOnly,
                        isServerSideOnly: itm.isServerSideOnly
                    };
                });
                angularHelper.getCurrentForm($scope).$setDirty();
                editorService.close();
            };
            editorService.open(editPropertiesDialogOptions);
        };

        vm.hasEditableOrderProperties = function () {
            if (!vm.editorConfig.additionalInfo)
                return false;

            var editablePropertyConfigs = vm.editorConfig.additionalInfo
                .filter(function (c) {
                    return c.showInEditor !== false;
                });

            if (editablePropertyConfigs.length === 0)
                return false;

            return true;
        };

        vm.editOrderProperties = function () {
            editPropertiesDialogOptions.config.order = vm.content;
            editPropertiesDialogOptions.config.orderLineId = undefined;
            editPropertiesDialogOptions.config.orderLine = undefined;
            editPropertiesDialogOptions.config.editorConfig = {
                properties: vm.editorConfig.additionalInfo
            };
            editPropertiesDialogOptions.submit = function (model) {
                model.properties.forEach(function (itm, idx) {
                    vm.content.properties[itm.alias] = {
                        value: itm.value,
                        isReadOnly: itm.isReadOnly,
                        isServerSideOnly: itm.isServerSideOnly
                    };
                });
                angularHelper.getCurrentForm($scope).$setDirty();
                editorService.close();
            };
            editorService.open(editPropertiesDialogOptions);
        };

        vm.copySuccess = function (description) {
            notificationsService.success("Copy Successful", description + " successfully copied to the clipboard.");
        };

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Order' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrOrderResource.getOrderEditorConfig(storeId).then(function (config) {
                vm.editorConfig = config;
                vm.editorConfig.view = vm.editorConfig.view || '/App_Plugins/Vendr/backoffice/views/order/subviews/edit.html';
                vendrOrderResource.getOrder(id).then(function (order) {

                    // Ensure notes properties
                    if (vm.editorConfig.notes) {
                        if (vm.editorConfig.notes.customerNotes && !order.properties[vm.editorConfig.notes.customerNotes.alias]) {
                            order.properties[vm.editorConfig.notes.customerNotes.alias] = { value: "" };
                        }
                        if (vm.editorConfig.notes.internalNotes && !order.properties[vm.editorConfig.notes.internalNotes.alias]) {
                            order.properties[vm.editorConfig.notes.internalNotes.alias] = { value: "" };
                        }
                    }

                    vm.ready(order);

                    // Sync payment status
                    vendrOrderResource.syncPaymentStatus(id).then(function (order) {
                        vm.content.paymentStatus = order.paymentStatus;
                        vm.content.paymentStatusName = order.paymentStatusName;
                    });

                    // Load activity log
                    vm.loadActivityLog(1);
                });
            });
        };

        //vm.viewOnMap = function (postcode) {
        //    editorService.open({
        //        title: "Map",
        //        view: "/App_Plugins/Vendr/backoffice/views/dialogs/iframe.html",
        //        submit: function (model) {
        //            editorService.close();
        //        },
        //        close: function () {
        //            editorService.close();
        //        }
        //    });
        //};

        vm.viewTransactionInfo = function () {
            editorService.open(transactionInfoDialogOptions);
        };

        vm.viewCustomerInfo = function () {
            editorService.open(customerInfoDialogOptions);
        };

        vm.doConfirm = function (title, message, submitButtonLabelKey, action) {
            overlayService.confirm({
                title: title,
                content: message,
                submitButtonLabelKey: submitButtonLabelKey,
                submitButtonStyle: "warning",
                close: function () {
                    overlayService.close();
                },
                submit: function () {
                    action();
                    overlayService.close();
                }
            });
        }

        vm.confirmCancelPayment = function () {
            vm.doConfirm("Confirm Payment Cancel", "Are you sure you want to cancel this payment?", "actions_cancelPayment", () => vm.cancelPayment());
        }

        vm.cancelPayment = function () {
            vm.cancelPaymentButtonState = 'busy';
            vendrOrderResource.cancelPayment(id).then(function(order) {
                vm.content.paymentStatus = order.paymentStatus;
                vm.content.paymentStatusName = order.paymentStatusName;
                vm.cancelPaymentButtonState = 'success';
                notificationsService.success("Payment Cancelled", "Pending payment successfully cancelled.");
            }, function (err) {
                vm.cancelPaymentButtonState = 'error';
                notificationsService.error("Payment Cancellation Failed", err.data.message || err.data.Message || err.errorMsg);
            });
        };

        vm.confirmCapturePayment = function () {
            vm.doConfirm("Confirm Payment Capture", "Are you sure you want to capture this payment?", "actions_capturePayment", () => vm.capturePayment());
        }

        vm.capturePayment = function () {
            vm.capturePaymentButtonState = 'busy';
            vendrOrderResource.capturePayment(id).then(function(order) {
                vm.content.paymentStatus = order.paymentStatus;
                vm.content.paymentStatusName = order.paymentStatusName;
                vm.capturePaymentButtonState = 'success'; 
                notificationsService.success("Payment Captured", "Pending payment successfully captured.");
                vm.loadActivityLog(1);
            }, function (err) {
                vm.capturePaymentButtonState = 'error';
                notificationsService.error("Payment Capture Failed", err.data.message || err.data.Message || err.errorMsg);
            });
        };

        vm.confirmRefundPayment = function () {
            vm.doConfirm("Confirm Payment Refund", "Are you sure you want to refund this payment?", "actions_refundPayment", () => vm.refundPayment());
        }

        vm.refundPayment = function () {
            vm.refundPaymentButtonState = 'busy';
            vendrOrderResource.refundPayment(id).then(function(order) {
                vm.content.paymentStatus = order.paymentStatus;
                vm.content.paymentStatusName = order.paymentStatusName;
                vm.refundPaymentButtonState = 'success';
                notificationsService.success("Payment Refunded", "Captured payment successfully refunded.");
                vm.loadActivityLog(1);
            }, function (err) {
                vm.refundPaymentButtonState = 'error';
                notificationsService.error("Payment Refund Failed", err.data.message || err.data.Message || err.errorMsg);
            });
        };

        vm.changeStatus = function() {
            editorService.open(changeStatusDialogOptions);
        };

        vm.sendEmail = function() {
            editorService.open(pickEmailTemplateDialogOptions);
        };

        vm.editCustomerDetails = function () {
            editCustomerDetailsDialogOptions.config.order = angular.copy(vm.content);
            editCustomerDetailsDialogOptions.config.editorConfig = vm.editorConfig;
            editorService.open(editCustomerDetailsDialogOptions);
        };

        vm.updateTags = function (tags) {
            vm.content.tags = tags;
        }

        vm.ready = function (model) {
            vm.page.loading = false;
            vm.content = model;

            // sync state
            editorState.set(vm.content);

            if (infiniteMode)
                return;
             
            var pathToSync = vm.content.path.slice(0, -1);
            navigationService.syncTree({ tree: "vendr", path: pathToSync, forceReload: true }).then(function (syncArgs) {

                var orderOrCartNumber = '#' + (vm.content.orderNumber || vm.content.cartNumber);

                // Fake a current node
                // This is used in the header to generate the actions menu
                var application = syncArgs.node.metaData.application;
                var tree = syncArgs.node.metaData.tree;
                vm.page.menu.currentNode = {
                    id: id,
                    name: orderOrCartNumber,
                    nodeType: "Order",
                    menuUrl: `${Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath}/backoffice/Vendr/StoresTree/GetMenu?application=${application}&tree=${tree}&nodeType=Order&storeId=${storeId}&id=${id}`,
                    metaData: {
                        tree: tree,
                        storeId: storeId
                    }
                };

                // Build breadcrumb for parent then append current node
                var breadcrumb = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                breadcrumb.push({ name: orderOrCartNumber, routePath: "" });
                vm.page.breadcrumb.items = breadcrumb;

            });
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrOrderResource.saveOrder(vm.content).then(function(saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    vm.ready(saved);

                }, function(err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save order",
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityChanged", function (evt, args) {
            if (args.entityType === 'Order' && args.storeId === storeId && args.entityId === id) {
                vendrOrderResource.getOrder(id).then(function (order) {
                    vm.content.orderStatusId = order.orderStatusId;
                    vm.content.orderStatus = order.orderStatus;
                });
                vm.loadActivityLog(1);
            }
        });

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if ((args.entityType === 'Cart' || args.entityType === 'Order') && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.OrderEditController', OrderEditController);

}());