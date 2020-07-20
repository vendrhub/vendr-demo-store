using System.Collections.Generic;
using Vendr.Core.Api;
using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CheckoutPaymentMethodPage
    {
        public CountryReadOnly PaymentCountry => Order.PaymentInfo.CountryId.HasValue
            ? VendrApi.Instance.GetCountry(Order.PaymentInfo.CountryId.Value)
            : null;

        public IEnumerable<PaymentMethodReadOnly> PaymentMethods => VendrApi.Instance.GetPaymentMethods(this.GetStore().Id);
    }
}
