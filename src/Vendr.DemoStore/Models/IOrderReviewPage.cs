using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public interface IOrderReviewPage
    {
        OrderReadOnly Order { get; }

        CountryReadOnly PaymentCountry { get; }

        CountryReadOnly ShippingCountry { get; }
    }
}
