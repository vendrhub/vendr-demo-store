using System;

namespace Vendr.DemoStore.Web.Dtos
{
    public class UpdateOrderInformationDto
    {
        public string Email { get; set; }

        public bool MarketingOptIn { get; set; }

        public string BillingFirstName { get; set; }

        public string BillingLastName { get; set; }

        public string BillingAddressLine1 { get; set; }

        public string BillingAddressLine2 { get; set; }

        public string BillingCity { get; set; }

        public Guid BillingCountry { get; set; }

        public string BillingZipCode { get; set; }

        public string BillingTelephone { get; set; }

        public bool ShippingSameAsBilling { get; set; }

        public string ShippingFirstName { get; set; }

        public string ShippingLastName { get; set; }

        public string ShippingAddressLine1 { get; set; }

        public string ShippingAddressLine2 { get; set; }

        public string ShippingCity { get; set; }

        public Guid ShippingCountry { get; set; }

        public string ShippingZipCode { get; set; }

        public string ShippingTelephone { get; set; }

        public string Comments { get; set; }

        public int? NextStep { get; set; }
    }
}
