using Examine;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Vendr.DemoStore.Models;

namespace Vendr.DemoStore.Web.ViewComponents
{
    [ViewComponent]
    public class FeaturedProductsViewComponent : ProductViewComponentBase
    {
        public FeaturedProductsViewComponent(IExamineManager examineManager, IUmbracoContextAccessor umbracoContextAccessor)
            : base(examineManager, umbracoContextAccessor)
        { }

        public IViewComponentResult Invoke(IPublishedContent currentPage)
        {
            var featuredProducts = currentPage.GetHomePage()
                .FeaturedProducts.OfType<ProductPage>();

            return View("ProductList", featuredProducts);
        }
    }
}
