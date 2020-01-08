using System;

namespace Vendr.DemoStore.Web.Dtos
{
    public class OrderAddressDto
    {
        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string AddressLine1 { get; set; }

        public string AddressLine2 { get; set; }

        public string ZipCode { get; set; }

        public string City { get; set; }

        public Guid Country { get; set; }

        public string Telephone { get; set; }
    }
}
