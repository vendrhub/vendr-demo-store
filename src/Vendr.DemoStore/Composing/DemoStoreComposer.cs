using Vendr.Umbraco;
using Vendr.Core.Events.Notification;
using Vendr.DemoStore.Events;
using Vendr.DemoStore.Web.Extractors;
using Vendr.Umbraco.Extractors;
using Vendr.Extensions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Extensions;
using Umbraco.Cms.Core.Notifications;

namespace Vendr.DemoStore.Composing
{
    [ComposeAfter(typeof(VendrComposer))]
    public class DemoStoreComposer : IUserComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            // Replace the umbraco product name extractor with one that supports child variants
            builder.Services.AddUnique<IUmbracoProductNameExtractor, CompositeProductNameExtractor>();

            // Register event handlers
            builder.WithNotificationEvent<OrderProductAddingNotification>()
                .RegisterHandler<OrderProductAddingHandler>();

            builder.WithNotificationEvent<OrderLineChangingNotification>()
                .RegisterHandler<OrderLineChangingHandler>();

            builder.WithNotificationEvent<OrderLineRemovingNotification>()
                .RegisterHandler<OrderLineRemovingHandler>();

            builder.WithNotificationEvent<OrderPaymentCountryRegionChangingNotification>()
                .RegisterHandler<OrderPaymentCountryRegionChangingHandler>();

            builder.WithNotificationEvent<OrderShippingCountryRegionChangingNotification>()
                .RegisterHandler<OrderShippingCountryRegionChangingHandler>();

            builder.WithNotificationEvent<OrderShippingMethodChangingNotification>()
                .RegisterHandler<OrderShippingMethodChangingHandler>();

            builder.AddNotificationHandler<UmbracoApplicationStartingNotification, TransformExamineValues>();
        }
    }
}
