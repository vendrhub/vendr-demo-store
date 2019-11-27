using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CartPage
    {
        public CheckoutPage CheckoutPage => this.GetHomePage().CheckoutPage;

        public OrderReadOnly Order => this.GetCurrentOrder();
    }
}
