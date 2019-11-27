using System.Collections.Generic;
using System.Linq;
using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CheckoutPage
    {
        public OrderReadOnly Order => this.GetCurrentOrder();

        public IEnumerable<CheckoutStepPage> Steps => Children.OfType<CheckoutStepPage>();
    }
}
