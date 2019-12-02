using Umbraco.Core;
using Umbraco.Core.Composing;
using Vendr.Core.Extractors;
using Vendr.DemoStore.Web.Extractors;
using Vendr.Web.Composing;

namespace Vendr.DemoStore.Composing
{
    [ComposeAfter(typeof(VendrWebComposer))]
    public class DemoStoreComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            // Replace the product information extractor with one that supports child variants
            composition.RegisterUnique<IProductInformationExtractor, CompositeNameUmbracoProductInformationExtractor>();

            // Register component
            composition.Components()
                .Append<DemoStoreComponent>();
        }
    }
}
