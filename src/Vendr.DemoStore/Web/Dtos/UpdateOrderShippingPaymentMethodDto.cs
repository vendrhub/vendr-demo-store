using System;

namespace Vendr.DemoStore.Web.Dtos
{
    public class UpdateOrderShippingPaymentMethodDto
    {
        public Guid ShippingMethod { get; set; }

        public Guid PaymentMethod { get; set; }

        public int? NextStep { get; set; }
    }
}
