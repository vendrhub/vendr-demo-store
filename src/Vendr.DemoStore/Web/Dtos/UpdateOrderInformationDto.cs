using System;

namespace Vendr.DemoStore.Web.Dtos
{
    public class UpdateOrderInformationDto
    {
        public string Email { get; set; }

        public bool MarketingOptIn { get; set; }

        public OrderAddressDto BillingAddress { get; set; }

        public OrderAddressDto ShippingAddress { get; set; }

        public bool ShippingSameAsBilling { get; set; }

        public string Comments { get; set; }

        public Guid? NextStep { get; set; }
    }
}
