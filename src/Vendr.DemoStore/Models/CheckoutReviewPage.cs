using Vendr.Core.Api;
using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CheckoutReviewPage : IOrderReviewPage
    {
        public CountryReadOnly PaymentCountry => VendrApi.Instance.GetCountry(this.Order.PaymentInfo.CountryId.Value);

        public CountryReadOnly ShippingCountry => VendrApi.Instance.GetCountry(this.Order.ShippingInfo.CountryId.Value);
    }
}
