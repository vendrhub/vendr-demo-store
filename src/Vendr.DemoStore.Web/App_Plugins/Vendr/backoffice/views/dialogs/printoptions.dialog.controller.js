(function () {

    'use strict';

    function PrintOptionsDialogController($scope, languageResource, vendrPrintTemplateResource)
    {
        var cfg = $scope.model.config;

        var vm = this;

        vm.loading = true;

        vm.page = {};
        vm.page.name = "Print " + cfg.entityType.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        vm.page.printButtonState = 'init';

        vm.printUrl = false;
        vm.languageIsoCode = null;
        vm.options = {
            templates: [],
            languages: [],
            entityType: cfg.entityType,
            entities: cfg.entities,
            entityHasLanguageIsoCode: cfg.entityHasLanguageIsoCode,
            currentEntityIndex: 0,
            showAllEntities: false
        };

        vm.toggleTemplate = function (template, $event) {
            template.selected = true;
        }

        vm.getPreviewUrl = function (template, entity) {
            var url = `${Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath}/backoffice/vendr/vendrprint/preview?templateId=${template.id}&entityType=${vm.options.entityType}&entityId=${entity.id}`;

            if (!vm.options.entityHasLanguageIsoCode && vm.languageIsoCode) {
                url += `&languageIsoCode=${vm.languageIsoCode}`
            }

            return url;
        }

        vm.anyTemplatesSelected = function () {
            return vm.options.templates.some(t => t.checked);
        }

        vm.init = function () {

            vendrPrintTemplateResource.getPrintTemplates(cfg.storeId, cfg.category).then(function (templates) {
                vm.options.templates = templates.map((itm, idx) => {
                    itm.checked = idx === 0;
                    return itm;
                });

                if (vm.options.entityHasLanguageIsoCode) {
                    vm.loading = false;
                } else {
                    languageResource.getAll().then(function (languages) {
                        vm.options.languages = languages;
                        vm.loading = false;
                    });
                }
            });

        };

        vm.print = function () {

            // Remove previous
            var wrapper = document.getElementById("vendr-print-wrapper");
            if (wrapper) {
                wrapper.parentElement.removeChild(wrapper);
            }

            // Generate form + iframe
            var wrapper = document.createElement('div')
            wrapper.id = "vendr-print-wrapper";
            wrapper.style = "display: none;";

            var frame = document.createElement('iframe');
            frame.src = "about:blank";
            frame.id = "vendr-print-iframe"
            frame.name = "vendr-print-iframe"

            wrapper.appendChild(frame);

            var form = document.createElement('form')
            form.id = "vendr-print-form";
            form.action = `${Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath}/backoffice/vendr/vendrprint/print`;
            form.method = "POST";
            form.target = "vendr-print-iframe";

            var entityTypeInput = document.createElement('input');
            entityTypeInput.type = "hidden";
            entityTypeInput.name = "entityType";
            entityTypeInput.value = vm.options.entityType;
            form.appendChild(entityTypeInput);

            if (!vm.options.entityHasLanguageIsoCode && vm.languageIsoCode) {
                var languageIsoCodeInput = document.createElement('input');
                languageIsoCodeInput.type = "hidden";
                languageIsoCodeInput.name = "languageIsoCode";
                languageIsoCodeInput.value = vm.languageIsoCode;
                form.appendChild(languageIsoCodeInput);
            }

            vm.options.templates.filter(t => t.checked).forEach((t, i) => {
                var templateInput = document.createElement('input');
                templateInput.type = "hidden";
                templateInput.name = "templateIds["+ i +"]";
                templateInput.value = t.id;
                form.appendChild(templateInput);
            });

            vm.options.entities.forEach((e, i) => {
                var entityInput = document.createElement('input');
                entityInput.type = "hidden";
                entityInput.name = "entityIds[" + i +"]";
                entityInput.value = e.id;
                form.appendChild(entityInput);
            });

            wrapper.appendChild(form);

            document.body.appendChild(wrapper);

            // Submit the form
            setTimeout(function () {
                form.submit();
            }, 1);

        };

        vm.close = function () {
            $scope.model.close();
        };

        vm.init();
    }

    angular.module('vendr').controller('Vendr.Controllers.PrintOptionsDialogController', PrintOptionsDialogController);

}());