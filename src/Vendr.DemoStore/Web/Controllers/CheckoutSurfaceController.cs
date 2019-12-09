using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;
using Umbraco.Web.Mvc;
using Vendr.Core;
using Vendr.Core.Services;
using Vendr.Core.Session;
using Vendr.DemoStore.Web.Dtos;

namespace Vendr.DemoStore.Web.Controllers
{
    public class CheckoutSurfaceController : SurfaceController, IRenderController
    {
        private readonly ISessionManager _sessionManager;
        private readonly IOrderService _orderService;
        private readonly IUnitOfWorkProvider _uowProvider;

        public CheckoutSurfaceController(ISessionManager sessionManager,
            IOrderService orderService,
            IUnitOfWorkProvider uowProvider)
        {
            _sessionManager = sessionManager;
            _orderService = orderService;
            _uowProvider = uowProvider;
        }

        public ActionResult ApplyDiscountOrGiftCardCode(ApplyDiscountOrGiftCardCodeDto model)
        {
            // Not currently implemented

            return RedirectToCurrentUmbracoPage();
        }

        public ActionResult UpdateOrderInformation(UpdateOrderInformationDto model)
        {
            try
            {
                using (var uow = _uowProvider.Create())
                {
                    var store = CurrentPage.GetStore();
                    var order = _sessionManager.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .SetProperties(new Dictionary<string, string>
                        {
                            { Constants.Properties.Customer.EmailPropertyAlias, model.Email },
                            { "marketingOptIn", model.MarketingOptIn ? "1" : "0" },

                            { Constants.Properties.Customer.FirstNamePropertyAlias, model.BillingFirstName },
                            { Constants.Properties.Customer.LastNamePropertyAlias, model.BillingLastName },
                            { "billingAddressLine1", model.BillingAddressLine1 },
                            { "billingAddressLine2", model.BillingAddressLine2 },
                            { "billingCity", model.BillingCity },
                            { "billingZipCode", model.BillingZipCode },
                            { "billingTelephone", model.BillingTelephone },

                            { "shippingSameAsBilling", model.ShippingSameAsBilling ? "1" : "0" },
                            { "shippingFirstName", model.ShippingSameAsBilling ? model.BillingFirstName : model.ShippingFirstName },
                            { "shippingLastName", model.ShippingSameAsBilling ? model.BillingLastName : model.ShippingLastName },
                            { "shippingAddressLine1", model.ShippingSameAsBilling ? model.BillingAddressLine1 : model.ShippingAddressLine1 },
                            { "shippingAddressLine2", model.ShippingSameAsBilling ? model.BillingAddressLine2 : model.ShippingAddressLine2 },
                            { "shippingCity", model.ShippingSameAsBilling ? model.BillingCity : model.ShippingCity },
                            { "shippingZipCode", model.ShippingSameAsBilling ? model.BillingZipCode : model.ShippingZipCode },
                            { "shippingTelephone", model.ShippingSameAsBilling ? model.BillingTelephone : model.ShippingTelephone },

                            { "comments", model.Comments }
                        })
                        .SetPaymentCountryRegion(model.BillingCountry, null)
                        .SetShippingCountryRegion(model.ShippingSameAsBilling ? model.BillingCountry : model.ShippingCountry, null);

                    _orderService.SaveOrder(order);

                    uow.Complete();
                }
            }
            catch (ValidationException ex)
            {
                ModelState.AddModelError("", "Failed to update information");

                return CurrentUmbracoPage();
            }

            if (model.NextStep.HasValue)
                return RedirectToUmbracoPage(model.NextStep.Value);

            return RedirectToCurrentUmbracoPage();
        }

        public ActionResult UpdateOrderShippingAndPaymentMethod(UpdateOrderShippingPaymentMethodDto model)
        {
            try
            {
                using (var uow = _uowProvider.Create())
                {
                    var store = CurrentPage.GetStore();
                    var order = _sessionManager.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .SetShippingMethod(model.ShippingMethod)
                        .SetPaymentMethod(model.PaymentMethod);

                    _orderService.SaveOrder(order);

                    uow.Complete();
                }
            }
            catch (ValidationException ex)
            {
                ModelState.AddModelError("", "Failed to shipping / payment method");

                return CurrentUmbracoPage();
            }

            if (model.NextStep.HasValue)
                return RedirectToUmbracoPage(model.NextStep.Value);

            return RedirectToCurrentUmbracoPage();
        }
    }
}
