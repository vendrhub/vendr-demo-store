using Umbraco.Core.Models.PublishedContent;
using Umbraco.Web;
using Vendr.Core;
using Vendr.Core.Api;
using Vendr.Core.Models;
using Vendr.DemoStore.Models;

namespace Vendr.DemoStore
{
    public static class PublishedContentExtensions
    {
        public static StoreReadOnly GetStore(this IPublishedContent content)
        {
            return content.AncestorOrSelf<HomePage>()?.Store;
        }

        public static string GetProductReference(this IPublishedContent content)
        {
            return content.Key.ToString();
        }

        public static IProductSnapshot AsVendrProduct(this IPublishedContent content)
        {
            return VendrApi.Instance.GetProduct(content.GetProductReference());
        }

        public static Price GetPrice(this IPublishedContent content)
        {
            return content.AsVendrProduct()?.GetPrice();
        }
    }
}
