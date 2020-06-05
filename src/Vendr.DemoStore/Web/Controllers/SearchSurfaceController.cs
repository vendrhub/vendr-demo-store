using Examine;
using Examine.LuceneEngine.Providers;
using Lucene.Net.Analysis;
using Lucene.Net.Index;
using Lucene.Net.QueryParsers;
using Lucene.Net.Search;
using Lucene.Net.Store;
using Lucene.Net.Util;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Mvc;
using Umbraco.Core;
using Umbraco.Core.Models;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Web.Mvc;
using Vendr.DemoStore.Models;

namespace Vendr.DemoStore.Web.Controllers
{
    public class SearchSurfaceController : SurfaceController
    {
        private readonly IExamineManager _examineManager;

        public SearchSurfaceController(IExamineManager examineManager)
        {
            _examineManager = examineManager;
        }

        [ChildActionOnly]
        public ActionResult Search(string q = "", int p = 1, int ps = 12)
        {
            // The logic for searching is mostly pulled from ezSearch
            // https://github.com/umco/umbraco-ezsearch/blob/master/Src/Our.Umbraco.ezSearch/Web/UI/Views/MacroPartials/ezSearch.cshtml

            // Prepair a view model to return
            var result = new SearchViewModel();

            // Populate category names collection which will be used to
            // provide friendly names for the facet categories
            var homePage = CurrentPage.GetHomePage();
            var categoriesNode = homePage.Children.OfType<CategoriesPage>().FirstOrDefault();
            var categoryNodes = categoriesNode.Children.OfType<CategoryPage>();
            result.CategoryNames = categoryNodes.ToDictionary(x => x.UrlSegment.MakeSearchTermSafe(), x => x.Name);

            // Perform the faceted search
            if (!q.IsNullOrWhiteSpace() && _examineManager.TryGetIndex("ExternalIndex", out var index))
            {
                var searchTerms = Tokenize(q);
                var searchFields = new[] { "nodeName", "metaTitle", "description", "shortDescription", "longDescription", "metaDescription", "bodyText", "content" };

                var sb = new StringBuilder();

                sb.Append("+__IndexType:content "); // Must be content
                sb.Append("-templateID:0 "); // Must have a template
                sb.Append("-umbracoNaviHide:1 "); // Must no be hidden

                // Ensure page contains all search terms in some way
                foreach (var term in searchTerms)
                {
                    var groupedOr = searchFields.Aggregate(new StringBuilder(), (innerQuery, searchField) =>
                    {
                        var format = searchField.Contains(" ") ? @"{0}:""{1}"" " : "{0}:{1}* ";
                        innerQuery.AppendFormat(format, searchField, term);
                        return innerQuery;
                    });

                    sb.Append("+(" + groupedOr.ToString() + ") ");
                }

                // Rank content based on positon of search terms in fields
                for(var i = 0; i < searchFields.Length; i++) 
                {
                    foreach (var term in searchTerms)
                    {
                        var searchField = searchFields[i];
                        var format = searchField.Contains(" ") ? @"{0}:""{1}""^{2} " : "{0}:{1}*^{2} ";
                        sb.AppendFormat(format, searchField, term, searchFields.Length - i);
                    }
                }

                // Perform a faceted search based on search categories
                using (var reader = IndexReader.Open(((LuceneIndex)index).GetLuceneDirectory(), true))
                using (var factedSearcher = new SimpleFacetedSearch(reader, new string[] { "searchCategory" }))
                {
                    var queryParser = new QueryParser(Version.LUCENE_30, "", new KeywordAnalyzer());
                    var query = queryParser.Parse(sb.ToString());
                    var queryResults = factedSearcher.Search(query, ps * p);

                    var facetedResults = new Dictionary<string, PagedResult<IPublishedContent>>();

                    foreach (SimpleFacetedSearch.HitsPerFacet hpg in queryResults.HitsPerFacet)
                    {
                        facetedResults.Add(hpg.Name.ToString(), new PagedResult<IPublishedContent>(hpg.HitCount, p, ps)
                        {
                            Items = hpg.Documents.Skip(ps * (p - 1)).Select(x => UmbracoContext.Content.GetById(int.Parse(x.Get("id")))).ToList()
                        });
                    }

                    result.Facets = facetedResults;
                }
            }

            return PartialView("SearchResults", result);
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
