using Umbraco.Core;
using Umbraco.Core.Composing;
using Vendr.Core.Adapters;
using Vendr.Core.Composing;
using Vendr.Core.Events.Notification;
using Vendr.DemoStore.Events;
using Vendr.DemoStore.Web.Adapters;
using Vendr.Web.Composing;

namespace Vendr.DemoStore.Composing
{
    [ComposeAfter(typeof(VendrWebComposer))]
    public class DemoStoreComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            // Replace the product information extractor with one that supports child variants
            composition.RegisterUnique<IProductAdapter, CompositeNameUmbracoProductAdapter>();

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
