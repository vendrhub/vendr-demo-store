using Vendr.Core.Api;
using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CheckoutConfirmationPage : IOrderReviewPage
    {
        public override OrderReadOnly Order => VendrApi.Instance.GetCurrentFinalizedOrder(this.GetStore().Id);

        public CountryReadOnly PaymentCountry => VendrApi.Instance.GetCountry(this.Order.PaymentInfo.CountryId.Value);

        public CountryReadOnly ShippingCountry => VendrApi.Instance.GetCountry(this.Order.ShippingInfo.CountryId.Value);
    }
}
