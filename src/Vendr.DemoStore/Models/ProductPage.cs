using System.Linq;
using Umbraco.Core.Models.PublishedContent;

namespace Vendr.DemoStore.Models
{
    public partial class ProductPage
    {
        public IPublishedContent PrimaryImage => this.Images.FirstOrDefault();
    }
}
