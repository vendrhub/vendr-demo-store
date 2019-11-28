using Examine;
using Examine.Providers;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Core;
using Umbraco.Core.Composing;
using Umbraco.Web;
using Vendr.DemoStore.Models;

namespace Vendr.DemoStore.Composing
{
    public class DemoStoreComponent : IComponent
    {
        private readonly IExamineManager _examineManager;
        private readonly IUmbracoContextFactory _umbracoContextFactory;

        public DemoStoreComponent(IExamineManager examineManager,
            IUmbracoContextFactory umbracoContextFactory)
        {
            _examineManager = examineManager;
            _umbracoContextFactory = umbracoContextFactory;
        }

        public void Initialize()
        {
            // ================================================================
            // Make product categories searchable
            // ================================================================

            // Listen for nodes being reindexed in the external index set
            if (_examineManager.TryGetIndex("ExternalIndex", out var index))
            {
                ((BaseIndexProvider)index).TransformingIndexValues += (object sender, IndexingItemEventArgs e) =>
                {
                    // Make sure node is a product page node
                    if (e.ValueSet.ItemType.InvariantEquals(ProductPage.ModelTypeAlias))
                    {
                        // Make sure some categories are defined
                        if (e.ValueSet.Values.ContainsKey("categories")) 
                        {
                            // Prepare a new collection for category aliases
                            var categoryAliases = new List<string>();

                            // Parse the comma separated list of category UDIs
                            var categoryIds = e.ValueSet.GetValue("categories").ToString().Split(',').Select(GuidUdi.Parse).ToList();

                            // Fetch the category nodes and extract the category alias, adding it to the aliases collection
                            using (var ctx = _umbracoContextFactory.EnsureUmbracoContext())
                            {
                                foreach (var categoryId in categoryIds)
                                {
                                    var category = ctx.UmbracoContext.Content.GetById(categoryId);
                                    if (category != null)
                                    {
                                        categoryAliases.Add(category.UrlSegment);
                                    }
                                }
                            }

                            // If we have some aliases, add these to the lucene index in a searchable way
                            if (categoryAliases.Count > 0)
                            {
                                e.ValueSet.Add("categoryAliases", string.Join(" ", categoryAliases));
                            }
                        }
                    }
                };
            }
        }

        public void Terminate()
        { }
    }
}
