using System.Collections.Generic;
using Vendr.Core.Api;
using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CheckoutShippingMethodPage
    {
        public IEnumerable<ShippingMethodReadOnly> ShippingMethods => VendrApi.Instance.GetShippingMethods(this.GetStore().Id);
    }
}
