using System.Collections.Generic;
using Umbraco.Core.Models;
using Umbraco.Core.Models.PublishedContent;

namespace Vendr.DemoStore.Models
{
    public class SearchViewModel
    {
        public PagedResult<IPublishedContent> Results { get; set; }

        public IDictionary<IPublishedContent, int> Categories { get; set; }
    }
}
