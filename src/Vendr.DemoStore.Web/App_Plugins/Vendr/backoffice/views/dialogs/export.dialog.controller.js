(function () {

    'use strict';

    function ExportDialogController($scope, $http, vendrOrderResource, vendrExportTemplateResource, languageResource) {

        var cfg = $scope.model.config;

        var vm = this;

        vm.page = {};
        vm.page.name = "Export " + cfg.entityType.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        vm.page.exportButtonState = 'init';

        vm.loading = true;

        vm.model = {};
        vm.templateId = null;
        vm.languageIsoCode = null;
        vm.options = {
            languages: []
        };

        vm.init = function () {

            vendrExportTemplateResource.getExportTemplates(cfg.storeId, cfg.category).then(function (templates) {

                vm.options.templates = templates.map((itm, idx) => {
                    itm.checked = false;
                    return itm;
                });

                languageResource.getAll().then(function (languages) {
                    vm.options.languages = languages;

                    var defaultLanguage = languages.find(function (itm) {
                        return itm.isDefault;
                    });

                    if (defaultLanguage) {
                        vm.languageIsoCode = defaultLanguage.culture;
                    }
                    else if (languages.length == 1) {
                        vm.languageIsoCode = languages[0].culture;
                    }

                    vm.loading = false;
                });

            });

        };

        vm.anyTemplatesSelected = function () {
            return vm.options.templates.some(t => t.checked);
        }

        vm.export = function () {

            // Remove previous
            var wrapper = document.getElementById("vendr-export-wrapper");
            if (wrapper) {
                wrapper.parentElement.removeChild(wrapper);
            }

            // Generate form + iframe
            var wrapper = document.createElement('div')
            wrapper.id = "vendr-export-wrapper";
            wrapper.style = "display: none;";

            var frame = document.createElement('iframe');
            frame.src = "about:blank";
            frame.id = "vendr-export-iframe";
            frame.name = "vendr-export-iframe";
            wrapper.appendChild(frame);

            // Generate form
            var form = document.createElement("form");
            form.setAttribute("id", "vendr-export-form");
            form.setAttribute("action", `${Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath}/backoffice/vendr/vendrexport/export`);
            form.setAttribute("method", "post");
            form.target = "vendr-export-iframe";

            var entityTypeEl = document.createElement("input");
            entityTypeEl.setAttribute("type", "hidden");
            entityTypeEl.setAttribute("name", "entityType");
            entityTypeEl.setAttribute("value", cfg.entityType);
            form.append(entityTypeEl);

            var languageIsoCodeEl = document.createElement("input");
            languageIsoCodeEl.setAttribute("type", "hidden");
            languageIsoCodeEl.setAttribute("name", "languageIsoCode");
            languageIsoCodeEl.setAttribute("value", vm.languageIsoCode);
            form.append(languageIsoCodeEl);

            vm.options.templates.filter(t => t.checked).forEach((t, i) => {
                var templateIdEl = document.createElement('input');
                templateIdEl.type = "hidden";
                templateIdEl.name = "templateIds[" + i + "]";
                templateIdEl.value = t.id;
                form.appendChild(templateIdEl);
            });

            cfg.entities.forEach((e, i) => {
                var entityIdEl = document.createElement('input');
                entityIdEl.setAttribute("type", "hidden");
                entityIdEl.setAttribute("name", "entityIds[" + i + "]");
                entityIdEl.setAttribute("value", e.id);
                form.appendChild(entityIdEl);
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

    angular.module('vendr').controller('Vendr.Controllers.ExportDialogController', ExportDialogController);

}());