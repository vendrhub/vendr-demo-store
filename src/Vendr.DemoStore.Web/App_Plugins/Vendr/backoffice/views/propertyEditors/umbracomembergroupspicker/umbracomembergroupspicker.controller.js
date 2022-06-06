(function () {

    'use strict';

    function UmbracoMemberGroupsPickerController($scope, editorService, memberGroupResource) 
    {
        $scope.pickGroup = function() {
            editorService.memberGroupPicker({
                multiPicker: true,
                submit: function (model) {
                    var selectedGroupIds = _.map(model.selectedMemberGroups
                        ? model.selectedMemberGroups
                        : [model.selectedMemberGroup],
                        function(id) { return parseInt(id) }
                    );
                    memberGroupResource.getByIds(selectedGroupIds).then(function (selectedGroups) {
                        $scope.model.value = $scope.model.value || [];
                        _.each(selectedGroups, function(group) {
                            var foundIndex = $scope.model.value.findIndex(function (itm) {
                                return itm == group.name;
                            });
                            if (foundIndex == -1){
                                $scope.model.value.push(group.name);
                            }
                        });
                    });
                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            });
        }

        $scope.removeGroup = function (group) {
            var foundIndex = $scope.model.value.findIndex(function (itm) {
                return itm == group;
            });
            if (foundIndex > -1){
                $scope.model.value.splice(foundIndex, 1);
            }
        }
    }

    angular.module('vendr').controller('Vendr.Controllers.UmbracoMemberGroupsPickerController', UmbracoMemberGroupsPickerController);

}());