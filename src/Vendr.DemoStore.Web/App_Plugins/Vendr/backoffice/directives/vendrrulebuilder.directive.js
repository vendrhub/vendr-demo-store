(function () {

    'use strict';

    // Helpers
    function vendrDiscountRuleProviderScaffoldToConfig(scaffold, vendrUtils) {
        return {
            id: vendrUtils.generateGuid(),
            ruleProviderAlias: scaffold.alias,
            settings: scaffold.settingDefinitions.reduce(function (map, obj) {
                map[obj.key] = null;
                return map;
            }, {}),
            children: []
        };
    }

    // Rule Builder
    function vendrRuleBuilder($rootScope, vendrDiscountResource, vendrUtils, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {

            scope.ready = false;

            // We only fetch the defs here to ensure the cache is set
            // so that child rules can reuse them
            vendrRouteCache.getOrFetch("discountRuleProviderDefs", () => vendrDiscountResource.getDiscountRuleProviderDefinitions()).then(function (defs) {
                if (!scope.ngModel) {
                    vendrDiscountResource.getDiscountRuleProviderScaffold("groupDiscountRule").then(function (scaffold) {
                        scope.ngModel = vendrDiscountRuleProviderScaffoldToConfig(scaffold, vendrUtils);
                        scope.ready = true;
                    });
                } else {
                    scope.ready = true;
                }
            });
            
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-rule-builder">
                <vendr-rule-builder-item ng-if="ngModel && ready"
                    ng-model="ngModel" level="0" index="0">
                </vendr-rule-builder-item>
            </div>`,
            scope: {
                ngModel: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrRuleBuilder', vendrRuleBuilder);

    // Item
    function vendrRuleBuilderItem() {

        function link(scope, el, attr, ctrl) { }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-rule-builder__group-item">
                <vendr-rule-builder-rule-group ng-if="ngModel.ruleProviderAlias == 'groupDiscountRule'" ng-model="ngModel" level="level" index="index"></vendr-rule-builder-rule-group>
                <vendr-rule-builder-rule ng-if="ngModel.ruleProviderAlias != 'groupDiscountRule'" ng-model="ngModel" level="level" index="index"></vendr-rule-builder-rule>
            </div >`,
            scope: {
                ngModel: '=',
                level: '=',
                index: '='
            },
            link: link
        };

        return directive;
    };

    angular.module('vendr.directives').directive('vendrRuleBuilderItem', vendrRuleBuilderItem);

    // Rule Group
    function vendrRuleBuilderRuleGroup($rootScope, $timeout, $q, editorService, vendrDiscountResource, vendrUtils, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {

            scope.matchTypes = ["All", "Any"];

            if (!scope.ngModel.settings.matchType) {
                scope.ngModel.settings.matchType = scope.matchTypes[0];
            }

            var discountRuleProviderPickerDialogOptions = {
                view: '/App_Plugins/Vendr/backoffice/views/dialogs/discountruleproviderpicker.html',
                size: 'small',
                config: { },
                submit: function (model) {
                    vendrRouteCache.getOrFetch("discountRuleProviderScaffold_" + model.alias,
                        () => vendrDiscountResource.getDiscountRuleProviderScaffold(model.alias)).then(function (scaffold) {

                        // Create config and add to children
                        scope.ngModel.children = scope.ngModel.children || [];

                        var configScaffold = vendrDiscountRuleProviderScaffoldToConfig(scaffold, vendrUtils);
                        
                        // Close the dialog or open the editor depending on the rule
                        if (scaffold.alias === "groupDiscountRule") {

                            scope.ngModel.children.push(configScaffold);
                            editorService.close();

                        } else {

                            settingsEditorDialogOptions.config.name = "Edit " + scaffold.name;
                            settingsEditorDialogOptions.config.scaffold = configScaffold;
                            settingsEditorDialogOptions.config.settings = configScaffold.settings;
                            settingsEditorDialogOptions.config.loadSettingDefinitions = function () {
                                return $q.when(scaffold.settingDefinitions);
                            };

                            editorService.open(settingsEditorDialogOptions);
                        }
                    });
                },
                close: function () {
                    editorService.close();
                }
            };

            var settingsEditorDialogOptions = {
                view: '/App_Plugins/Vendr/backoffice/views/dialogs/settingseditor.html',
                size: 'small',
                config: { },
                submit: function (settings) {

                    // NB: If you edit this, be sure to also edit the settingsEditorOptions in the
                    // rule directive below

                    // Grab scaffold from config
                    var configScaffold = this.config.scaffold;

                    // Map settings back to scaffold
                    Object.keys(settings).forEach(function (key) {
                        configScaffold.settings[key] = settings[key];
                    });

                    // Add scaffold to config
                    scope.ngModel.children.push(configScaffold);

                    // Close the dialog
                    editorService.closeAll();
                },
                close: function () {
                    editorService.close();
                }
            };

            scope.sortableOptions = {
                axis: "y",
                cursor: "move",
                handle: ".handle--" + scope.level,
                placeholder: 'sortable-placeholder',
                items: ".vendr-rule-builder__group-item",
                forcePlaceholderSize: true
            };

            scope.addRule = function () {
                editorService.open(discountRuleProviderPickerDialogOptions);
            };

            scope.deleteGroup = function () {
                if (scope.level > 0) {
                    // We can't delete ourselves so we emit an event for the parent group to do it
                    scope.$emit("deleteRuleBuilderItem", { level: scope.level, index: scope.index });
                }
            };

            scope.$on("deleteRuleBuilderItem", function (evt, data) {
                if (data.level === scope.level + 1) {
                    scope.ngModel.children.splice(data.index, 1);
                }
            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-rule-builder__group">
                <div class="vendr-rule-builder__group-header py-5">
                    <div class="vendr-split">
                        <div class="flex items-center px-10">
                            <a href="#" class="px-10 -ml-5 handle handle--{{level - 1}}" ng-if="level > 0" title="Move Rule" aria-hidden="true"><i class="fa fa-ellipsis-v"></i></a>
                            <span class="mr-10 strong">Match:</span><select ng-model="ngModel.settings.matchType" ng-options="matchType for matchType in matchTypes"></select>
                        </div>
                        <div class="flex items-center"><button type="button" class="btn" ng-click="deleteGroup()" ng-if="level > 0" title="Remove Group" aria-hidden="true"><i class="fa fa-trash"></i></button></div>
                    </div>
                </div>
                <div class="vendr-rule-builder__group-inner">
                    <div ui-sortable="sortableOptions" ng-model="ngModel.children">
                        <vendr-rule-builder-item ng-model="itm" 
                            ng-repeat="itm in ngModel.children track by itm.id" 
                            level="level + 1"
                            index="$index">
                        </vendr-rule-builder-item>
                    </div>
                    <button type="button" class="umb-node-preview-add" ng-click="addRule()">
                        <span>Add Rule</span>
                        <span class="sr-only">...</span>
                    </button>
                </div>
            </div>`,
            scope: {
                ngModel: '=',
                level: '=',
                index: '='
            },
            link: link
        };

        return directive;
    };

    angular.module('vendr.directives').directive('vendrRuleBuilderRuleGroup', vendrRuleBuilderRuleGroup);

    // Rule 
    function vendrRuleBuilderRule($rootScope, $interpolate, editorService, vendrDiscountResource, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {

            function generateLabelModel() {

                var item = angular.copy(scope.ngModel.settings || {});

                item["$index"] = scope.index;
                item["$level"] = scope.level;

                item["$ruleName"] = scope.discountRuleDefinition.name;
                item["$ruleAlias"] = scope.discountRuleDefinition.alias;

                scope.labelModel = item;

            }

            var settingsEditorDialogOptions = {
                view: '/App_Plugins/Vendr/backoffice/views/dialogs/settingseditor.html',
                size: 'small',
                config: {
                    loadSettingDefinitions: function () {
                        return vendrRouteCache.getOrFetch("discountRuleProviderScaffold_" + scope.ngModel.ruleProviderAlias, 
                            () => vendrDiscountResource.getDiscountRuleProviderScaffold(scope.ngModel.ruleProviderAlias)).then(function (scaffold) {
                            return scaffold.settingDefinitions;
                        });
                    },
                    settings: scope.ngModel.settings
                },
                submit: function (settings) {

                    // NB: If you edit this, be sure to also edit the settingsEditorOptions in the
                    // group directive above

                    // Map settings back to ngModel
                    Object.keys(settings).forEach(function (key) {
                        scope.ngModel.settings[key] = settings[key];
                    });

                    // Regenerate the label model
                    generateLabelModel();

                    // Close the dialog
                    editorService.closeAll();

                },
                close: function () {
                    editorService.closeAll();
                }
            };

            scope.editRule = function () {
                editorService.open(settingsEditorDialogOptions);
            };

            scope.deleteRule = function () {
                if (scope.level > 0) {
                    // We can't delete ourselves so we emit an event for the parent group to do it
                    scope.$emit("deleteRuleBuilderItem", { level: scope.level, index: scope.index });
                }
            };

            scope.$on("editRuleBuilderItem", function (evt, data) {
                if (data.level === scope.level && data.index === scope.index) {
                    scope.editRule();
                }
            });

            vendrRouteCache.get("discountRuleProviderDefs").then(function (defs) {

                scope.discountRuleDefinition = defs.find((el) => el.alias == scope.ngModel.ruleProviderAlias);

                scope.labelView = scope.discountRuleDefinition.labelView.endsWith(".html")
                    ? scope.discountRuleDefinition.labelView
                    : "/App_Plugins/Vendr/backoffice/views/discount/rules/labelviews/" + scope.discountRuleDefinition.labelView.toLowerCase() + ".html";

                settingsEditorDialogOptions.config.name = "Edit " + scope.discountRuleDefinition.name;

                generateLabelModel();

            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div>
                <div class="vendr-rule-builder__rule" ng-if="discountRuleDefinition">
                    <div class="vendr-split">
                        <div class="flex items-center">
                            <span class="px-10 -ml-5 cursor-move handle handle--{{level - 1}}" ng-if="level > 0" title="Move Rule" aria-hidden="true"><i class="fa fa-ellipsis-v"></i></span>
                            <button type="button" ng-click="editRule()" class="btn-reset strong pr-5" title="Edit Rule">
                                <vendr-scoped-include view="labelView" model="labelModel" ng-if="labelView"></vendr-scoped-include>
                            </button>
                        </div>
                        <div class="flex items-center">
                            <button type="button" ng-click="editRule()" class="vendr-inline-button mr-5" title="Edit Rule" aria-hidden="true"><i class="fa fa-pencil"></i></button>
                            <button type="button" ng-click="deleteRule()" class="vendr-inline-button" ng-if="level > 0"  title="Remove Rule" aria-hidden="true"><i class="fa fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>`,
            scope: {
                ngModel: '=',
                level: '=',
                index: '='
            },
            link: link
        };

        return directive;
    };

    angular.module('vendr.directives').directive('vendrRuleBuilderRule', vendrRuleBuilderRule);

}());