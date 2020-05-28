using System;
using System.Collections.Generic;
using Vendr.Core.Models;
using Vendr.DemoStore.Models;
using Vendr.Web.Adapters;

namespace Vendr.DemoStore.Web.Adapters
{
    /// <summary>
    /// Snapshot decorator to allow us to manipulate the product name by combinding the
    /// product name with it's parent collection name + variant option if type is a variant.
    /// </summary>
    public class CompositeNameUmbracoProductSnapshotDecorator : ProductSnapshotBase
    {
        private readonly UmbracoProductSnapshot _snapshot;

        public CompositeNameUmbracoProductSnapshotDecorator(UmbracoProductSnapshot snapshot)
        {
            _snapshot = snapshot;
        }

        public override string Name => _snapshot.Content.ContentType.Alias == ProductVariant.ModelTypeAlias
            ? $"{_snapshot.Content.Parent.Parent.Name} - {_snapshot.Content.Parent.Name} - {_snapshot.Name}"
            : $"{_snapshot.Content.Parent.Name} - {_snapshot.Name}";

        #region Passthrough

        public override Guid StoreId => _snapshot.StoreId;

        public override string ProductReference => _snapshot.ProductReference;

        public override string Sku => _snapshot.Sku;

        public override Guid? TaxClassId => _snapshot.TaxClassId;

        public override IEnumerable<ProductPrice> Prices => _snapshot.Prices;

        public override IDictionary<string, string> Properties => _snapshot.Properties;

        public override bool IsGiftCard => _snapshot.IsGiftCard;

        #endregion
    }
}
