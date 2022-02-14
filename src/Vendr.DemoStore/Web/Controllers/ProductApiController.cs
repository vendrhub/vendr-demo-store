using Microsoft.AspNetCore.Mvc;
using System.Threading;
using Umbraco.Cms.Core;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Extensions;
using Vendr.Core.Services;
using Vendr.DemoStore.Models;
using Vendr.DemoStore.Web.Dtos;
using Vendr.Extensions;
 
namespace Vendr.DemoStore.Web.Controllers
{
    public class ProductApiController : UmbracoApiController
    {
        private readonly IProductService _productService;
        private readonly IPublishedContentQuery _publishedContentQuery;

        public ProductApiController(IProductService productService,
            IPublishedContentQuery publishedContentQuery)
        {
            _productService = productService;
            _publishedContentQuery = publishedContentQuery;
        }

        [HttpPost]
        public object GetProductVariant([FromBody] GetProductVariantDto model)
        {
            // Get the variants for the given node
            var productNode = _publishedContentQuery.Content(model.ProductNodeId) as MultiVariantProductPage;
            if (productNode == null)
                return null;

            // Get the store from the product node
            var store = productNode.GetStore();

            // Find the variant with the matching attributes
            var variant = productNode.Variants.FindByAttributes(model.Attributes);

            // If we have a variant, map it's data to our DTO
            if (variant != null)
            {
                // Convert variant into product snapshot
                var snapshot = _productService.GetProduct(store.Id, productNode.Key.ToString("D"), variant.Content.Key.ToString("D"), Thread.CurrentThread.CurrentCulture.Name);
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
