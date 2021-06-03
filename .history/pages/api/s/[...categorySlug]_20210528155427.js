import { subcategory } from 'react-storefront-connector'

export default async function plp(req, res) {
  // Note: the structure of the query string is controlled by the queryForState prop passed
  // to SearchResultsProvider in pages/s/[...categorySlug].js.
  const { q, categorySlug: slug, page, sort, _includeAppData, ...others } = req.query
  const filters = []

  for (let [key, values] of Object.entries(others)) {
    for (let value of values.split(',')) {
      filters.push(`${key}:${value}`)
    }
  }

  res.json(
    await subcategory(
      {
        q,
        slug,
        page,
        filters: JSON.stringify(filters),
        sort,
      },
      {
  "pageData": {
    "id": "1",                                    // the subcategory id
    "name": "Shirts",                             // the name of the subcategory
    "title": "MyStore - Shirts",                  // the title for the document
    "total": 100,                                 // the total number of matching items
    "page": 0,                                    // the current page being returned
    "totalPages": 5,                              // the total number of pages
    "filters": ["color:blue"],                    // the filters that were applied
    "facets": [{                                  // groups of filters to display
      "name": "Color",                            // the name of the facet
      "ui": "buttons|checkboxes",                 // determines the type of UI element displayed
      "options": [{                               // the filters in the group
        "name": "Red",                            // the name of the filter
        "code": "color:red",                      // the code to include in the fetch call when selected

        // ui: "buttons" only
        "image": {                                // the swatch image to display
          "src": "/path/to/swatch",               // the URL for the swatch image
          "alt": "alt text"                       // the alt text for the swatch image
        }
      }]
    }]
    "sort": "rating",                             // the sort that was applied
    "sortOptions": [{                             // available sort options to display
      "name": "Price - Lowest",                   // the option text to display
      "code": "price_asc"                         // the cost to include in the fetch call when selected
    }],
    "products": [{                                // the products in the subcategory
      "id": "1",
      "url": "/p/1"                               // the PDP URL
      "price": 20.99,                             // the numeric price
      "priceText": "$20.99",                      // the text to display for price
      "rating": 4,                                // the product rating from 0 to 5 (float)
      "thumbnail": {                              // the product thumbnail
        "src": "/path/to/thumbnail",              // the URL for the thumbnail
        "alt": "thumbnail alt text"               // the alt textfor the thumbnail
      },
      "colors": {                                 // color options that the user can switch between
        "id": "green",                            // the id of the color
        "image": {                                // the color swatch
          "src": "/path/to/green-swatch",         // the URL for the color swatch image
          "alt": "green"                          // the alt text for the color swatch image
        },
        "media": {
          "thumbnail": {
            "src": "path/to/green-product-image", // the product thumbnail to display when the user selects this color
            "alt": "green product"                // the alt text for thumbnail
          }
        }
      }
    }]
  }
},
      req,
      res
    )
  )
}
