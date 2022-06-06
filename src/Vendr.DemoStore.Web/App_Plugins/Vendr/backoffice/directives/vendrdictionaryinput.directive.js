(function () {

    'use strict';

    function vendrDictionaryInput($routeParams, listViewHelper, angularHelper,
        vendrDictionaryResource, editorService, overlayService) {

        function link(scope, el, attr, ctrl) {

            scope.autoCompleteOptions = {
                minimumChars: 3,
                dropdownCssClass: 'dropdown-menu',
                selectedCssClass: 'vendr-auto-complete-item-selected',
                itemTemplate: "<a>{{entry.item}}</a>",
                noMatchTemplateEnabled: false,
                autoHideDropdown: true,
                data: function (searchKey) {

                    if (!searchKey.startsWith('#'))
                        return false;

                    searchKey = searchKey.substr(1);

                    return vendrDictionaryResource.searchKeys(searchKey, 5, scope.containerKey).then(function (keys) {
                        return keys.map(function (key) {
                            return '#' + key;
                        });
                    });

                },
                itemSelected: function (itm) {
                    scope.ngModel = itm.item;
                }
            };

            scope.openDictionaryEditor = function () {

                var launchDictionaryEditorDialog = function (cfg) {

                    var dictionaryEditorDialogConfig = {
                        view: '/App_Plugins/Vendr/backoffice/views/dialogs/dictionaryedit.html',
                        size: 'small',
                        config: cfg,
                        submit: function (model) {
                            if (model) {
                                scope.ngModel = '#' + model.key;
                            }
                            editorService.close();
                        },
                        close: function () {
                            editorService.close();
                        }
                    };

                    editorService.open(dictionaryEditorDialogConfig);
                };

                vendrDictionaryResource.ensureRootDictionaryItem(scope.containerKey).then(function (containerId) {

                    

                    if (scope.ngModel && scope.ngModel.startsWith('#')) {
                        vendrDictionaryResource.tryGetDictionaryItemIdByKey(scope.ngModel.substr(1)).then(function (id) {
                            if (id) {
                                launchDictionaryEditorDialog({
                                    id: id
                                });
                            } else {

                                overlayService.open({
                                    title: "Create Dictionary Item",
                                    view: "default",
                                    content: "Dictionary item with key '" + scope.ngModel + "' does not exist. Create it?",
                                    submitButtonLabelKey: "general_yes",
                                    closeButtonLabelKey: "general_cancel",
                                    submit: function () {
                                        overlayService.close();
                                        setTimeout(function () {
                                            launchDictionaryEditorDialog({
                                                id: '-1',
                                                parentId: containerId,
                                                name: scope.ngModel.substr(1)
                                            });
                                        }, 1);
                                    },
                                    close: function () {
                                        overlayService.close();
                                    }
                                });
                            }
                        });
                    } else if (scope.ngModel) {

                        overlayService.open({
                            title: "Convert to Dictionary Item",
                            view: "default",
                            content: "Convert value '" + scope.ngModel + "' into a dictionary item?",
                            submitButtonLabelKey: "general_yes",
                            closeButtonLabelKey: "general_cancel",
                            submit: function () {
                                overlayService.close();
                                setTimeout(function () {
                                    launchDictionaryEditorDialog({
                                        id: '-1',
                                        parentId: containerId,
                                        name: scope.onGenerateKey(scope.name),
                                        value: scope.ngModel
                                    });
                                }, 1);
                            },
                            close: function () {
                                overlayService.close();
                            }
                        });
                        
                    } else {
                        launchDictionaryEditorDialog({
                            id: '-1',
                            parentId: containerId,
                            name: scope.onGenerateKey(scope.name),
                            value: ''
                        });
                    }

                });
            };

        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/App_Plugins/Vendr/backoffice/views/directives/vendr-dictionary-input.html',
            scope: {
                ngModel: '=',
                name: '@',
                containerKey: '=',
                onGenerateKey: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrDictionaryInput', vendrDictionaryInput);

}());