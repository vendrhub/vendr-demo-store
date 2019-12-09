# Vendr Demo Store

Welcome to the Vendr Demo Store, an example webstore setup using [Vendr](https://getvendr.net) in [Umbraco v8](https://umbraco.com).

<img src="assets/screenshot.png" alt="Screenshot" style="border: 1px solid #e5e5e5;" />

## About this Demo

In this demo you will find a fully configured basic webstore using Vendr on Umbraco v8.2. The store is based around a fictitious tea retailer called Blendid which lists a variety of teas from multiple companies and also displays them in categories. Where products have multiple pricing options, variant nodes are used to provide buying options for those particular product choices.

The site also showcases a basic shopping cart setup with cart management features via the Vendr API as well as a checkout flow following all the main steps required for a Vendr order entity. On checkout, there will also be examples of order confirmation emails that will be sent (**TIP** Use something like [Papercut](https://github.com/ChangemakerStudios/Papercut) to capture these without them needing to be actually sent).

In the back office you'll find a suggested content structure for a working Vendr webstore and you'll also be able to browse the store setup and example orders in the settings and commerce sections respectively.

## System Requirements

To get started with the Vendr demo store you will need:

* Visual Studio 2017 (15.9.7+)
* .NET SDK 4.7.2 or newer

## Getting Started

Clone or download this repository locally (it includes all the files you will need including a fully configured SQL CE database)

````
git clone https://github.com/vendrhub/vendr-demo-store.git
````

Once you have all the files downloaded you can open the `Vendr.DemoStore.sln` solution file in the root of the repository in Visual Studio then press `Ctrl + F5` to launch the site.

To login to the back office you can do so using the credentails:

* **Email** admin@admin.com
* **Password** password1234

## Getting Help

If you require any help with setup or you are having problems getting it working, please ask for help on our [Support Forums](https://our.umbraco.com/packages/website-utilities/vendr/vendr-support/)

## Raising an Issue

If you find any issues with the demo store itself please raise them in the [issues section of this repository](https://github.com/vendrhub/vendr-demo-store/issues), if the issue is a core Vendr product issue however, please raise these in the [issue tracker on the Vendr repository](https://github.com/vendrhub/vendr-demo-store/issues)

## (Probable) FAQs

### I have a project coming up that needs a store, can I use this and upgrade it later when Vendr is actually released?

The intention of this repository at the moment is to offer you a preview of how things are going with the Vendr project. We aren't saying that the API is feature complete or that some underlying patterns / data structures won't change. We'll do our best to document any changes, but if you do use this example as a starting point, you do so at your own risk

### What has happened to feature X that was in Tea Commerce?

 We've tried to translate all the main features from Tea Commerce, our Umbraco v7 only eCommerce solution, however some features may not have made it across yet. Our goal is to make them feature matching however in order to get an initial release out we have decided to remove some features for the time being, such as discounts and multi-variants. These will come back in future releases.

### Where's the documentation at?

We are still working hard on finalizing the Vendr product and this includes the documentation which is still to be done. Due to this we decided to release the preview as a demo store so that you can explore example code in situe and see how it actually works that way. Full documentation will be available on actual product release.

## License

Copyright © 2019 Outfield Digital Ltd

This demo store is [licensed under MIT](LICENSE). The core Vendr product is licensed under an Outfield Digital commercial license (TBC).

