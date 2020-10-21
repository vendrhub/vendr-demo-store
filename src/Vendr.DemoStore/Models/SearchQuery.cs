using System;

namespace Vendr.DemoStore.Models
{
    public class SearchQuery
    {
        public string Query { get; set; }

        public string Category { get; set; }

        public int Page { get; set; } = 1;

        public int PerPage { get; set; } = 12;
    }
}