using System.Collections.Generic;
using Vendr.Core.Api;
using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CheckoutPaymentMethodPage
    {
        public IEnumerable<PaymentMethodReadOnly> PaymentMethods => VendrApi.Instance.GetPaymentMethods(this.GetStore().Id);
    }
}
