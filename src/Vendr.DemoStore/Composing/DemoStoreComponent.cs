using Examine;
using Examine.Providers;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Core;
using Umbraco.Core.Composing;
using Umbraco.Core.Services;
using Umbraco.Core.Services.Implement;
using Umbraco.Web;
using Vendr.DemoStore.Models;
using VendrConstants = Vendr.Core.Constants;

namespace Vendr.DemoStore.Composing
{
    public class DemoStoreComponent : IComponent
    {
        private readonly IExamineManager _examineManager;
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IContentService _contentService;

        public DemoStoreComponent(IExamineManager examineManager,
            IUmbracoContextFactory umbracoContextFactory,
            IContentService contentService)
        {
            _examineManager = examineManager;
            _umbracoContextFactory = umbracoContextFactory;
            _contentService = contentService;
        }

        public void Initialize()
        {
            // ================================================================
            // Generate variant product names
            // ================================================================
            ContentService.Saving += (s, e) =>
            {
                foreach (var item in e.SavedEntities)
                {
                    switch (item.ContentType.Alias)
                    {
                        case ProductVariant.ModelTypeAlias:
                            var parent = _contentService.GetById(item.ParentId);
                            item.SetValue(VendrConstants.Properties.Product.NamePropertyAlias, $"{parent.Name} - {item.Name}");
                            break;
                        case ProductPage.ModelTypeAlias:
                            // TODO: Regenerate variant product names
                            break;
                    }
                }
            };

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
