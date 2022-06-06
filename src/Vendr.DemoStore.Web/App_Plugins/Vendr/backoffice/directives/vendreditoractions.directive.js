(function () {

    'use strict';

    function vendrEditorActions(notificationsService) {

        function link(scope, el, attr, ctrl) {

            scope.getActionName = function (editorAction) {
                return typeof editorAction.name === 'function'
                    ? editorAction.name(scope.model)
                    : editorAction.name;
            }

            scope.performEditorAction = function (editorAction) {
                editorAction.action(scope.model).then(function (resp) {
                    if (resp && !resp.canceled) {
                        notificationsService.success(scope.getActionName(editorAction) + " Successful",
                            resp.message || scope.getActionName(editorAction) + " successfully executed.");
                    }
                }, function (err) {
                    notificationsService.error(scope.getActionName(editorAction) + " Error",
                        err.message || "Unable to perform action '" + scope.getActionName(editorAction) + "'. Please check the error log for details.");
                });
            }

        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div>
                <umb-box ng-if="editorActions && editorActions.length > 0">
                    <umb-box-header title="Actions"></umb-box-header>
                    <umb-box-content class="block-form">
                        <button type="button" class="btn btn-block"
                            ng-repeat="editorAction in editorActions"
                            ng-class="{ 'btn-action' : $index === 0 }"
                            ng-click="performEditorAction(editorAction)">{{ getActionName(editorAction) }}</button>
                    </umb-box-content>
                </umb-box>
            </div>`,
            scope: {
                editorActions: '<',
                model: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrEditorActions', vendrEditorActions);

}());