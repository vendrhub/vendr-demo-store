using Vendr.Common.Events;
using Vendr.Core.Events.Notification;

namespace Vendr.DemoStore.Events
{
    // In this store configuration, if someone goes through the checkout flow
    // but then back tracks and modifies the order or previous checkout details
    // then we'll keep clearing out the steps ahead so that the order calculation
    // doesn't show a potential incorrect calculation should the options previously
    // selected no longer be available because of the changes made.

    public class OrderProductAddingHandler : NotificationEventHandlerBase<OrderProductAddingNotification>
    {
        public override void Handle(OrderProductAddingNotification evt)
        {
            if (!evt.Order.IsFinalized)
            {
                evt.Order.ClearShippingMethod();
                evt.Order.ClearPaymentMethod();
            }
        }
    }

    public class OrderLineChangingHandler : NotificationEventHandlerBase<OrderLineChangingNotification>
    {
        public override void Handle(OrderLineChangingNotification evt)
        {
            if (!evt.Order.IsFinalized)
            {
                evt.Order.ClearShippingMethod();
                evt.Order.ClearPaymentMethod();
            }
        }
    }

    public class OrderLineRemovingHandler : NotificationEventHandlerBase<OrderLineRemovingNotification>
    {
        public override void Handle(OrderLineRemovingNotification evt)
        {
            if (!evt.Order.IsFinalized)
            {
                evt.Order.ClearShippingMethod();
                evt.Order.ClearPaymentMethod();
            }
        }
    }

    public class OrderPaymentCountryRegionChangingHandler : NotificationEventHandlerBase<OrderPaymentCountryRegionChangingNotification>
    {
        public override void Handle(OrderPaymentCountryRegionChangingNotification evt)
        {
            if (!evt.Order.IsFinalized)
            {
                evt.Order.ClearPaymentMethod();
            }
        }
    }

    public class OrderShippingCountryRegionChangingHandler : NotificationEventHandlerBase<OrderShippingCountryRegionChangingNotification>
    {
        public override void Handle(OrderShippingCountryRegionChangingNotification evt)
        {
            if (!evt.Order.IsFinalized)
            {
               evt.Order.ClearShippingMethod();
                evt.Order.ClearPaymentMethod();
            }
        }
    }

    public class OrderShippingMethodChangingHandler : NotificationEventHandlerBase<OrderShippingMethodChangingNotification>
    {
        public override void Handle(OrderShippingMethodChangingNotification evt)
        {
            if (!evt.Order.IsFinalized)
            {
                evt.Order.ClearPaymentMethod();
            }
        }
    }
}
