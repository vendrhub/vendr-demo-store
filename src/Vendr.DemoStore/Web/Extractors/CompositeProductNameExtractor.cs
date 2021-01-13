using System;
using Umbraco.Core.Models.PublishedContent;
using Vendr.Core.Services;
using Vendr.DemoStore.Models;
using Vendr.Web.Extractors;

namespace Vendr.DemoStore.Web.Extractors
{
    public class CompositeProductNameExtractor : UmbracoProductNameExtractor
    {
        public override string ExtractProductName(IPublishedContent content, IPublishedElement variant, string languageIsoCode)
        {
            var productNamePrefix = content.ContentType.Alias == ProductVariant.ModelTypeAlias
                ? $"{content.Parent.Parent.Name} - {content.Parent.Name}"
                : content.Parent.Name;

            return $"{productNamePrefix} - {base.ExtractProductName(content, variant, languageIsoCode)}";
        }
    }
}
