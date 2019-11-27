{
    orderLine: {
        properties: []
    },
    customer: {
        // Firstname, Lastname and Email are already known
        company: { alias: "company", label: "Company Name" },
        taxCode: { alias: "taxCode", label: "Tax Code" },
        telephone: { alias: "telephone", label: "Telephone" },
    },
    billing: {
        addressLine1: { alias: "billingAddressLine1", label: "Street Address" },
        addressLine2: { alias: "billingAddressLine2", label: "" },
        city: { alias: "billingCity", label: "City" },
        zipCode: { alias: "billingZipCode", label: "Zip Code" },
        // Country and Region are already known
        telephone: { alias: "billingTelephone", label: "Telephone" },
    },
    shipping: {
        sameAsBilling: { alias: "shippingSameAsBilling", label: "Same as billing address", trueValue: "1" },
        firstName: { alias: "shippingFirstName", label: "First Name" },
        lastName: { alias: "shippingLastName", label: "Last Name" },
        addressLine1: { alias: "shippingAddressLine1", label: "Street Address" },
        addressLine2: { alias: "shippingAddressLine2", label: "" },
        city: { alias: "shippingCity", label: "City" },
        zipCode: { alias: "shippingZipCode", label: "Zip Code" },
        // Country and Region are already known
        telephone: { alias: "shippingTelephone", label: "Telephone" },
    },
    notes: {
        customerNotes: { alias: "comments", label: "Customer Comments" },
        internalNotes: { alias: "notes", label: "Internal Notes" }
    },
    //additionalInfo: [
    //    { alias: "ipAddress", label: "IP Address", isReadOnly: true }
    //]
}