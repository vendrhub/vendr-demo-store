using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Mvc;
using Examine;
using Examine.Facets;
using Lucene.Net.Search;
using Our.Umbraco.Extensions.Facets;
using Our.Umbraco.Extensions.Search;
using Umbraco.Core;
using Umbraco.Core.Models;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Web;
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
        public ActionResult Search(string q = "", string category = "", int p = 1, int ps = 12)
        {
            // The logic for searching is mostly pulled from ezSearch
            // https://github.com/umco/umbraco-ezsearch/blob/master/Src/Our.Umbraco.ezSearch/Web/UI/Views/MacroPartials/ezSearch.cshtml

            // Prepair a view model to return
            var model = new SearchViewModel();

            // Check if the searcher is available
            if (_examineManager.TryGetSearcher("FacetSearcher", out ISearcher searcher) == false)
            {
                throw new Exception("Failed to find searcher");
            }

            // Build the query
            var query = searcher.CreateQuery("Content")
                .IsVisble()
                .And()
                .HasTemplate();

            // Perform the keyword search
            if (q.IsNullOrWhiteSpace() == false)
            {
                var searchTerms = Tokenize(q);

                var searchFields = new[] { "nodeName", "metaTitle", "description", "shortDescription", "longDescription", "metaDescription", "bodyText", "content" };

                var sb = new StringBuilder();

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
                for (var i = 0; i < searchFields.Length; i++) 
                {
                    foreach (var term in searchTerms)
                    {
                        var searchField = searchFields[i];
                        var format = searchField.Contains(" ") ? @"{0}:""{1}""^{2} " : "{0}:{1}*^{2} ";
                        sb.AppendFormat(format, searchField, term, searchFields.Length - i);
                    }
                }

                query.And().ManagedQuery(sb.ToString());
            }
            
            // Search for the category alias
            if (category.IsNullOrWhiteSpace() == false)
            {
                query.And().Field("__Search_categories", category);
            }

            // Fetch facets for categories
            query.And().Facet("categories");

            // Execute search
            var searchResults = query.Execute();

            var results = searchResults
                .GetResults<IPublishedContent>()
                .Skip(ps * (p - 1))
                .Take(ps);

            model.Results = new PagedResult<IPublishedContent>(searchResults.TotalItemCount, p, ps)
            {
                Items = results
            };

            var categories = searchResults
                .GetFacet("categories")
                .ToDictionary(x => UmbracoContext.Content.GetById(Udi.Parse(x.Value.ToString())), x => x.Hits);

            model.Categories = categories;

            return PartialView("SearchResults", model);
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
