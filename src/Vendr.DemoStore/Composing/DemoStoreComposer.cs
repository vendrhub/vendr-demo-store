using Umbraco.Core;
using Umbraco.Core.Composing;
using Vendr.Umbraco;
using Vendr.Core.Events.Notification;
using Vendr.DemoStore.Events;
using Vendr.DemoStore.Web.Extractors;
using Vendr.Umbraco.Extractors;
using Vendr.Extensions;

namespace Vendr.DemoStore.Composing
{
    [ComposeAfter(typeof(VendrComposer))]
    public class DemoStoreComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            // Replace the umbraco product name extractor with one that supports child variants
            composition.RegisterUnique<IUmbracoProductNameExtractor, CompositeProductNameExtractor>();

            // Register event handlers
            composition.WithNotificationEvent<OrderProductAddingNotification>()
                .RegisterHandler<OrderProductAddingHandler>();

            composition.WithNotificationEvent<OrderLineChangingNotification>()
                .RegisterHandler<OrderLineChangingHandler>();

            composition.WithNotificationEvent<OrderLineRemovingNotification>()
                .RegisterHandler<OrderLineRemovingHandler>();

            composition.WithNotificationEvent<OrderPaymentCountryRegionChangingNotification>()
                .RegisterHandler<OrderPaymentCountryRegionChangingHandler>();

            composition.WithNotificationEvent<OrderShippingCountryRegionChangingNotification>()
                .RegisterHandler<OrderShippingCountryRegionChangingHandler>();

            composition.WithNotificationEvent<OrderShippingMethodChangingNotification>()
                .RegisterHandler<OrderShippingMethodChangingHandler>();

            // Register component
            composition.Components()
                .Append<DemoStoreComponent>();
        }
    }
}
