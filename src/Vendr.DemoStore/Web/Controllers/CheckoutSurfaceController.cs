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

                            { Constants.Properties.Customer.FirstNamePropertyAlias, model.Billing.FirstName },
                            { Constants.Properties.Customer.LastNamePropertyAlias, model.Billing.LastName },
                            { "billingAddressLine1", model.Billing.AddressLine1 },
                            { "billingAddressLine2", model.Billing.AddressLine2 },
                            { "billingCity", model.Billing.City },
                            { "billingZipCode", model.Billing.ZipCode },
                            { "billingTelephone", model.Billing.Telephone },

                            { "shippingSameAsBilling", model.ShippingSameAsBilling ? "1" : "0" },
                            { "shippingFirstName", model.ShippingSameAsBilling ? model.Billing.FirstName : model.Shipping.FirstName },
                            { "shippingLastName", model.ShippingSameAsBilling ? model.Billing.LastName : model.Shipping.LastName },
                            { "shippingAddressLine1", model.ShippingSameAsBilling ? model.Billing.AddressLine1 : model.Shipping.AddressLine1 },
                            { "shippingAddressLine2", model.ShippingSameAsBilling ? model.Billing.AddressLine2 : model.Shipping.AddressLine2 },
                            { "shippingCity", model.ShippingSameAsBilling ? model.Billing.City : model.Shipping.City },
                            { "shippingZipCode", model.ShippingSameAsBilling ? model.Billing.ZipCode : model.Shipping.ZipCode },
                            { "shippingTelephone", model.ShippingSameAsBilling ? model.Billing.Telephone : model.Shipping.Telephone },

                            { "comments", model.Comments }
                        })
                        .SetPaymentCountryRegion(model.Billing.Country, null)
                        .SetShippingCountryRegion(model.ShippingSameAsBilling ? model.Billing.Country : model.Shipping.Country, null);

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
