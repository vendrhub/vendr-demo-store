using Examine;
using Examine.Search;
using System.Linq;
using System.Web.Mvc;
using Umbraco.Core;
using Umbraco.Core.Models;
using Umbraco.Web;
using Umbraco.Web.Mvc;
using Vendr.DemoStore.Models;

namespace Vendr.DemoStore.Web.Controllers
{
    public class ProductSurfaceController : SurfaceController
    {
        private readonly IExamineManager _examineManager;
        private readonly IUmbracoContextAccessor _umbracoContextAccessor;

        public ProductSurfaceController(IExamineManager examineManager, IUmbracoContextAccessor umbracoContextAccessor)
        {
            _examineManager = examineManager;
            _umbracoContextAccessor = umbracoContextAccessor;
        }

        [ChildActionOnly]
        public ActionResult FeaturedProducts()
        {
            var featuredProducts = CurrentPage.GetHomePage()
                .FeaturedProducts.OfType<ProductPage>();

            return PartialView("ProductList", featuredProducts);
        }

        [ChildActionOnly]
        public ActionResult ProductListByCollection(int collectionId, int p = 1, int ps = 12)
        {
            return PartialView("PagedProductList", GetPagedProducts(collectionId, null, p, ps));
        }

        [ChildActionOnly]
        public ActionResult ProductListByCategory(string category, int p = 1, int ps = 12)
        {
            return PartialView("PagedProductList", GetPagedProducts(null, category, p, ps));
        }

        private PagedResult<ProductPage> GetPagedProducts(int? collectionId, string category, int page, int pageSize)
        {
            if (_examineManager.TryGetIndex("ExternalIndex", out var index))
            {
                var searcher = index.GetSearcher();
                var query = searcher.CreateQuery()
                    .Field("__NodeTypeAlias", ProductPage.ModelTypeAlias);

                if (collectionId.HasValue)
                {
                    query = query.And().Field("parentID", collectionId.Value);
                }

                if (!category.IsNullOrWhiteSpace())
                {
                    query = query.And().Field("categoryAliases", category);
                }

                var results = query.OrderBy(new SortableField("name", SortType.String)).Execute(pageSize * page);
                var totalResults = results.TotalItemCount;
                var pagedResults = results.Skip(pageSize * (page - 1));

                var items = pagedResults.ToPublishedSearchResults(_umbracoContextAccessor.UmbracoContext.Content)
                                        .Select(x => x.Content)
                                        .OfType<ProductPage>();

                return new PagedResult<ProductPage>(totalResults, page, pageSize)
                {
                    Items = items
                };
            }

            return new PagedResult<ProductPage>(0, page, pageSize);
        }
    }
}
