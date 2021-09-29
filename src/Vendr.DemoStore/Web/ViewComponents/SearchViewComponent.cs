using Examine;
using Examine.Search;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using Vendr.Common.Models;
using Vendr.DemoStore.Web.Extensions;

namespace Vendr.DemoStore.Web.ViewComponents
{
    [ViewComponent]
    public class SearchViewComponent : ViewComponent
    {
        private readonly IExamineManager _examineManager;
        private readonly IUmbracoContextAccessor _umbracoContextAccessor;

        public SearchViewComponent(IExamineManager examineManager,
            IUmbracoContextAccessor umbracoContextAccessor)
        {
            _examineManager = examineManager;
            _umbracoContextAccessor = umbracoContextAccessor;
        }

        public IViewComponentResult Invoke()
        {
            // The logic for searching is mostly pulled from ezSearch
            // https://github.com/umco/umbraco-ezsearch/blob/master/Src/Our.Umbraco.ezSearch/Web/UI/Views/MacroPartials/ezSearch.cshtml

            var q = Request.Query["q"].ToString();
            var p = Request.Query.GetInt("p", 1);
            var ps = Request.Query.GetInt("ps", 12);

            var result = new PagedResult<IPublishedContent>(0, 1, ps);

            if (!q.IsNullOrWhiteSpace() && _examineManager.TryGetIndex("ExternalIndex", out var index))
            {
                var searchTerms = Tokenize(q);
                var searchFields = new[] { "nodeName", "metaTitle", "description", "shortDescription", "longDescription", "metaDescription", "bodyText", "content" };

                var searcher = index.Searcher;
                var query = new StringBuilder();

                query.Append("+__IndexType:content "); // Must be content
                query.Append("-templateID:0 "); // Must have a template
                query.Append("-umbracoNaviHide:1 "); // Must no be hidden

                // Ensure page contains all search terms in some way
                foreach (var term in searchTerms)
                {
                    var groupedOr = searchFields.Aggregate(new StringBuilder(), (innerQuery, searchField) =>
                    {
                        var format = searchField.Contains(" ") ? @"{0}:""{1}"" " : "{0}:{1}* ";
                        innerQuery.AppendFormat(format, searchField, term);
                        return innerQuery;
                    });

                    query.Append("+(" + groupedOr.ToString() + ") ");
                }

                // Rank content based on positon of search terms in fields
                for(var i = 0; i < searchFields.Length; i++) 
                {
                    foreach (var term in searchTerms)
                    {
                        var searchField = searchFields[i];
                        var format = searchField.Contains(" ") ? @"{0}:""{1}""^{2} " : "{0}:{1}*^{2} ";
                        query.AppendFormat(format, searchField, term, searchFields.Length - i);
                    }
                }

                var examineQuery = searcher.CreateQuery().NativeQuery(query.ToString());
                var results = examineQuery.Execute(new QueryOptions(ps * (p - 1), ps * p));
                var totalResults = results.TotalItemCount;

                var items = results.ToPublishedSearchResults(_umbracoContextAccessor.GetRequiredUmbracoContext().Content)
                    .Select(x => x.Content);

                result = new PagedResult<IPublishedContent>(totalResults, p, ps)
                {
                    Items = items
                };
            }

            return View("SearchResults", result);
        }

        public IEnumerable<string> Tokenize(string input)
        {
            return Regex.Matches(input, @"[\""].+?[\""]|[^ ]+")
                .Cast<Match>()
                .Select(m => m.Value.Trim('\"').ToLower())
                .ToList();
        }
    }
}
