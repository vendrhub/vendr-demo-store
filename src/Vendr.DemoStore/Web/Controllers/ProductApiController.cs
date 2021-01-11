using System.Linq;
using System.Threading;
using System.Web.Http;
using Umbraco.Web;
using Umbraco.Web.WebApi;
using Vendr.Core;
using Vendr.Core.Models;
using Vendr.Core.Services;
using Vendr.DemoStore.Models;
using Vendr.DemoStore.Web.Dtos;

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
            var productNode = Umbraco.Content(model.ProductNodeId);
            var variantsProp = productNode.ContentType.PropertyTypes.FirstOrDefault(x => x.EditorAlias == VendrCoreConstants.PropertyEditors.Aliases.VariantsEditor);
            var variants = productNode.Value<ProductVariantCollection>(variantsProp.Alias);

            // Find the variant with the matching attributes
            var variant = variants.FirstOrDefault(v => v.Config.Attributes.Count == model.Attributes.Count
                && v.Config.Attributes.All(a => model.Attributes.ContainsKey(a.Key) && model.Attributes[a.Key] == a.Value));

            // If we have a variant, map it's data to our DTO
            if (variant != null)
            {
                // Convert variant into product snapshot
                var snapshot = _productService.GetProduct(productNode.Key.ToString("D"), variant.Content.Key.ToString("D"), Thread.CurrentThread.CurrentCulture.Name);
                if (snapshot != null)
                {
                    var multiVarientContent = variant.Content as ProductMultiVariant;

                    return new ProductVariantDto
                    {
                        ProductVariantReference = variant.Content.Key.ToString("D"),
                        Sku = snapshot.Sku,
                        PriceFormatted = snapshot.CalculatePrice()?.Formatted(),
                        ImageUrl = multiVarientContent?.Image.GetCropUrl(500, 500),
                        ThumbnailImageUrl = multiVarientContent?.Image.GetCropUrl(150, 150)
                    };
                }
            }

            // Couldn't find a variant so return null
            return null;
        }
    }
}
