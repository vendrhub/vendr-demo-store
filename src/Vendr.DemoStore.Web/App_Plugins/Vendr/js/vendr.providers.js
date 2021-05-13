(function () {

    'use strict';

    function ActionsProvider() {

        var provider = this;

        provider.bulkActions = [
            ['$q', 'editorService', 'vendrPrintTemplateResource', function ($q, editorService, vendrPrintTemplateResource) {
                return {
                    name: 'Print',
                    icon: 'icon-print',
                    bulkAction: function (items, config) {
                        return $q(function (resolve, reject) {

                            editorService.open({
                                view: '/app_plugins/vendr/views/dialogs/printoptions.html',
                                config: {
                                    storeId: items[0].storeId,
                                    entityType: items[0].entityType,
                                    entityHasLanguageIsoCode: items[0].entityType === 'Order',
                                    entities: items.map(itm => {
                                        return {
                                            id: itm.id,
                                            name: itm.entityType === 'Order' ? '#' + itm.orderNumber : itm.name
                                        }
                                    }),
                                    category: items[0].entityType
                                },
                                close: function () {
                                    editorService.close();
                                }
                            });

                            // We don't need to sit around for this one
                            // as it's not a bulk action that performs 
                            // an ongoing task
                            resolve({ canceled: true });

                        });
                    },
                    condition: function (ctx) {
                        if (ctx.entityType !== 'Order' && ctx.entityType !== 'GiftCard' && ctx.entityType !== 'Discount')
                            return false
                        return vendrPrintTemplateResource.getPrintTemplateCount(ctx.storeId, ctx.entityType).then(count => {
                            return count > 0;
                        });
                    }
                }
            }],
            ['$q', 'editorService', 'vendrExportTemplateResource', function ($q, editorService, vendrExportTemplateResource) {
                return {
                    name: 'Export',
                    icon: 'icon-sharing-iphone',
                    bulkAction: function (items, config) {
                        return $q(function (resolve, reject) {

                            editorService.open({
                                view: '/app_plugins/vendr/views/dialogs/export.html',
                                size: 'small',
                                config: {
                                    storeId: items[0].storeId,
                                    entityType: items[0].entityType,
                                    entityHasLanguageIsoCode: items[0].entityType === 'Order',
                                    entities: items.map(itm => {
                                        return {
                                            id: itm.id,
                                            name: itm.entityType === 'Order' ? '#' + itm.orderNumber : itm.name
                                        }
                                    }),
                                    category: items[0].entityType
                                },
                                close: function () {
                                    editorService.close();
                                    resolve({ canceled: true });
                                }
                            });

                            // We don't need to sit around for this one
                            // as it's not a bulk action that performs 
                            // an ongoing task
                            // resolve({ canceled: true });

                        });
                    },
                    condition: function (ctx) {
                        if (ctx.entityType !== 'Order' && ctx.entityType !== 'GiftCard' && ctx.entityType !== 'Discount')
                            return false
                        return vendrExportTemplateResource.getExportTemplateCount(ctx.storeId, ctx.entityType).then(count => {
                            return count > 0;
                        });
                    }
                }
            }],
            ['$q', 'vendrEntityResource', function ($q, vendrEntityResource) {
                return {
                    name: 'Delete',
                    icon: 'icon-trash',
                    itemAction: function (item, config) {
                        return vendrEntityResource.deleteEntity(item.entityType, item.id);
                    },
                    getConfirmMessage: function (total) {
                        return $q.resolve("Are you sure you want to delete " + total + " " + (total > 1 ? "items" : "item") + "?");
                    },
                    condition: function (ctx) {
                        return true;
                    }
                }
            }],
        ];

        provider.menuActions = [];

        provider.editorActions = [
            ['$q', 'editorService', 'vendrOrderResource', function ($q, editorService, vendrOrderResource) {
                return {
                    name: 'Change Status',
                    action: function (model) {
                        return $q(function (resolve, reject) {
                            editorService.open({
                                view: '/app_plugins/vendr/views/dialogs/orderstatuspicker.html',
                                size: 'small',
                                config: {
                                    storeId: model.storeId
                                },
                                submit: function (model2) {
                                    vendrOrderResource.changeOrderStatus(model.id, model2.id).then(function (order) {
                                        model.orderStatusId = order.orderStatusId;
                                        model.orderStatus = order.orderStatus;
                                        editorService.close();
                                        resolve({
                                            success: true,
                                            message: "Order status successfully changed to " + model2.name + "."
                                        })
                                    }).catch(function (e) {
                                        reject({
                                            message: "Unabled to change status to " + model2.name + ". Please check the error log for details."
                                        })
                                    });
                                },
                                close: function () {
                                    editorService.close();
                                    resolve({ canceled: true })
                                }
                            });
                        });
                    },
                    condition: function (ctx) {
                        return ctx.entityType === 'Order';
                    }
                }
            }],
            ['$q', 'editorService', 'vendrEmailTemplateResource', 'vendrEmailResource', function ($q, editorService, vendrEmailTemplateResource, vendrEmailResource) {
                return {
                    name: 'Send Email',
                    action: function (model) {
                        return $q(function (resolve, reject) {

                            var sendEmailDialogOptions = {
                                view: '/app_plugins/vendr/views/dialogs/sendemail.html',
                                size: 'small',
                                config: {
                                    storeId: model.storeId,
                                    orderId: model.entityType === 'Order' ? model.id : model.orderId,
                                    emailTemplateId: undefined,
                                    emailTemplateName: undefined
                                },
                                submit: function (model2) {
                                    var action = model.entityType === 'Order'
                                        ? vendrEmailResource.sendOrderEmail
                                        : vendrEmailResource.sendGiftCardEmail;
                                    action(model2.emailTemplateId, model.id, model2.to, model2.languageIsoCode).then(function () {
                                        editorService.closeAll();
                                        resolve({
                                            success: true,
                                            message: model2.emailTemplateName + " email successfully sent."
                                        })
                                    }).catch(function (e) {
                                        var msg = "Unabled to send " + model.name + " email. Please check the error log for details.";
                                        if (e.data.Message) {
                                            msg = e.data.Message;
                                        }
                                        reject({
                                            message: msg
                                        });
                                    });
                                },
                                close: function () {
                                    editorService.close();
                                }
                            };

                            var pickEmailTemplateDialogOptions = {
                                view: '/app_plugins/vendr/views/dialogs/emailtemplatepicker.html',
                                size: 'small',
                                config: {
                                    storeId: model.storeId,
                                    category: model.entityType
                                },
                                submit: function (model2) {
                                    sendEmailDialogOptions.config.emailTemplateId = model2.id;
                                    sendEmailDialogOptions.config.emailTemplateName = model2.name;
                                    editorService.open(sendEmailDialogOptions);
                                },
                                close: function () {
                                    editorService.close();
                                    resolve({ canceled: true })
                                }
                            };

                            editorService.open(pickEmailTemplateDialogOptions);

                        });
                    },
                    condition: function (ctx) {
                        if (ctx.entityType !== 'Order' && ctx.entityType !== 'GiftCard' && ctx.entityType !== 'Discount')
                            return false
                        return vendrEmailTemplateResource.getEmailTemplateCount(ctx.storeId, ctx.entityType).then(count => {
                            return count > 0;
                        });
                    }
                }
            }],
            ['$q', 'editorService', 'vendrPrintTemplateResource', function ($q, editorService, vendrPrintTemplateResource) {
                return {
                    name: function (model) {
                        return 'Print ' + model.entityType.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                    },
                    action: function (model) {
                        return $q(function (resolve, reject) {

                            editorService.open({
                                view: '/app_plugins/vendr/views/dialogs/printoptions.html',
                                config: {
                                    storeId: model.storeId,
                                    entityType: model.entityType,
                                    entityHasLanguageIsoCode: model.entityType === 'Order',
                                    entities: [
                                        {
                                            id: model.id,
                                            name: model.entityType === 'Order' ? '#' + model.orderNumber : model.name
                                        }
                                    ],
                                    category: model.entityType
                                },
                                close: function () {
                                    resolve({ canceled: true })
                                    editorService.close();
                                }
                            });

                        });
                    },
                    condition: function (ctx) {
                        if (ctx.entityType !== 'Order' && ctx.entityType !== 'GiftCard' && ctx.entityType !== 'Discount')
                            return false
                        return vendrPrintTemplateResource.getPrintTemplateCount(ctx.storeId, ctx.entityType).then(count => {
                            return count > 0;
                        });
                    }
                }
            }]
        ];

        provider.$get = ['$q', '$injector', function ($q, $injector) {

            var compiledBulkActions = [];
            var compiledMenuActions = [];
            var compiledEditorActions = [];

            provider.bulkActions.forEach(function (itm, idx) {
                var compiled = $injector.invoke(itm);
                if (!compiled.sortOrder) {
                    compiled.sortOrder = (idx + 1) * 100;
                }
                compiledBulkActions.push(compiled);
            });

            provider.menuActions.forEach(function (itm) {
                compiledMenuActions.push(itm); //$injector.invoke(itm));
            });

            provider.editorActions.forEach(function (itm, idx) {
                var compiled = $injector.invoke(itm);
                if (!compiled.sortOrder) {
                    compiled.sortOrder = (idx + 1) * 100;
                }
                compiledEditorActions.push(compiled); //$injector.invoke(itm));
            });

            // We can pre-sort the bulk actions now as we have all the bulk actions
            // defined in javascript
            compiledBulkActions.sort(function (a, b) {
                return a.sortOrder < b.sortOrder ? -1 : (a.sortOrder > b.sortOrder ? 1 : 0);
            });

            compiledEditorActions.sort(function (a, b) {
                return a.sortOrder < b.sortOrder ? -1 : (a.sortOrder > b.sortOrder ? 1 : 0);
            });

            // We can't pre-sort the menuActions as we combine these
            // together with the system defined menu items which we
            // capture with an interceptor

            return {
                getBulkActions: function (ctx) {
                    return $q.all(compiledBulkActions.map((itm1, idx1) => $q.when(!itm1.condition || itm1.condition(ctx))))
                        .then(result => {
                            return compiledBulkActions.filter((itm2, idx2) => {
                                return result[idx2];
                            });
                        });
                },
                getMenuActions: function (ctx) {
                    return $q.all(compiledMenuActions.map((itm1, idx1) => $q.when(!itm1.condition || itm1.condition(ctx))))
                        .then(result => {
                            return compiledMenuActions.filter((itm2, idx2) => {
                                return result[idx2];
                            });
                        });
                },
                getEditorActions: function (ctx) {
                    return $q.all(compiledEditorActions.map((itm1, idx1) => $q.when(!itm1.condition || itm1.condition(ctx))))
                        .then(result => {
                            return compiledEditorActions.filter((itm2, idx2) => {
                                return result[idx2];
                            });
                        });
                }
            };

        }];
    };

    angular.module('vendr').provider('vendrActions', ActionsProvider);

}());
