namespace Vendr.DemoStore.Models
{
    public partial class ProductVariant
    {
        public string ProductName => $"{this.Parent.Name} - {this.Name}";
    }
}
