using Umbraco.Extensions;

namespace Vendr.DemoStore
{
    public static class ObjectExtensions
    {
        public static bool IsNullOrDefault(this object obj, bool toStringable = false)
        {
            var res = obj == null || obj.Equals(obj.GetType().GetDefaultValue());

            if (!res && toStringable)
            {
                res = obj.ToString().IsNullOrWhiteSpace();
            }

            return res;
        }
    }
}
