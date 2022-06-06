using Examine;
using System.Linq;
using System.Collections.Generic;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using Vendr.DemoStore.Models;
using System.Text;

namespace Vendr.DemoStore.Events
{
    public class TransformExamineValues : INotificationHandler<UmbracoApplicationStartingNotification>
    {
        private readonly IExamineManager _examineManager;
        private readonly IUmbracoContextFactory _umbracoContextFactory;

        public TransformExamineValues(IExamineManager examineManager,
            IUmbracoContextFactory umbracoContextFactory)
        {
            _examineManager = examineManager;
            _umbracoContextFactory = umbracoContextFactory;
        }


        public void Handle(UmbracoApplicationStartingNotification notification)
        {
            // Listen for nodes being reindexed in the external index set
            if (_examineManager.TryGetIndex("ExternalIndex", out var index))
            {
                ((BaseIndexProvider)index).TransformingIndexValues += (object sender, IndexingItemEventArgs e) =>
                {
                    var values = e.ValueSet.Values.ToDictionary(x => x.Key, x => (IEnumerable<object>)x.Value);

                    // ================================================================
                    // Make product categories searchable
                    // ================================================================

                    // Make sure node is a product page node
                    if (e.ValueSet.ItemType.InvariantEquals(ProductPage.ModelTypeAlias)
                        || e.ValueSet.ItemType.InvariantEquals(MultiVariantProductPage.ModelTypeAlias))
                    {
                        // Make sure some categories are defined
                        if (e.ValueSet.Values.ContainsKey("categories"))
                        {
                            // Prepare a new collection for category aliases
                            var categoryAliases = new List<string>();

                            // Parse the comma separated list of category UDIs
                            var categoryIds = e.ValueSet.GetValue("categories").ToString().Split(',')
                                .Select(x => UdiParser.TryParse<GuidUdi>(x, out var id) ? id : null)
                                .Where(x => x != null)
                                .ToList();

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
                                values.Add("categoryAliases", new[] { string.Join(" ", categoryAliases) });
                            }
                        }
                    }

                    // ================================================================
                    // Do some generally usefull modifications
                    // ================================================================

                    // Create searchable path
                    if (e.ValueSet.Values.ContainsKey("path"))
                    {
                        values.Add("searchPath", new[] { e.ValueSet.GetValue("path").ToString().Replace(',', ' ') });
                    }

                    // Stuff all the fields into a single field for easier searching
                    var combinedFields = new StringBuilder();

                    foreach (var kvp in e.ValueSet.Values)
                    {
                        foreach (var value in kvp.Value)
                        {
                            combinedFields.AppendLine(value.ToString());
                        }
                    }

                    values.Add("contents", new[] { combinedFields.ToString() });

                    // Update the value
                    e.SetValues(values);
                };
            }
        }
    }
}
