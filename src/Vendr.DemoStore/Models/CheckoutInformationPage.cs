using System.Collections.Generic;
using Vendr.Core.Api;
using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CheckoutInformationPage
    {
        public IEnumerable<CountryReadOnly> Countries => VendrApi.Instance.GetCountries(this.GetStore().Id);
    }
}
