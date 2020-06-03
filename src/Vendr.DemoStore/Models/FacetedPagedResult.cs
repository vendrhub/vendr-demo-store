using System;
using System.Collections.Generic;
using Umbraco.Core.Models;

namespace Vendr.DemoStore.Models
{
    public class FacetedPagedResult<TResult>
    {
        public IDictionary<string, PagedResult<TResult>> Facets { get; set; }
    }
}
