using System;

namespace Vendr.DemoStore.Web.Dtos
{
    public class UpdateOrderShippingMethodDto
    {
        public Guid ShippingMethod { get; set; }

        public Guid? NextStep { get; set; }
    }
}
