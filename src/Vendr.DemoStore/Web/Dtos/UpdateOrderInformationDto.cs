using System;

namespace Vendr.DemoStore.Web.Dtos
{
    public class UpdateOrderInformationDto
    {
        public string Email { get; set; }

        public bool MarketingOptIn { get; set; }

        public OrderAddressDto Billing { get; set; }

        public OrderAddressDto Shipping { get; set; }

        public bool ShippingSameAsBilling { get; set; }

        public string Comments { get; set; }

        public int? NextStep { get; set; }
    }
}
