using System;
using System.Collections.Generic;
using Vendr.Core.Models;
using Vendr.DemoStore.Models;
using Vendr.Web.Extractors;

namespace Vendr.DemoStore.Web.Extractors
{
    /// <summary>
    /// Snapshot decorator to allow us to manipulate the product name where the content type
    /// is a variant product. In that situation we want to combine the variant product name
    /// with it's parent product name.
    /// </summary>
    public class ChildVariantUmbracoProductSnapshotDecorator : ProductSnapshotBase
    {
        private readonly UmbracoProductSnapshot _snapshot;

        public ChildVariantUmbracoProductSnapshotDecorator(UmbracoProductSnapshot snapshot)
        {
            _snapshot = snapshot;
        }

        public override string Name => _snapshot.Content.ContentType.Alias == ProductVariant.ModelTypeAlias
            ? $"{_snapshot.Content.Parent.Name} - {_snapshot.Name}"
            : _snapshot.Name;

        #region Passthrough

        public override Guid StoreId => _snapshot.StoreId;

        public override string ProductReference => _snapshot.ProductReference;

        public override string Sku => _snapshot.Sku;

        public override Guid? TaxClassId => _snapshot.TaxClassId;

        public override IEnumerable<ProductPrice> Prices => _snapshot.Prices;

        public override IDictionary<string, string> Properties => _snapshot.Properties;

        #endregion
    }
}
