using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Models.PublishedContent;
using Vendr.Core.Api;

namespace Vendr.DemoStore.Web.ViewComponents
{
    [ViewComponent]
    public class CartCountViewComponent : ViewComponent
    {
        private readonly IVendrApi _vendrApi;

        public CartCountViewComponent(IVendrApi vendrApi)
        {
            _vendrApi = vendrApi;
        }

        public IViewComponentResult Invoke(IPublishedContent currentPage)
        {
            var store = currentPage.GetStore();
            var order = _vendrApi.GetCurrentOrder(store.Id);

            return View("CartCount", (int)(order?.TotalQuantity ?? 0));
        }
    }
}
