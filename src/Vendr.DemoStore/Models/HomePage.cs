using System.Collections.Generic;
using System.Linq;

namespace Vendr.DemoStore.Models
{
    public partial class HomePage
    {
        public SearchPage SearchPage => this.Children.OfType<SearchPage>().FirstOrDefault();

        public CartPage CartPage => this.Children.OfType<CartPage>().FirstOrDefault();

        public IEnumerable<CategoryPage> CategoryPages => this.Children.FirstOrDefault(x => x.ContentType.Alias == CategoriesPage.ModelTypeAlias)?.Children.OfType<CategoryPage>();

        public CheckoutPage CheckoutPage => this.Children.OfType<CheckoutPage>().FirstOrDefault();
    }
}
