using Examine;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Web;
using Vendr.DemoStore.Web.Extensions;

namespace Vendr.DemoStore.Web.ViewComponents
{
    [ViewComponent]
    public class ProductListByCategoryViewComponent : ProductViewComponentBase
    {
        public ProductListByCategoryViewComponent(IExamineManager examineManager, IUmbracoContextFactory umbracoContextFactory)
            : base(examineManager, umbracoContextFactory)
        { }

        public IViewComponentResult Invoke(string category)
        {
            var p = Request.Query.GetInt("p", 1);
            var ps = Request.Query.GetInt("ps", 12);

            return View("PagedProductList", GetPagedProducts(null, category, p, ps));
        }
    }
}
