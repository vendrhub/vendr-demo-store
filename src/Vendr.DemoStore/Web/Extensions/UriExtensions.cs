using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Text;
using System.Web;
using Umbraco.Extensions;

namespace Vendr.DemoStore.Web
{
    public enum QueryStringParamUpdateBehaviour
    {
        Replace,
        Append
    }

    public static class UriExtensions
    {
        public static Uri AddOrUpdateQueryStringParam(this Uri uri, string key, object value, QueryStringParamUpdateBehaviour updateBehaviour = QueryStringParamUpdateBehaviour.Replace)
        {
            if (value.IsNullOrDefault())
                return uri.RemoveQueryStringParam(key);

            var qs = HttpUtility.ParseQueryString(uri.Query);

            if (updateBehaviour == QueryStringParamUpdateBehaviour.Replace || qs.AllKeys.All(x => x != key))
            {
                qs.Set(key, value.ToString());
            }
            else
            {
                var values = qs.GetValues(key)?.ToList() ?? new List<string>();
                if (!values.Contains(value))
                {
                    values.Add(value.ToString());
                }

                qs.Remove(key);
                foreach (var newValue in values)
                {
                    qs.Add(key, newValue);
                }
            }

            var uriBuilder = new UriBuilder(uri)
            {
                Query = qs.ToQueryString()
            };

            return uriBuilder.Uri;
        }

        public static Uri RemoveQueryStringParam(this Uri uri, string key)
        {
            var qs = HttpUtility.ParseQueryString(uri.Query);
            qs.Remove(key);

            var uriBuilder = new UriBuilder(uri)
            {
                Query = qs.ToQueryString()
            };

            return uriBuilder.Uri;
        }

        public static Uri RemoveQueryStringParam(this Uri uri, string key, object value)
        {
            var qs = HttpUtility.ParseQueryString(uri.Query);

            if (qs.AllKeys.Any(x => x == key))
            {
                var values = qs.GetValues(key);
                if (values != null)
                {
                    qs.Remove(key);
                    foreach (var newValue in values.Where(x => x != value.ToString()))
                    {
                        qs.Add(key, newValue);
                    }
                }
            }

            var uriBuilder = new UriBuilder(uri)
            {
                Query = qs.ToQueryString()
            };

            return uriBuilder.Uri;
        }

        public static Uri RemoveQueryString(this Uri uri)
        {
            var uriBuilder = new UriBuilder(uri)
            {
                Query = ""
            };

            return uriBuilder.Uri;
        }
        
        public static string ToQueryString(this NameValueCollection nvc)
        {
            var sb = new StringBuilder();

            foreach (string key in nvc.Keys)
            {
                if (string.IsNullOrEmpty(key)) continue;

                var values = nvc.GetValues(key);
                if (values == null) continue;

                foreach (var value in values.Where(x => !x.IsNullOrWhiteSpace()))
                {
                    sb.Append(sb.Length == 0 ? "" : "&");
                    sb.AppendFormat("{0}={1}", Uri.EscapeDataString(key), Uri.EscapeDataString(value));
                }
            }

            return sb.ToString();
        }
    }
}
