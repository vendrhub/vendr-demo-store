using System.Linq;
using System.Threading;
using System.Web.Http;
using Umbraco.Web;
using Umbraco.Web.WebApi;
using Vendr.Core.Services;
using Vendr.DemoStore.Models;
using Vendr.DemoStore.Web.Dtos;
using Vendr.Extensions;

using VendrCoreConstants = Vendr.Core.Constants;
 
namespace Vendr.DemoStore.Web.Controllers
{
    public class ProductApiController : UmbracoApiController
    {
        private readonly IProductService _productService;

        public ProductApiController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpPost]
        public object GetProductVariant(GetProductVariantDto model)
        {
            // Get the variants for the given node
            var productNode = Umbraco.Content(model.ProductNodeId) as MultiVariantProductPage;
            if (productNode == null)
                return null;

            // Find the variant with the matching attributes
            var variant = productNode.Variants.FindByAttributes(model.Attributes);

            // If we have a variant, map it's data to our DTO
            if (variant != null)
            {
                // Convert variant into product snapshot
                var snapshot = _productService.GetProduct(productNode.Key.ToString("D"), variant.Content.Key.ToString("D"), Thread.CurrentThread.CurrentCulture.Name);
                if (snapshot != null)
                {
                    var multiVariantContent = variant.Content as ProductMultiVariant;

                    return new ProductVariantDto
                    {
                        ProductVariantReference = variant.Content.Key.ToString("D"),
                        Sku = snapshot.Sku,
                        PriceFormatted = snapshot.CalculatePrice()?.Formatted(),
                        ImageUrl = multiVariantContent?.Image.GetCropUrl(500, 500),
                        ThumbnailImageUrl = multiVariantContent?.Image.GetCropUrl(150, 150)
                    };
                }
            }

            // Couldn't find a variant so return null
            return null;
        }
    }
}
