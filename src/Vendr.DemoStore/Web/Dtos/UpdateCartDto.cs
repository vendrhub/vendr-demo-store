using System;

namespace Vendr.DemoStore.Web.Dtos
{
    public class UpdateCartDto
    {
        public OrderLineQuantityDto[] OrderLines { get; set; }
    }

    public class OrderLineQuantityDto
    {
        public Guid Id { get; set; }

        public decimal Quantity { get; set; }
    }
}
