(function () {

    'use strict';

    function vendrOrderSearch($rootScope, $timeout, $location, angularHelper, assetsService, vendrOrderResource, vendrUtils) {

        function link(scope, el, attr, ctrl) {

            var typeahead;

            assetsService.loadJs("lib/typeahead.js/typeahead.bundle.min.js").then(function () {

                var sources = {
                    // see: https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#options
                    // name = the data set name, we'll make this the tag group name + culture
                    name: "vendr_order_search_" + scope.storeId,
                    display: "orderNumber",
                    //source: tagsHound
                    source: function (query, syncCallback, asyncCallback) {
                        vendrOrderResource.searchOrders(scope.storeId, {
                            pageNumber: 1,
                            pageSize: 10,
                            searchTerm: query
                        }).then(function (entities) {
                            entities.items.forEach(function (itm) {
                                itm.routePath = '/commerce/vendr/order-edit/' + vendrUtils.createCompositeId([scope.storeId, itm.id]);
                            });
                            asyncCallback(entities.items);
                        });
                    },
                    templates: {
                        suggestion: function (data) {
                            return '<div class="vendr-search__result"><span class="vendr-search__result__icon"><i class="icon ' + data.icon + '"></i></span><span class="vendr-search__result__body"><span class="vendr-search__result__heading">#' + data.orderNumber + '</span><br /><span class="vendr-search__result__sub-heading">' + data.customerFullName + '</span></span></div>';
                        }
                    }
                };

                var opts = {
                    hint: true,
                    highlight: true,
                    cacheKey: new Date(),
                    minLength: 1
                };

                typeahead = el.find('input').typeahead(opts, sources)
                    .bind("typeahead:selected", function (obj, datum, name) {
                        angularHelper.safeApply($rootScope, function () {
                            $location.path(datum.routePath);
                        });
                    }).bind("typeahead:autocompleted", function (obj, datum, name) {
                        angularHelper.safeApply($rootScope, function () {
                            $location.path(datum.routePath);
                        });
                    });

            });

        }

        var directive = {
            restrict: 'E',
            replace: true,
            template: `<div class="vendr-search">
    <span><i class="fa fa-search vendr-search__icon"></i></span><span class="vendr-search__input-wrapper"><input type="text" placeholder="Search for an Order" class="vendr-search__input" /></span>
</div>`,
            scope: {
                storeId: '='
            },
            link: link
        };
        
        return directive;
    };

    angular.module('vendr.directives').directive('vendrOrderSearch', vendrOrderSearch);

}());