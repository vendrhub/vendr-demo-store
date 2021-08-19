using Examine;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Web;
using Vendr.DemoStore.Web.Extensions;

namespace Vendr.DemoStore.Web.ViewComponents
{
    [ViewComponent]
    public class ProductListByCollectionViewComponent : ProductViewComponentBase
    {
        public ProductListByCollectionViewComponent(IExamineManager examineManager, IUmbracoContextFactory umbracoContextFactory)
            : base(examineManager, umbracoContextFactory)
        { }

        public IViewComponentResult Invoke(int collectionId)
        {
            var p = Request.Query.GetInt("p", 1);
            var ps = Request.Query.GetInt("ps", 12);

            return View("PagedProductList", GetPagedProducts(collectionId, null, p, ps));
        }
    }
}
