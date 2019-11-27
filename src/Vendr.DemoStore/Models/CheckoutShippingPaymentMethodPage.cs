using System.Collections.Generic;
using Vendr.Core.Api;
using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CheckoutShippingPaymentMethodPage
    {
        public IEnumerable<ShippingMethodReadOnly> ShippingMethods => VendrApi.Instance.GetShippingMethods(this.GetStore().Id);

        public IEnumerable<PaymentMethodReadOnly> PaymentMethods => VendrApi.Instance.GetPaymentMethods(this.GetStore().Id);
    }
}
