namespace Vendr.DemoStore
{
    public static class StringExtensions
    {
        public static string MakeSearchTermSafe(this string input)
        {
            return (input ?? "").Replace(" ", "").Replace("-", "").Replace("_", "");
        }
    }
}
