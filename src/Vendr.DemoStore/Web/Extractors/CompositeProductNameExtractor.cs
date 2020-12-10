using Umbraco.Core.Models.PublishedContent;
using Vendr.DemoStore.Models;
using Vendr.Web.Extractors;

namespace Vendr.DemoStore.Web.Extractors
{
    public class CompositeProductNameExtractor : UmbracoProductNameExtractor
    {
        public override string ExtractProductName(IPublishedContent content, string languageIsoCode)
        {
            return content.ContentType.Alias == ProductVariant.ModelTypeAlias
            ? $"{content.Parent.Parent.Name} - {content.Parent.Name} - {content.Name}"
            : $"{content.Parent.Name} - {content.Name}";
        }
    }
}
