using System.Collections.Generic;
using System.Web.Mvc;
using Umbraco.Web.Mvc;
using Vendr.Common;
using Vendr.Common.Validation;
using Vendr.Core.Services;
using Vendr.Core.Session;
using Vendr.DemoStore.Web.Dtos;
using Vendr.Extensions;

namespace Vendr.DemoStore.Web.Controllers
{
    public class CartSurfaceController : SurfaceController
    {
        private readonly ISessionManager _sessionManager;
        private readonly IOrderService _orderService;
        private readonly IUnitOfWorkProvider _uowProvider;

        public CartSurfaceController(ISessionManager sessionManager,
            IOrderService orderService,
            IUnitOfWorkProvider uowProvider)
        {
            _sessionManager = sessionManager;
            _orderService = orderService;
            _uowProvider = uowProvider;
        }

        [ChildActionOnly]
        public ActionResult CartCount()
        {
            var store = CurrentPage.GetStore();
            var order = _sessionManager.GetCurrentOrder(store.Id);

            return PartialView("CartCount", order?.TotalQuantity ?? 0);
        }

        [HttpPost]
        public ActionResult AddToCart(AddToCartDto postModel)
        {
            try
            {
                using (var uow = _uowProvider.Create())
                {
                    var store = CurrentPage.GetStore();
                    var order = _sessionManager.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .AddProduct(postModel.ProductReference, postModel.ProductVariantReference, 1);

                    _orderService.SaveOrder(order);

                    uow.Complete();
                }
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
        public ActionResult UpdateCart(UpdateCartDto postModel)
        {
            try
            {
                using (var uow = _uowProvider.Create())
                {
                    var store = CurrentPage.GetStore();
                    var order = _sessionManager.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow);

                    foreach (var orderLine in postModel.OrderLines)
                    {
                        order.WithOrderLine(orderLine.Id)
                            .SetQuantity(orderLine.Quantity);
                    }

                    _orderService.SaveOrder(order);

                    uow.Complete();
                }
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
        public ActionResult RemoveFromCart(RemoveFromCartDto postModel)
        {
            try
            {
                using (var uow = _uowProvider.Create())
                {
                    var store = CurrentPage.GetStore();
                    var order = _sessionManager.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .RemoveOrderLine(postModel.OrderLineId);

                    _orderService.SaveOrder(order);

                    uow.Complete();
                }
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
