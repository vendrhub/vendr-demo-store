using Umbraco.Web;
using Vendr.Core.Models;
using Vendr.Core.Services;
using Vendr.Web.Extractors;

namespace Vendr.DemoStore.Web.Extractors
{
    public class ChildVariantUmbracoProductInformationExtractor : UmbracoProductInformationExtractor
    {
        public ChildVariantUmbracoProductInformationExtractor(IUmbracoContextAccessor umbracoContextAccessor, VendrServiceContext vendrServices) 
            : base(umbracoContextAccessor, vendrServices)
        { }

        public override IProductSnapshot GetProductSnapshot(string productReference, string languageIsoCode)
        {
            // Generate the snapshot using the default extractor
            var snapshot = (UmbracoProductSnapshot)base.GetProductSnapshot(productReference, languageIsoCode);
                
            // Decorate the snapshot with our custom decorator
            return new ChildVariantUmbracoProductSnapshotDecorator(snapshot);
        }
    }
}
