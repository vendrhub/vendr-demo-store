(function () {

    'use strict';


    function vendrFilter() {

        function VendrFunctionController($scope) {

            var vm = this;

            vm.loading = true;
            vm.filter = $scope.filter;

            vm.showFilterOptions = false;
            vm.filterOptions = [];
            vm.groupedFilterOptions = {};

            vm.getFilterNames = function () {
                var names = vm.filterOptions.filter(function (itm) {
                    return itm.selected;
                }).map(function (itm) {
                    return (itm.group ? itm.group + " - " : "") + itm.name;
                });
                return names.length > 0 ? names.join(", ") : "All";
            };

            vm.someVisibleValues = function (values) {
                return values.some((val) => !val.hidden);
            }

            vm.setFilter = function (filterOption) {

                var filters = vm.filter.value;

                if (filterOption.selected) {
                    filters.push(filterOption.id);
                } else {
                    var index = filters.indexOf(filterOption.id);
                    filters.splice(index, 1);
                }

                vm.filter.value = filters;

                $scope.onChange({ filter: { alias: vm.alias, options: vm.filter.value } });

            };

            vm.clearFilter = function () {
                if (vm.filter.value.length > 0) {
                    vm.filterOptions.forEach(opt => {
                        opt.selected = false;
                    });
                    vm.filter.value = [];
                    $scope.onChange({ filter: { alias: vm.alias, options: vm.filter.value } });
                }
            };

            vm.filter.getFilterOptions().then(function (filterOptions) {

                var gfo = [];
                var currentGroup = null;

                filterOptions.forEach(itm => {
                    itm.selected = vm.filter.value.findIndex(itm2 => itm2.toString() === itm.id.toString()) > -1;
                    if (!currentGroup || currentGroup.group !== itm.group) {
                        currentGroup = { group: itm.group, items: [itm] }
                        gfo.push(currentGroup)
                    } else {
                        currentGroup.items.push(itm);
                    }
                });
                vm.filterOptions = filterOptions;

                vm.groupedFilterOptions = gfo;
                vm.loading = false;
            });
        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr vendr-filter flex" style="position: relative;">
                <div class="flex" style="position: relative;" ng-show="!vm.loading">
                    <button type="button" class="btn btn-link dropdown-toggle flex" ng-click="vm.showFilterOptions = !vm.showFilterOptions" title="{{ vm.getFilterNames() }}" aria-haspopup="true" aria-expanded="{{vm.showFilterOptions === undefined ? false : vm.showFilterOptions}}">
                        <span>{{vm.filter.name}}:</span>
                        <span class="bold truncate dib" style="margin-left: 5px; margin-right: 3px; max-width: 150px;">{{ vm.getFilterNames() }}</span>
                        <span class="caret"></span>
                    </button>
                    <umb-dropdown class="pull-left" ng-if="vm.showFilterOptions" on-close="vm.showFilterOptions = false;" style="padding-top: 8px">
                        <umb-dropdown-item ng-repeat-start="g in vm.groupedFilterOptions" ng-if="g.group && g.group !== 'undefined' && vm.someVisibleValues(g.items)" style="padding: 8px 20px 0 16px;">
                            <strong>{{ g.group }}</strong>
                        </umb-dropdown-item>
                        <umb-dropdown-item ng-repeat="filterOption in g.items" ng-if="!filterOption.hidden" ng-repeat-end style="padding: 8px 20px 8px 16px;">
                            <div class="flex items-center">
                                <umb-checkbox input-id="filter-{{vm.filter.alias}}-{{$index}}" name="filter-{{vm.filter.alias}}" model="filterOption.selected" on-change="vm.setFilter(filterOption)"></umb-checkbox>
                                <label for="filter-{{vm.filter.alias}}-{{$index}}" class="m-0">
                                    <span ng-if="!filterOption.color" class="m-0 nowrap">{{filterOption.name}}</span>
                                    <umb-badge ng-if="filterOption.color" class="{{ 'm-0 nowrap umb-badge--s vendr-bg--' + filterOption.color }}">{{filterOption.name}}</umb-badge>
                                </label>
                            </div>
                        </umb-dropdown-item>
                        <umb-dropdown-item style="padding-top: 8px"></umb-dropdown-item>
                        <umb-dropdown-item ng-if="vm.filter.value.length > 0">
                            <hr class="m-0" />
                            <button type="button" ng-click="vm.clearFilter()" style="padding-left: 16px; display: flex; width: 100%;"><i class="icon icon-delete mr-10" aria-hidden="true"></i> Clear</button>
                        </umb-dropdown-item>
                    </umb-dropdown>
                </div>
            </div>`,
            scope: {
                filter: '=',
                onChange: "&"
            },
            controller: VendrFunctionController,
            controllerAs: 'vm'
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrFilter', vendrFilter);

}());