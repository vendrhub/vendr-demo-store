using Examine;
using Examine.LuceneEngine.Providers;
using Examine.LuceneEngine.Search;
using Lucene.Net.Analysis;
using Lucene.Net.Analysis.Standard;
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

            var result = new PagedResult<IPublishedContent>(0, 1, ps);

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

                // Perform a faceted search based on product categories
                var dir = new DirectoryInfo(((LuceneIndex)index).LuceneIndexFolder.FullName);
                using (var searcher = new IndexSearcher(FSDirectory.Open(dir), false))
                using (var factedSearcher = new SimpleFacetedSearch(searcher.IndexReader, new string[] { "categoryAliases" }))
                {
                    var queryParser = new QueryParser(Version.LUCENE_30, "", new KeywordAnalyzer());
                    var query = queryParser.Parse(sb.ToString());

                    var results = factedSearcher.Search(query);

                    var totalResults = results.TotalHitCount; 

                    foreach (SimpleFacetedSearch.HitsPerFacet hpg in results.HitsPerFacet)
                    {
                        var hitCountPerGroup = hpg.HitCount;
                        var facetName = hpg.Name;
                        var items = hpg.Documents.Select(x => UmbracoContext.Content.GetById(int.Parse(x.GetField("id").StringValue))).ToList();

                        //foreach (Document doc in hpg.Documents)
                        //{
                        //    string text = doc.GetField("text").StringValue();

                        //    // replace with logging or your desired output writer
                        //    System.Diagnostics.Debug.WriteLine(">>" + facetName + ": " + text);

                        //}
                    }

                    result = new PagedResult<IPublishedContent>(totalResults, p, ps)
                    {
                        Items = null //pagedResults.Select(x => UmbracoContext.Content.GetById(int.Parse(x.Id)))
                    };
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
