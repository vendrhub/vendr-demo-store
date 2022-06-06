using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Logging;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Cms.Web.Website.Controllers;
using Vendr.Common.Validation;
using Vendr.Core;
using Vendr.Core.Api;
using Vendr.DemoStore.Web.Dtos;
using Vendr.Extensions;

namespace Vendr.DemoStore.Web.Controllers
{
    public class CheckoutSurfaceController : SurfaceController
    {
        private readonly IVendrApi _vendrApi;

        public CheckoutSurfaceController(IUmbracoContextAccessor umbracoContextAccessor, IUmbracoDatabaseFactory databaseFactory,
            ServiceContext services, AppCaches appCaches, IProfilingLogger profilingLogger, IPublishedUrlProvider publishedUrlProvider,
            IVendrApi vendrApi)
            : base(umbracoContextAccessor, databaseFactory, services, appCaches, profilingLogger, publishedUrlProvider)
        {
            _vendrApi = vendrApi;
        }

        public IActionResult ApplyDiscountOrGiftCardCode(DiscountOrGiftCardCodeDto model)
        {
            try
            {
                _vendrApi.Uow.Execute(uow =>
                {
                    var store = CurrentPage.GetStore();
                    var order = _vendrApi.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .Redeem(model.Code);

                    _vendrApi.SaveOrder(order);

                    uow.Complete();
                });
            }
            catch (ValidationException ex)
            {
                ModelState.AddModelError("", "Failed to redeem discount code");

                return CurrentUmbracoPage();
            }

            return RedirectToCurrentUmbracoPage();
        }

        public IActionResult RemoveDiscountOrGiftCardCode(DiscountOrGiftCardCodeDto model)
        {
            try
            {
                _vendrApi.Uow.Execute(uow =>
                {
                    var store = CurrentPage.GetStore();
                    var order = _vendrApi.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .Unredeem(model.Code);

                    _vendrApi.SaveOrder(order);

                    uow.Complete();
                });
            }
            catch (ValidationException ex)
            {
                ModelState.AddModelError("", "Failed to redeem discount code");

                return CurrentUmbracoPage();
            }

            return RedirectToCurrentUmbracoPage();
        }

        public IActionResult UpdateOrderInformation(UpdateOrderInformationDto model)
        {
            try
            {
                _vendrApi.Uow.Execute(uow =>
                {
                    var store = CurrentPage.GetStore();
                    var order = _vendrApi.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .SetProperties(new Dictionary<string, string>
                        {
                            { Constants.Properties.Customer.EmailPropertyAlias, model.Email },
                            { "marketingOptIn", model.MarketingOptIn ? "1" : "0" },

                            { Constants.Properties.Customer.FirstNamePropertyAlias, model.BillingAddress.FirstName },
                            { Constants.Properties.Customer.LastNamePropertyAlias, model.BillingAddress.LastName },
                            { "billingAddressLine1", model.BillingAddress.Line1 },
                            { "billingAddressLine2", model.BillingAddress.Line2 },
                            { "billingCity", model.BillingAddress.City },
                            { "billingZipCode", model.BillingAddress.ZipCode },
                            { "billingTelephone", model.BillingAddress.Telephone },

                            { "shippingSameAsBilling", model.ShippingSameAsBilling ? "1" : "0" },
                            { "shippingFirstName", model.ShippingSameAsBilling ? model.BillingAddress.FirstName : model.ShippingAddress.FirstName },
                            { "shippingLastName", model.ShippingSameAsBilling ? model.BillingAddress.LastName : model.ShippingAddress.LastName },
                            { "shippingAddressLine1", model.ShippingSameAsBilling ? model.BillingAddress.Line1 : model.ShippingAddress.Line1 },
                            { "shippingAddressLine2", model.ShippingSameAsBilling ? model.BillingAddress.Line2 : model.ShippingAddress.Line2 },
                            { "shippingCity", model.ShippingSameAsBilling ? model.BillingAddress.City : model.ShippingAddress.City },
                            { "shippingZipCode", model.ShippingSameAsBilling ? model.BillingAddress.ZipCode : model.ShippingAddress.ZipCode },
                            { "shippingTelephone", model.ShippingSameAsBilling ? model.BillingAddress.Telephone : model.ShippingAddress.Telephone },

                            { "comments", model.Comments }
                        })
                        .SetPaymentCountryRegion(model.BillingAddress.Country, null)
                        .SetShippingCountryRegion(model.ShippingSameAsBilling ? model.BillingAddress.Country : model.ShippingAddress.Country, null);

                    _vendrApi.SaveOrder(order);

                    uow.Complete();
                });
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

        public IActionResult UpdateOrderShippingMethod(UpdateOrderShippingMethodDto model)
        {
            try
            {
                _vendrApi.Uow.Execute(uow =>
                {
                    var store = CurrentPage.GetStore();
                    var order = _vendrApi.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .SetShippingMethod(model.ShippingMethod);

                    _vendrApi.SaveOrder(order);

                    uow.Complete();
                });
            }
            catch (ValidationException ex)
            {
                ModelState.AddModelError("", "Failed to set order shipping method");

                return CurrentUmbracoPage();
            }

            if (model.NextStep.HasValue)
                return RedirectToUmbracoPage(model.NextStep.Value);

            return RedirectToCurrentUmbracoPage();
        }

        public IActionResult UpdateOrderPaymentMethod(UpdateOrderPaymentMethodDto model)
        {
            try
            {
                _vendrApi.Uow.Execute(uow =>
                {
                    var store = CurrentPage.GetStore();
                    var order = _vendrApi.GetOrCreateCurrentOrder(store.Id)
                        .AsWritable(uow)
                        .SetPaymentMethod(model.PaymentMethod);

                    _vendrApi.SaveOrder(order);

                    uow.Complete();
                });
            }
            catch (ValidationException ex)
            {
                ModelState.AddModelError("", "Failed to set order payment method");

                return CurrentUmbracoPage();
            }

            if (model.NextStep.HasValue)
                return RedirectToUmbracoPage(model.NextStep.Value);

            return RedirectToCurrentUmbracoPage();
        }
    }
}
