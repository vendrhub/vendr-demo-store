using System.Linq;
using Vendr.Core.Api;
using Vendr.Core.Models;

namespace Vendr.DemoStore.Models
{
    public partial class CheckoutStepPage
    {
        public CheckoutPage CheckoutPage => this.GetCheckoutPage();

        public virtual OrderReadOnly Order => this.GetCurrentOrder();

        public CheckoutStepPage PreviousStep => CheckoutPage.Steps.TakeWhile(x => !x.Id.Equals(this.Id)).LastOrDefault();

        public CheckoutStepPage NextStep => CheckoutPage.Steps.SkipWhile(x => !x.Id.Equals(this.Id)).Skip(1).FirstOrDefault();

        public PaymentMethodReadOnly PaymentMethod => Order?.PaymentInfo.PaymentMethodId != null
            ? VendrApi.Instance.GetPaymentMethod(Order.PaymentInfo.PaymentMethodId.Value)
            : null;
        public ShippingMethodReadOnly ShippingMethod => Order?.ShippingInfo.ShippingMethodId != null
            ? VendrApi.Instance.GetShippingMethod(Order.ShippingInfo.ShippingMethodId.Value)
            : null;
    }
}
