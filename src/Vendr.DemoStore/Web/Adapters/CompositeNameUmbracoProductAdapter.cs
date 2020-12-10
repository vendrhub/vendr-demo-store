using Umbraco.Web;
using Vendr.Core.Models;
using Vendr.Web.Adapters;

namespace Vendr.DemoStore.Web.Adapters
{
    public class CompositeNameUmbracoProductAdapter : UmbracoProductAdapter
    {
        public CompositeNameUmbracoProductAdapter(IUmbracoContextAccessor umbracoContextAccessor) 
            : base(umbracoContextAccessor)
        { }

        public override IProductSnapshot GetProductSnapshot(string productReference, string languageIsoCode)
        {
            // Generate the snapshot using the default extractor
            var snapshot = (UmbracoProductSnapshot)base.GetProductSnapshot(productReference, languageIsoCode);
                
            // Decorate the snapshot with our custom decorator
            return snapshot != null
                ? new CompositeNameUmbracoProductSnapshotDecorator(snapshot)
                : null;
        }
    }
}
