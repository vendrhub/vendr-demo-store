using System.Collections.Generic;
using Vendr.Core.Api;
using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CheckoutShippingMethodPage
    {
        public CountryReadOnly ShippingCountry => Order.ShippingInfo.CountryId.HasValue
            ? VendrApi.Instance.GetCountry(Order.ShippingInfo.CountryId.Value)
            : null;

        public IEnumerable<ShippingMethodReadOnly> ShippingMethods => VendrApi.Instance.GetShippingMethods(this.GetStore().Id);
    }
}
