using System.Runtime.Serialization;

namespace Vendr.DemoStore.Web.Dtos
{
    [DataContract(Name = "productVariant", Namespace = "")]
    public class ProductVariantDto
    {
        [DataMember(Name = "productVariantReference")]
        public string ProductVariantReference { get; set; }

        [DataMember(Name = "sku")]
        public string Sku { get; set; }

        [DataMember(Name = "priceFormatted")]
        public string PriceFormatted { get; set; }

        [DataMember(Name = "imageUrl")]
        public string ImageUrl { get; set; }

        [DataMember(Name = "thumbnailImageUrl")]
        public string ThumbnailImageUrl { get; set; }
    }
}
