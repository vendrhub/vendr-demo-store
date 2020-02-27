using Umbraco.Core;
using Umbraco.Core.Composing;
using Vendr.Core.Adapters;
using Vendr.DemoStore.Web.Adapters;
using Vendr.Web.Composing;

namespace Vendr.DemoStore.Composing
{
    [ComposeAfter(typeof(VendrWebComposer))]
    public class DemoStoreComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            // Replace the product information extractor with one that supports child variants
            composition.RegisterUnique<IProductAdapter, CompositeNameUmbracoProductAdapter>();

            // Register component
            composition.Components()
                .Append<DemoStoreComponent>();
        }
    }
}
