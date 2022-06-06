(function () {

    'use strict';

    function vendrTagsEditorController($rootScope, $timeout, $element, assetsService, angularHelper, vendrRequestHelper) {

        let vm = this;

        let typeahead;
        let tagsHound;

        vm.$onInit = onInit;
        vm.$onChanges = onChanges;
        vm.$onDestroy = onDestroy;

        vm.addTagOnEnter = addTagOnEnter;
        vm.addTag = addTag;
        vm.removeTag = removeTag;
        vm.onKeyUpOnTag = onKeyUpOnTag;

        vm.isLoading = true;
        vm.tagToAdd = "";
        vm.viewModel = [];

        function onInit() 
        {
            vm.inputId = vm.inputId || "t" + String.CreateGuid();

            assetsService.loadJs("lib/typeahead.js/typeahead.bundle.min.js").then(function () {

                vm.isLoading = false;

                //ensure that the models are formatted correctly
                configureViewModel(true);

                tagsHound = new Bloodhound({
                    initialize: false,
                    datumTokenizer: Bloodhound.tokenizers.whitespace,
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    //pre-fetch the tags for this category
                    prefetch: {
                        url: vendrRequestHelper.getApiUrl("tagApiBaseUrl", "GetTags", { storeId: vm.storeId }),
                        //TTL = 5 minutes
                        ttl: 300000
                    },
                    //dynamically get the tags for this category (they may have changed on the server)
                    remote: {
                        url: vendrRequestHelper.getApiUrl("tagApiBaseUrl", "GetTags", { storeId: vm.storeId, query: "%QUERY" }),
                        wildcard: "%QUERY"
                    }
                });

                tagsHound.initialize().then(function() {

                    //configure the type ahead

                    var sources = {
                        //see: https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#options
                        name: vm.storeId,
                        source: function (query, syncCallback, asyncCallback) {
                            tagsHound.search(query,
                                function(suggestions) {
                                    syncCallback(removeCurrentTagsFromSuggestions(suggestions));
                                }, function(suggestions) {
                                    asyncCallback(removeCurrentTagsFromSuggestions(suggestions));
                                });
                        }
                    };

                    var opts = {
                        hint: true,
                        highlight: true,
                        cacheKey: new Date(),  // Force a cache refresh each time the control is initialized
                        minLength: 1
                    };

                    typeahead = $element.find('.tags-' + vm.inputId).typeahead(opts, sources)
                        .bind("typeahead:selected", function (obj, datum, name) {
                            angularHelper.safeApply($rootScope, function () {
                                addTagInternal(datum.toLowerCase());
                                vm.tagToAdd = "";
                                // clear the typed text
                                typeahead.typeahead('val', '');
                            });
                        }).bind("typeahead:autocompleted", function (obj, datum, name) {
                            angularHelper.safeApply($rootScope, function () {
                                addTagInternal(datum.toLowerCase());
                                vm.tagToAdd = "";
                                // clear the typed text
                                typeahead.typeahead('val', '');
                            });

                        }).bind("typeahead:opened", function (obj) {

                        });

                });

            });
        }

        /**
         * Watch for value changes
         * @param {any} changes
         */
        function onChanges(changes) {
            //when the model 'value' changes, sync the viewModel object
            if (changes.value) {
                if (!changes.value.isFirstChange() && changes.value.currentValue !== changes.value.previousValue) {
                    configureViewModel();
                }
            }
        }

        function onDestroy() {
            if (tagsHound) {
                tagsHound.clearPrefetchCache();
                tagsHound.clearRemoteCache();
                tagsHound = null;
            }
            $element.find('.tags-' + vm.inputId).typeahead('destroy');
        }

        function configureViewModel(isInitLoad) {
            if (vm.value) {
                if (Utilities.isString(vm.value) && vm.value.length > 0) {
                    if (vm.config.storageType === "Json") {
                        //json storage
                        vm.viewModel = JSON.parse(vm.value);

                        //if this is the first load, we are just re-formatting the underlying model to be consistent
                        //we don't want to notify the component parent of any changes, that will occur if the user actually
                        //changes a value. If we notify at this point it will signal a form dirty change which we don't want.
                        if (!isInitLoad) {
                            updateModelValue(vm.viewModel);
                        }
                    }
                    else {
                        //csv storage

                        // split the csv string, and remove any duplicate values
                        let tempArray = vm.value.split(',').map(function (v) {
                            return v.trim();
                        });

                        vm.viewModel = tempArray.filter(function (v, i, self) {
                            return self.indexOf(v) === i;
                        });

                        //if this is the first load, we are just re-formatting the underlying model to be consistent
                        //we don't want to notify the component parent of any changes, that will occur if the user actually
                        //changes a value. If we notify at this point it will signal a form dirty change which we don't want.
                        if (!isInitLoad) {
                            updateModelValue(vm.viewModel);
                        }
                    }
                }
                else if (Utilities.isArray(vm.value)) {
                    vm.viewModel = vm.value;
                }
            }
        }

        function updateModelValue(val) {
            val = val ? val : [];
            vm.onValueChanged({ value: val });
        }

        function addTagInternal(tagToAdd) {
            if (tagToAdd != null && tagToAdd.length > 0) {
                if (vm.viewModel.indexOf(tagToAdd) < 0) {
                    vm.viewModel.push(tagToAdd);
                    updateModelValue(vm.viewModel);
                }
            }
        }

        function addTagOnEnter(e) {
            var code = e.keyCode || e.which;
            if (code == 13) { //Enter keycode
                if ($element.find('.tags-' + vm.inputId).parent().find(".tt-menu .tt-cursor").length === 0) {
                    //this is required, otherwise the html form will attempt to submit.
                    e.preventDefault();
                    addTag();
                }
            }
        }
        function addTag() {
            //ensure that we're not pressing the enter key whilst selecting a typeahead value from the drop down
            //we need to use jquery because typeahead duplicates the text box
            addTagInternal(vm.tagToAdd);
            vm.tagToAdd = "";
            //this clears the value stored in typeahead so it doesn't try to add the text again
            // https://issues.umbraco.org/issue/U4-4947
            typeahead.typeahead('val', '');
        }

        function removeTag(tag) {
            var i = vm.viewModel.indexOf(tag);
            if (i >= 0) {
                // Remove the tag from the index
                vm.viewModel.splice(i, 1);
                updateModelValue(vm.viewModel);
            }
        }

        function onKeyUpOnTag(tag, $event) {
            if ($event.keyCode === 8 || $event.keyCode === 46) {
                removeTag(tag);
            }
        }

        // helper method to remove current tags
        function removeCurrentTagsFromSuggestions(suggestions) {
            return $.grep(suggestions, function (suggestion) {
                return ($.inArray(suggestion, vm.viewModel) === -1);
            });
        }

    }

    angular.module('vendr.directives').component('vendrTagsEditor', {
        replace: true,
        transclude: true,
        templateUrl: '/App_Plugins/Vendr/backoffice/views/directives/vendr-tags-editor.html',
        controller: vendrTagsEditorController,
        controllerAs: 'vm',
        bindings: {
            value: "<",
            storeId: "<",
            config: "<",
            inputId: "@?",
            onValueChanged: "&"
        }
    });

}());