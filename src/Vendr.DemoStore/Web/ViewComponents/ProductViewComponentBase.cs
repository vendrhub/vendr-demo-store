using Examine;
using Examine.Search;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using Vendr.Common.Models;
using Vendr.DemoStore.Models;

namespace Vendr.DemoStore.Web.ViewComponents
{
    public abstract class ProductViewComponentBase : ViewComponent
    {
        private readonly IExamineManager _examineManager;
        private readonly IUmbracoContextFactory _umbracoContextFactory;

        public ProductViewComponentBase(IExamineManager examineManager, IUmbracoContextFactory umbracoContextFactory)
        {
            _examineManager = examineManager;
            _umbracoContextFactory = umbracoContextFactory;
        }

        protected PagedResult<ProductPage> GetPagedProducts(int? collectionId, string category, int page, int pageSize)
        {
            if (_examineManager.TryGetIndex("ExternalIndex", out var index))
            {
                var q = $"+(__NodeTypeAlias:{ProductPage.ModelTypeAlias} __NodeTypeAlias:{MultiVariantProductPage.ModelTypeAlias})";

                if (collectionId.HasValue)
                {
                    q += $" +searchPath:{collectionId.Value}";
                }

                if (!category.IsNullOrWhiteSpace())
                {
                    q += $" +categoryAliases:\"{category}\"";
                }

                var searcher = index.Searcher;
                var query = searcher.CreateQuery().NativeQuery(q);
                var results = query.OrderBy(new SortableField("name", SortType.String))
                    .Execute(QueryOptions.SkipTake(pageSize * (page - 1), pageSize));
                var totalResults = results.TotalItemCount;

                using (var ctx = _umbracoContextFactory.EnsureUmbracoContext())
                {
                    var items = results.ToPublishedSearchResults(ctx.UmbracoContext.Content)
                        .Select(x => x.Content)
                        .OfType<ProductPage>()
                        .OrderBy(x => x.SortOrder);

                    return new PagedResult<ProductPage>(totalResults, page, pageSize)
                    {
                        Items = items
                    };
                }
            }

            return new PagedResult<ProductPage>(0, page, pageSize);
        }
    }
}
