using System.Text;
using Examine;
using Examine.Facets.BoboBrowse;
using Examine.LuceneEngine.Providers;
using Examine.Providers;
using Umbraco.Core.Composing;

namespace Vendr.DemoStore.Composing
{
    public class DemoStoreComponent : IComponent
    {
        private readonly IExamineManager _examineManager;

        public DemoStoreComponent(IExamineManager examineManager)
        {
            _examineManager = examineManager;
        }

        public void Initialize()
        {
            ConfigureExamine();
        }

        public void Terminate()
        { }

        protected void ConfigureExamine()
        {
            // Listen for nodes being reindexed in the external index set
            if (_examineManager.TryGetIndex("ExternalIndex", out var index))
            {
                index.FieldDefinitionCollection.AddOrUpdate(new FieldDefinition("path", "list"));
                index.FieldDefinitionCollection.AddOrUpdate(new FieldDefinition("categories", "picker"));

                if (index is LuceneIndex luceneIndex)
                {
                    var searcher = new BoboFacetSearcher(
                        "FacetSearcher",
                        luceneIndex.GetIndexWriter(),
                        luceneIndex.DefaultAnalyzer,
                        luceneIndex.FieldValueTypeCollection
                    );

                    _examineManager.AddSearcher(searcher);
                }

                ((BaseIndexProvider)index).TransformingIndexValues += (object sender, IndexingItemEventArgs e) =>
                {
                    // Stuff all the fields into a single field for easier searching
                    var combinedFields = new StringBuilder();

                    foreach (var kvp in e.ValueSet.Values)
                    {
                        foreach (var value in kvp.Value)
                        {
                            combinedFields.AppendLine(value.ToString());
                        }
                    }

                    e.ValueSet.Add("contents", combinedFields.ToString());
                };
            }
        }
    }
}
