{
    orderLine: {
        properties: [
            { alias: "color", label: "Color", isReadOnly: true },
            { alias: "size", label: "Size", isReadOnly: true }
        ]
    },
    customer: {
        // Firstname, Lastname and Email are already known
        company: { alias: "company", label: "Company Name" },
        taxCode: { alias: "taxCode", label: "Tax Code" },
        telephone: { alias: "telephone", label: "Telephone" },
    },
    billing: {
        addressLine1: { alias: "billingAddressLine1", label: "Street Address Line 1" },
        addressLine2: { alias: "billingAddressLine2", label: "Street Address Line 2" },
        city: { alias: "billingCity", label: "City" },
        zipCode: { alias: "billingZipCode", label: "Zip Code" },
        // Country and Region are already known
    },
    shipping: {
        sameAsBilling: { alias: "shippingSameAsBilling", label: "Same as billing", trueValue: "1", falseValue: "0" },
        firstName: { alias: "shippingFirstName", label: "First Name" },
        lastName: { alias: "shippingLastName", label: "Last Name" },
        addressLine1: { alias: "shippingAddressLine1", label: "Street Address Line 1" },
        addressLine2: { alias: "shippingAddressLine2", label: "Street Address Line 2" },
        city: { alias: "shippingCity", label: "City" },
        zipCode: { alias: "shippingZipCode", label: "Zip Code" },
        // Country and Region are already known
    },
    notes: {
        customerNotes: { alias: "comments", label: "Customer Comments" },
        internalNotes: { alias: "notes", label: "Internal Notes" }
    },
    additionalInfo: [
        { alias: "ipAddress", label: "IP Address", isReadOnly: true }
    ]
}