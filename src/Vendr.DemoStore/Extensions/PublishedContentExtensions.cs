using System.Threading;
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
        public static Page AsPage(this IPublishedContent content)
        {
            return ((Page)content);
        }

        public static HomePage GetHomePage(this IPublishedContent content)
        {
            return content.AsPage().HomePage;
        }

        public static StoreReadOnly GetStore(this IPublishedContent content)
        {
            return content.AncestorOrSelf<HomePage>()?.Store;
        }

        public static OrderReadOnly GetCurrentOrder(this IPublishedContent content)
        {
            return VendrApi.Instance.GetCurrentOrder(content.GetStore().Id);
        }

        public static string GetProductReference(this IProductComp content)
        {
            return content.Key.ToString();
        }

        public static IProductSnapshot AsVendrProduct(this IProductComp content)
        {
            return VendrApi.Instance.GetProduct(content.GetProductReference(), Thread.CurrentThread.CurrentCulture.Name);
        }

        public static Price CalculatePrice(this IProductComp content)
        {
            return content.AsVendrProduct()?.CalculatePrice();
        }

        public static CheckoutPage GetCheckoutPage(this CheckoutStepPage content)
        {
            return content.AncestorOrSelf<CheckoutPage>();
        }
    }
}
