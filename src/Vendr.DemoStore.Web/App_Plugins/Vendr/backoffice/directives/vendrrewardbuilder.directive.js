(function () {

    'use strict';

    // Helpers
    function vendrDiscountRewardProviderScaffoldToConfig(scaffold, vendrUtils) {
        return {
            id: vendrUtils.generateGuid(),
            rewardProviderAlias: scaffold.alias,
            settings: scaffold.settingDefinitions.reduce(function (map, obj) {
                map[obj.key] = null;
                return map;
            }, {})
        };
    }

    // Reward Builder
    function vendrRewardBuilder($rootScope, $timeout, $q, editorService, vendrDiscountResource, vendrUtils, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {

            scope.ready = false;

            var discountRewardProviderPickerDialogOptions = {
                view: '/App_Plugins/Vendr/backoffice/views/dialogs/discountrewardproviderpicker.html',
                size: 'small',
                config: { },
                submit: function (model) {
                    vendrRouteCache.getOrFetch("discountRewardProviderScaffold_" + model.alias,
                        () => vendrDiscountResource.getDiscountRewardProviderScaffold(model.alias)).then(function (scaffold) {

                        // Create config and add to children
                        scope.ngModel = scope.ngModel || [];

                        var configScaffold = vendrDiscountRewardProviderScaffoldToConfig(scaffold, vendrUtils);

                        // Open the settings editor
                        settingsEditorDialogOptions.config.name = "Edit " + scaffold.name;
                        settingsEditorDialogOptions.config.scaffold = configScaffold;
                        settingsEditorDialogOptions.config.settings = configScaffold.settings;
                        settingsEditorDialogOptions.config.loadSettingDefinitions = function () {
                            return $q.when(scaffold.settingDefinitions);
                        };

                        editorService.open(settingsEditorDialogOptions);

                    });
                },
                close: function () {
                    editorService.close();
                }
            };

            var settingsEditorDialogOptions = {
                view: '/App_Plugins/Vendr/backoffice/views/dialogs/settingseditor.html',
                size: 'small',
                config: {},
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
                    scope.ngModel.push(configScaffold);

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
                handle: ".handle",
                placeholder: 'sortable-placeholder',
                items: ".vendr-reward-builder__item",
                forcePlaceholderSize: true
            };

            scope.addReward = function () {
                editorService.open(discountRewardProviderPickerDialogOptions);
            };

            scope.$on("deleteRewardBuilderItem", function (evt, data) {
                scope.ngModel.splice(data.index, 1);
            });

            // We only fetch the defs here to ensure the cache is set
            // so that child rules can reuse them
            vendrRouteCache.getOrFetch("discountRewardProviderDefs",
                () => vendrDiscountResource.getDiscountRewardProviderDefinitions()).then(function (defs) {

                if (!scope.ngModel) {
                    scope.ngModel = [];
                }

                scope.ready = true;
            });
            
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-reward-builder">
                <div ng-if="ready">
                    <div ui-sortable="sortableOptions" ng-model="ngModel">
                        <div class="vendr-reward-builder__item" ng-repeat="itm in ngModel track by itm.id">
                            <vendr-reward-builder-reward ng-model="itm" index="$index">
                            </vendr-reward-builder-reward>
                        </div>
                    </div>
                    <button type="button" class="umb-node-preview-add" ng-click="addReward()">
                        <span>Add Reward</span>
                        <span class="sr-only">...</span>
                    </button>
                </div>
            </div>`,
            scope: {
                ngModel: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrRewardBuilder', vendrRewardBuilder);

    // Reward 
    function vendrRewardBuilderReward($rootScope, $interpolate, editorService, vendrDiscountResource, vendrRouteCache) {

        function link(scope, el, attr, ctrl) {

            function generateLabelModel() {

                var item = angular.copy(scope.ngModel.settings || {});

                item["$index"] = scope.index;
                item["$level"] = scope.level;

                item["$rewardName"] = scope.discountRewardDefinition.name;
                item["$rewardAlias"] = scope.discountRewardDefinition.alias;

                scope.labelModel = item;

            };

            var settingsEditorDialogOptions = {
                view: '/App_Plugins/Vendr/backoffice/views/dialogs/settingseditor.html',
                size: 'small',
                config: {
                    loadSettingDefinitions: function () {
                        return vendrRouteCache.getOrFetch("discountRewardProviderScaffold_" + scope.ngModel.rewardProviderAlias, 
                            () => vendrDiscountResource.getDiscountRewardProviderScaffold(scope.ngModel.rewardProviderAlias))
                            .then(function (scaffold) {
                                return scaffold.settingDefinitions;
                            });
                    },
                    settings: scope.ngModel.settings
                },
                submit: function (settings) {
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

            scope.editReward = function () {
                editorService.open(settingsEditorDialogOptions);
            };

            scope.deleteReward = function () {
                // We can't delete ourselves so we emit an event for the parent group to do it
                scope.$emit("deleteRewardBuilderItem", { index: scope.index });
            };

            scope.$on("editRewardBuilderItem", function (evt, data) {
                if (data.index === scope.index) {
                    scope.editReward();
                }
            });

            vendrRouteCache.get("discountRewardProviderDefs").then(function (defs) {

                scope.discountRewardDefinition = defs.find((el) => el.alias == scope.ngModel.rewardProviderAlias);

                scope.labelView = scope.discountRewardDefinition.labelView.endsWith(".html")
                    ? scope.discountRewardDefinition.labelView
                    : "/App_Plugins/Vendr/backoffice/views/discount/rewards/labelviews/" + scope.discountRewardDefinition.labelView.toLowerCase() + ".html";

                settingsEditorDialogOptions.config.name = "Edit " + scope.discountRewardDefinition.name;

                generateLabelModel();

            });

        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div>
                <div class="vendr-reward-builder__reward" ng-if="discountRewardDefinition">
                    <div class="vendr-split">
                        <div class="flex items-center">
                            <span class="px-10 -ml-5 handle cursor-move" prevent-default><i class="fa fa-ellipsis-v" title="Move Reward" aria-hidden="true"></i></span>
                            <button type="button" ng-click="editReward()" class="btn-reset strong pr-5" title="Edit Reward">
                                <vendr-scoped-include view="labelView" model="labelModel" ng-if="labelView"></vendr-scoped-include>
                            </button>
                        </div>
                        <div class="flex items-center">
                            <button type="button" ng-click="editReward()" class="mr-5 vendr-inline-button" title="Edit Reward" aria-hidden="true"><i class="fa fa-pencil" aria-hidden="true"></i></button>
                            <button type="button" ng-click="deleteReward()" class="vendr-inline-button" title="Remove Reward" aria-hidden="true"><i class="fa fa-trash" aria-hidden="true"></i></button>
                        </div>
                    </div>
                </div>
            </div>`,
            scope: {
                ngModel: '=',
                index: '='
            },
            link: link
        };

        return directive;
    };

    angular.module('vendr.directives').directive('vendrRewardBuilderReward', vendrRewardBuilderReward);

}());