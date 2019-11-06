using Umbraco.Core;
using Umbraco.Core.Composing;

namespace Vendr.DemoStore.Composing
{
    public class DemoStoreComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            composition.Components()
                .Append<DemoStoreComponent>();
        }
    }
}
