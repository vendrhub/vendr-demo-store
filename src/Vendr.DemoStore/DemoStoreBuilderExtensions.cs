using Vendr.Core.Events.Notification;
using Vendr.DemoStore.Events;
using Vendr.DemoStore.Web.Extractors;
using Vendr.Umbraco.Extractors;
using Vendr.Extensions;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Extensions;
using Umbraco.Cms.Core.Notifications;

namespace Vendr.DemoStore
{
    public static class DemoStoreBuilderExtensions
    {
        public static IUmbracoBuilder AddDemoStore(this IUmbracoBuilder umbracoBuilder)
        {
            umbracoBuilder.AddVendr(v =>
            {
                // Enable SQLite support
                v.AddSQLite();

                // Replace the umbraco product name extractor with one that supports child variants
                v.Services.AddUnique<IUmbracoProductNameExtractor, CompositeProductNameExtractor>();

                // Register event handlers
                v.WithNotificationEvent<OrderProductAddingNotification>()
                    .RegisterHandler<OrderProductAddingHandler>();

                v.WithNotificationEvent<OrderLineChangingNotification>()
                    .RegisterHandler<OrderLineChangingHandler>();

                v.WithNotificationEvent<OrderLineRemovingNotification>()
                    .RegisterHandler<OrderLineRemovingHandler>();

                v.WithNotificationEvent<OrderPaymentCountryRegionChangingNotification>()
                    .RegisterHandler<OrderPaymentCountryRegionChangingHandler>();

                v.WithNotificationEvent<OrderShippingCountryRegionChangingNotification>()
                    .RegisterHandler<OrderShippingCountryRegionChangingHandler>();

                v.WithNotificationEvent<OrderShippingMethodChangingNotification>()
                    .RegisterHandler<OrderShippingMethodChangingHandler>();

            });

            umbracoBuilder.AddNotificationHandler<UmbracoApplicationStartingNotification, TransformExamineValues>();

            return umbracoBuilder;
        }
    }
}
