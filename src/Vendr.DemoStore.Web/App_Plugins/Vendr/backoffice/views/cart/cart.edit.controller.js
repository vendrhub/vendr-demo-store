(function () {

    'use strict';

    function CartEditController($scope, $routeParams, $location, $q, angularHelper, formHelper,
        appState, editorState, editorService, localizationService, notificationsService, navigationService, overlayService,
        vendrUtils, vendrCartResource, vendrProductResource, vendrEmailResource, vendrUtilsResource, vendrActions) {

        var infiniteMode = editorService.getNumberOfEditors() > 0 ? true : false;
        var compositeId = infiniteMode
            ? [$scope.model.config.storeId, $scope.model.config.orderId] 
            : vendrUtils.parseCompositeId($routeParams.id);

        var storeId = compositeId[0];
        var id = compositeId[1];

        var addProductDialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/cart/dialogs/addproduct.html',
            size: 'small',
            config: {
                // Populated at point of opening dialog
            },
            submit: function (model) {
                
                var orderLineId = this.config.orderLineId;
                
                // We clone the cart as we don't want to show this order line
                // until it has been sent to the server and order recalculated
                // thus populating all the other orderline info
                var cart = angular.copy(vm.content);
                var orderLines = cart.orderLines = cart.orderLines ?? [];
                if (orderLineId) {
                    var orderLine = orderLines.find(ol => ol.id === orderLineId);
                    if (orderLine) {
                        orderLines = orderLine.orderLines = orderLine.orderLines ?? [];
                    }
                };
                
                orderLines.push({
                    id: "00000000-0000-0000-0000-000000000000",
                    productReference: model.productReference,
                    productVariantReference: model.productVariantReference,
                    quantity: 1
                });
                
                vm.recalculateCart(cart);
                
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var setShippingMethodDialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/dialogs/storeentitypicker.html',
            size: 'small',
            config: {
                storeId: storeId,
                entityType: "ShippingMethod"
            },
            submit: function (model) {
                vm.content.shippingMethodId = model.id;
                vm.recalculateCart();
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };

        var setPaymentMethodDialogOptions = {
            view: '/App_Plugins/Vendr/backoffice/views/dialogs/storeentitypicker.html',
            size: 'small',
            config: {
                storeId: storeId,
                entityType: "PaymentMethod"
            },
            submit: function (model) {
                vm.content.paymentMethodId = model.id;
                vm.recalculateCart();
                editorService.close();
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
                vm.content.paymentRegionId = model.paymentRegionId;
                vm.content.shippingCountryId = model.shippingCountryId;
                vm.content.shippingRegionId = model.shippingRegionId;

                for (var key in model.properties) {
                    var prop = model.properties[key];
                    if (prop.value) {
                        vm.content.properties[key] = prop;
                    } else {
                        delete vm.content.properties[key];
                    }
                }

                vm.recalculateCart();
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
        vm.page.initialized = false;

        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;

        vm.page.breadcrumb = {};
        vm.page.breadcrumb.items = [];
        vm.page.breadcrumb.itemClick = function (ancestor) {
            $location.path(ancestor.routePath);
        };

        vm.options = {
            expandedBundles: [],
            editorActions: [],
            code: ""
        };
        vm.content = {};
        vm.storeId = storeId;

        vm.olActions = {};
        vm.olActionsFactory = function (orderLine) {
            
            if (!vm.olActions[orderLine.id]) 
            {
                var actions = [];
                
                if (!orderLine.bundleId) {
                    actions.push({
                        alias: "convertToBundle",
                        labelKey: "vendr_convertToBundle",
                        icon: "box",
                        method: function () {
                            vm.convertToBundle(orderLine);
                        }
                    });
                }
                
                actions.push({
                    alias: "delete",
                    labelKey: "vendr_delete",
                    icon: "trash",
                    method: function () {
                        vm.deleteOrderLine(orderLine);
                    }
                });

                vm.olActions[orderLine.id] = actions;
            }
            
            return vm.olActions[orderLine.id];
        };
        
        vm.close = function () {
            if ($scope.model.close) {
                $scope.model.close();
            }
        }

        vm.back = function () {
            $location.path("/commerce/vendr/cart-list/" + vendrUtils.createCompositeId([storeId]));
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
        
        vm.convertToBundle = function (orderLine) {
            vm.doConfirm("Convert to Bundle", "Are you sure you want to convert this order line to a bundle?", "vendr_convertToBundle", () => {
                orderLine.bundleId = vendrUtilsResource.generateGuid();
                
                // Force rebuild of order line actions
                delete vm.olActions[orderLine.id];
                
                vm.recalculateCart();
            });
        }

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

                vm.recalculateCart();
                
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
                editorService.close();
            };
            editorService.open(editPropertiesDialogOptions);
        };

        vm.deleteOrderLine = function (ol, sol) {
            vm.doConfirm("Delete Order Line", "Are you sure you want to delete this order line?", "actions_deleteOrderLine", () => {
                if (sol) {
                    ol.orderLines = ol.orderLines.filter((itm) => {
                        return itm.id !== sol.id;
                    })
                } else {
                    vm.content.orderLines = vm.content.orderLines.filter((itm) => {
                        return itm.id !== ol.id;
                    })
                }
                vm.recalculateCart();
            });
        };
        
        vm.copySuccess = function (description) {
            notificationsService.success("Copy Successful", description + " successfully copied to the clipboard.");
        };
        
        vm.recalculateCart = function (cart) {
            vm.page.saveButtonState = "busy";
            cart = cart || angular.copy(vm.content);
            vendrCartResource.calculateCart(cart).then(function (data) {
                vm.processCart(data).then(function (cart2) {
                    vm.ready(cart2);
                    angularHelper.getCurrentForm($scope).$setDirty();
                    vm.page.saveButtonState = "init";
                });
            });
        }
        
        vm.processCart = function (cart) 
        {
            return $q(function (resolve, reject) {

                // Ensure notes properties
                if (vm.editorConfig.notes) {
                    if (vm.editorConfig.notes.customerNotes && !cart.properties[vm.editorConfig.notes.customerNotes.alias]) {
                        cart.properties[vm.editorConfig.notes.customerNotes.alias] = { value: "" };
                    }
                    if (vm.editorConfig.notes.internalNotes && !cart.properties[vm.editorConfig.notes.internalNotes.alias]) {
                        cart.properties[vm.editorConfig.notes.internalNotes.alias] = { value: "" };
                    }
                }
                
                // Fetch stock levels 
                const getProductReferences = (orderLines) => {
                    return orderLines.reduce((acc, r) => {
                        if (r.orderLines && r.orderLines.length) {
                            acc = acc.concat(getProductReferences(r.orderLines));
                        } 
                        const obj = {
                            productReference: r.productReference,
                            productVariantReference: r.productVariantReference
                        };
                        const found = acc.find(function (itm) {
                            return itm.productReference === obj.productReference && itm.productVariantReference === obj.productVariantReference;
                        });
                        if (!found) {
                            acc.push(obj);
                        }
                        return acc;
                    }, [])
                };

                const productReferences = getProductReferences(cart.orderLines);

                vendrProductResource.getAllStock(storeId, productReferences).then(function (stockLevels) {
                    
                    const setOrderLineStock = (orderLines, stockLevels) => {
                        orderLines.forEach(itm => {
                           if (itm.orderLines && itm.orderLines.length){
                               setOrderLineStock(itm.orderLines, stockLevels)
                           }
                           const stockLevel = stockLevels.find(itm2 => {
                               return itm2.productReference === itm.productReference && itm2.productVariantReference === itm.productVariantReference;
                           });
                           if (stockLevel) {
                               itm.stockLevel = stockLevel.stockLevel > -1 // See if stock is unlimited (ie, -1)
                                ? Math.max(itm.quantity, stockLevel.stockLevel)
                                : 1000;
                           }
                        });
                    }

                    setOrderLineStock(cart.orderLines, stockLevels);
                    
                    resolve(cart);
                });
                
            });
        }

        vm.init = function () {

            vendrActions.getEditorActions({ storeId: storeId, entityType: 'Cart' }).then(result => {
                vm.options.editorActions = result;
            });

            vendrCartResource.getCartEditorConfig(storeId).then(function (config) {
                vm.editorConfig = config;
                vm.editorConfig.view = '/App_Plugins/Vendr/backoffice/views/cart/subviews/edit.html';
                vendrCartResource.getCart(id).then(function (cart) {
                    vm.processCart(cart).then(function (cart2) {
                        vm.ready(cart2);
                    });
                });
            });
        };

        vm.addProduct = function (ol) {
            addProductDialogOptions.config.storeId = vm.content.storeId;
            addProductDialogOptions.config.languageIsoCode = vm.content.languageIsoCode;
            addProductDialogOptions.config.currencyId = vm.content.currencyId;
            addProductDialogOptions.config.currencyCode = vm.content.currencyCode;
            addProductDialogOptions.config.orderLineId = ol ? ol.id : null;
            editorService.open(addProductDialogOptions);
        };

        vm.setShippingMethod = function () {
            setShippingMethodDialogOptions.config.storeId = vm.content.storeId;
            editorService.open(setShippingMethodDialogOptions);
        };

        vm.removeShippingMethod = function () {
            vm.doConfirm("Remove Shipping Method", "Are you sure you want to remove the shipping method?", "actions_removeShippingMethod", () => {
                vm.content.shippingMethodId = null;
                vm.recalculateCart();
            });
        };

        vm.setPaymentMethod = function () {
            setPaymentMethodDialogOptions.config.storeId = vm.content.storeId;
            editorService.open(setPaymentMethodDialogOptions);
        };

        vm.removePaymentMethod = function () {
            vm.doConfirm("Remove Payment Method", "Are you sure you want to remove the payment method?", "actions_removePaymentMethod", () => {
                vm.content.paymentMethodId = null;
                vm.recalculateCart();
            });
        };

        vm.applyCode = function () {
            vm.content.discountOrGiftCardCode = vm.options.code;
            vm.options.code = "";
            vm.recalculateCart();
        };
        
        vm.removeCode = function (code) 
        {
            vm.doConfirm("Remove Discount / Gift Card Code", "Are you sure you want to remove the discount / gift card code '"+ code +"'?", "actions_removeDiscountOrGiftCardCode", () => 
            {
                const findByCode = function (c) {
                    return c === code;
                };

                // Try discount codes
                var idx = vm.content.appliedDiscountCodes.findIndex(findByCode);
                if (idx >= 0) {
                    vm.content.appliedDiscountCodes.splice(idx, 1);
                    vm.recalculateCart();
                }
                else
                {
                    // Try gift card codes
                    idx = vm.content.appliedGiftCardCodes.findIndex(findByCode);
                    if (idx >= 0) {
                        vm.content.appliedGiftCardCodes.splice(idx, 1);
                        vm.recalculateCart();
                    }
                }   
            });
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
            
            if (infiniteMode || vm.page.initialized)
                return;
             
            var pathToSync = vm.content.path.slice(0, -1);
            navigationService.syncTree({ tree: "vendr", path: pathToSync, forceReload: true }).then(function (syncArgs) {

                var cartNumber = '#' + vm.content.cartNumber;

                // Fake a current node
                // This is used in the header to generate the actions menu
                var application = syncArgs.node.metaData.application;
                var tree = syncArgs.node.metaData.tree;
                vm.page.menu.currentNode = {
                    id: id,
                    name: cartNumber,
                    nodeType: "Cart",
                    menuUrl: `${Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath}/backoffice/Vendr/StoresTree/GetMenu?application=${application}&tree=${tree}&nodeType=Cart&storeId=${storeId}&id=${id}`,
                    metaData: {
                        tree: tree,
                        storeId: storeId
                    }
                };

                // Build breadcrumb for parent then append current node
                var breadcrumb = vendrUtils.createBreadcrumbFromTreeNode(syncArgs.node);
                breadcrumb.push({ name: cartNumber, routePath: "" });
                vm.page.breadcrumb.items = breadcrumb;

                // Set initialized flag
                vm.page.initialized = true;
            });
        };

        vm.save = function (suppressNotification) {

            if (formHelper.submitForm({ scope: $scope, statusMessage: "Saving..." })) {

                vm.page.saveButtonState = "busy";

                vendrCartResource.saveCart(vm.content).then(function(saved) {

                    formHelper.resetForm({ scope: $scope, notifications: saved.notifications });

                    vm.page.saveButtonState = "success";

                    vm.ready(saved);

                }, function(err) {

                    if (!suppressNotification) {
                        vm.page.saveButtonState = "error";
                        notificationsService.error("Failed to save cart",
                            err.data.message || err.data.Message || err.errorMsg);
                    }

                    vm.page.saveButtonState = "error";
                });
            }

        };

        vm.init();

        $scope.$on("vendrEntityDeleted", function (evt, args) {
            if ((args.entityType === 'Cart' || args.entityType === 'Order') && args.storeId === storeId && args.entityId === id) {
                vm.back();
            }
        });

    };

    angular.module('vendr').controller('Vendr.Controllers.CartEditController', CartEditController);

}());