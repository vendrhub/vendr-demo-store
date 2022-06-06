using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Logging;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Cms.Web.Website.Controllers;
using Vendr.Common.Validation;
using Vendr.Core.Api;
using Vendr.DemoStore.Web.Dtos;
using Vendr.Extensions;

namespace Vendr.DemoStore.Web.Controllers
{
    public class CartSurfaceController : SurfaceController
    {
        private readonly IVendrApi _vendrApi;

        public CartSurfaceController(IUmbracoContextAccessor umbracoContextAccessor, IUmbracoDatabaseFactory databaseFactory, 
            ServiceContext services, AppCaches appCaches, IProfilingLogger profilingLogger, IPublishedUrlProvider publishedUrlProvider,
            IVendrApi vendrApi)
            : base(umbracoContextAccessor, databaseFactory, services, appCaches, profilingLogger, publishedUrlProvider)
        {
            _vendrApi = vendrApi;
        }

        [HttpPost]
        public IActionResult AddToCart(AddToCartDto postModel)
        {
            try
            {
                _vendrApi.Uow.Execute(uow =>
                {
                    var store = CurrentPage.GetStore();
                    var order = _vendrApi.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .AddProduct(postModel.ProductReference, postModel.ProductVariantReference, 1);

                    _vendrApi.SaveOrder(order);

                    uow.Complete();
                });
            }
            catch (ValidationException ex)
            {
                ModelState.AddModelError("productReference", "Failed to add product to cart");

                return CurrentUmbracoPage();
            }

            TempData["addedProductReference"] = postModel.ProductReference;

            return RedirectToCurrentUmbracoPage();
        }

        [HttpPost]
        public IActionResult UpdateCart(UpdateCartDto postModel)
        {
            try
            {
                _vendrApi.Uow.Execute(uow =>
                {
                    var store = CurrentPage.GetStore();
                    var order = _vendrApi.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow);

                    foreach (var orderLine in postModel.OrderLines)
                    {
                        order.WithOrderLine(orderLine.Id)
                            .SetQuantity(orderLine.Quantity);
                    }

                    _vendrApi.SaveOrder(order);

                    uow.Complete();
                });
            }
            catch (ValidationException ex)
            {
                ModelState.AddModelError("productReference", "Failed to update cart");

                return CurrentUmbracoPage();
            }

            TempData["cartUpdated"] = "true";

            return RedirectToCurrentUmbracoPage();
        }

        [HttpGet]
        public IActionResult RemoveFromCart(RemoveFromCartDto postModel)
        {
            try
            {
                _vendrApi.Uow.Execute(uow =>
                {
                    var store = CurrentPage.GetStore();
                    var order = _vendrApi.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .RemoveOrderLine(postModel.OrderLineId);

                    _vendrApi.SaveOrder(order);

                    uow.Complete();
                });
            }
            catch (ValidationException ex)
            {
                ModelState.AddModelError("productReference", "Failed to remove cart item");

                return CurrentUmbracoPage();
            }

            return RedirectToCurrentUmbracoPage();
        }
    }
}
