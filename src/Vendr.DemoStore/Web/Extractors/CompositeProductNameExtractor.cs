using System;
using Umbraco.Core.Models.PublishedContent;
using Vendr.Core.Services;
using Vendr.DemoStore.Models;
using Vendr.Web.Extractors;

namespace Vendr.DemoStore.Web.Extractors
{
    public class CompositeProductNameExtractor : UmbracoProductNameExtractor
    {
        public CompositeProductNameExtractor(Lazy<IProductAttributeService> productAttributeService)
            : base(productAttributeService)
        { }

        public override string ExtractProductName(IPublishedContent content, IPublishedElement variant, string languageIsoCode)
        {
            var parentProductName = content.ContentType.Alias == ProductVariant.ModelTypeAlias
                ? content.Parent.Parent.Name
                : content.Parent.Name;

            return $"{parentProductName} - {base.ExtractProductName(content, variant, languageIsoCode)}";
        }
    }
}
