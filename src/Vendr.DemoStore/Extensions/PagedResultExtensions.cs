using System.Linq;
using Vendr.Common.Models;

namespace Vendr.DemoStore
{
    public static class PagedResultExtensions
    {
        public static PagedResult<TTo> Cast<TFrom, TTo>(this PagedResult<TFrom> pagedReuslt)
        {
            return new PagedResult<TTo>(pagedReuslt.TotalItems, pagedReuslt.PageNumber, pagedReuslt.PageSize)
            {
                Items = pagedReuslt.Items.Cast<TTo>()
            };
        }
    }
}
