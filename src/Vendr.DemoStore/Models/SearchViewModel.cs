using System.Collections.Generic;
using Umbraco.Core.Models.PublishedContent;

namespace Vendr.DemoStore.Models
{
    public class SearchViewModel : FacetedPagedResult<IPublishedContent>
    {
        public IDictionary<string, string> CategoryNames { get; set; }
    }
}
