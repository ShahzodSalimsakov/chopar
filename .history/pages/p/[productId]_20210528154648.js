import React, { useContext, useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import qs from 'qs'
import useLazyState from 'react-storefront/hooks/useLazyState'
import Breadcrumbs from 'react-storefront/Breadcrumbs'
import CmsSlot from 'react-storefront/CmsSlot'
import MediaCarousel from 'react-storefront/carousel/MediaCarousel'
import PWAContext from 'react-storefront/PWAContext'
import { Container, Grid, Typography, Hidden, Button } from '@material-ui/core'
import { Skeleton } from '@material-ui/lab'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import Row from 'react-storefront/Row'
import { Hbox } from 'react-storefront/Box'
import Label from 'react-storefront/Label'
import Rating from 'react-storefront/Rating'
import get from 'lodash/get'
import fetch from 'react-storefront/fetch'
import { fetchLatest, StaleResponseError } from 'react-storefront/utils/fetchLatest'
import SessionContext from 'react-storefront/session/SessionContext'
import AddToCartConfirmation from '../../components/product/AddToCartConfirmation'
import SuggestedProducts from '../../components/product/SuggestedProducts'
import Lazy from 'react-storefront/Lazy'
import TabPanel from 'react-storefront/TabPanel'
import QuantitySelector from 'react-storefront/QuantitySelector'
import ProductOptionSelector from 'react-storefront/option/ProductOptionSelector'
import fetchFromAPI from 'react-storefront/props/fetchFromAPI'
import createLazyProps from 'react-storefront/props/createLazyProps'

const fetchVariant = fetchLatest(fetch)

const useDidMountEffect = (func, deps) => {
  const didMount = useRef(false)
  useEffect(() => {
    if (didMount.current) {
      func()
    } else {
      didMount.current = true
    }
  }, deps)
}

const styles = theme => ({
  carousel: {
    [theme.breakpoints.down('xs')]: {
      margin: theme.spacing(0, -2),
      width: '100vw',
    },
  },
  lightboxCarousel: {
    [theme.breakpoints.down('xs')]: {
      margin: 0,
      width: '100%',
    },
  },
  confirmation: {
    padding: '2px 0',
  },
  dockedSnack: {
    [theme.breakpoints.down('xs')]: {
      left: '0',
      bottom: '0',
      right: '0',
    },
  },
  docked: {
    [theme.breakpoints.down('xs')]: {
      fontSize: theme.typography.subtitle1.fontSize,
      padding: `${theme.spacing(2)}px`,
      position: 'fixed',
      left: 0,
      bottom: 0,
      width: '100%',
      zIndex: 10,
      borderRadius: '0',
    },
  },
  noShadow: {
    [theme.breakpoints.down('xs')]: {
      boxShadow: 'none',
    },
  },
})

const useStyles = makeStyles(styles)

const Product = React.memo(lazyProps => {
  const theme = useTheme()
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [addToCartInProgress, setAddToCartInProgress] = useState(false)
  const [state, updateState] = useLazyState(lazyProps, {
    pageData: {
      quantity: 1,
      carousel: { index: 0 },
      product: {
        // info for the product.  You can add to this as needed.
        id: '1', // the product id
        url: '/p/1', // the URL for the product page
        name: 'chopar 1', // the name of the product
        price: 10.99, // the price as a number
        priceText: '$10.99', // the price as formatted text with currency
        rating: 4.5, // the product rating
        description: 'product description', // the product description
        specs: 'product specs', // the product specs - this is just a suggestion.  Feel free to add any additional fields needed for the UI.
        media: {
          // images and videos for the MediaCarousel component
          full: [
            {
              // an array of full size images
              src: 'https://domain.com/path/to/image', // the URL of the full size image
              alt: 'alt text', // alt text for the full size image
              type: 'image', // "image" or "video" - by default entries will be treated as images
              magnify: {
                // optional - provides a high-res image for manigfication on hover in desktop browsers
                height: 1200, // the height of the high-res image
                width: 1200, // the width of the high-res image
                src: 'https://domain.com/path/to/image', // the URL of the high res image
              },
            },
          ],
          thumbnails: [
            {
              // an array of thumbnails to display below the main image carousel
              src: 'https://domain.com/path/to/image', // the thumbnail URL
              alt: 'alt text', // alt text for the thumbnail
            },
          ],
        },
        sizes: [
          {
            // an array of available sizes
            id: 'sm', // the size code
            text: 'SM', // text to display on the button corresponding to this size
          },
        ],
        colors: [
          {
            // an array of available colors
            text: 'Red', // optional - text to display below the color button
            id: 'red', // the color code
            image: {
              // the image for the color swatch
              src: 'https://domain.com/path/to/image', // the URL for the color swatch
              alt: 'red', // alt text for the color swatch
            },
            media: {
              // overrides the `media` on the base `product` object when this color is selected
              full: [
                {
                  // this is how you can change images and thumbnails when the user selects a different color
                  src: 'https://domain.com/path/to/image',
                  alt: 'Product 1',
                  type: 'image',
                  magnify: {
                    height: 1200,
                    width: 1200,
                    src: 'https://domain.com/path/to/image',
                  },
                },
              ],
              thumbnails: [
                {
                  src: 'https://domain.com/path/to/image',
                  alt: 'green',
                },
              ],
            },
          },
        ],
      },
    },
  })
  const classes = useStyles()
  const product = get(state, 'pageData.product') || {}
  const color = get(state, 'pageData.color') || {}
  const size = get(state, 'pageData.size') || {}
  const quantity = get(state, 'pageData.quantity')
  const { actions } = useContext(SessionContext)
  const { loading } = state

  // This is provided when <ForwardThumbnail> is wrapped around product links
  const { thumbnail } = useContext(PWAContext)

  // Adds an item to the cart
  const handleSubmit = async event => {
    event.preventDefault() // prevent the page location from changing
    setAddToCartInProgress(true) // disable the add to cart button until the request is finished

    try {
      // send the data to the server
      await actions.addToCart({
        product,
        quantity,
        color: color.id,
        size: size.id,
      })

      // open the confirmation dialog
      setConfirmationOpen(true)
    } finally {
      // re-enable the add to cart button
      setAddToCartInProgress(false)
    }
  }

  const header = (
    <Row>
      <Typography variant="h6" component="h1" gutterBottom>
        {product ? product.name : <Skeleton style={{ height: '1em' }} />}
      </Typography>
      <Hbox>
        <Typography style={{ marginRight: theme.spacing(2) }}>{product.priceText}</Typography>
        <Rating value={product.rating} reviewCount={10} />
      </Hbox>
    </Row>
  )

  // Fetch variant data upon changing color or size options
  useDidMountEffect(() => {
    const query = qs.stringify({ color: color.id, size: size.id }, { addQueryPrefix: true })
    fetchVariant(`/api/p/${product.id}${query}`)
      .then(res => res.json())
      .then(data => {
        return updateState({ ...state, pageData: { ...state.pageData, ...data.pageData } })
      })
      .catch(e => {
        if (!StaleResponseError.is(e)) {
          throw e
        }
      })
  }, [color.id, size.id])

  return (
    <>
      <Breadcrumbs items={!loading && state.pageData.breadcrumbs} />
      <Container maxWidth="lg" style={{ paddingTop: theme.spacing(2) }}>
        <form onSubmit={handleSubmit} method="post" action-xhr="/api/cart">
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={5}>
              <Hidden implementation="css" smUp>
                {header}
              </Hidden>
              <MediaCarousel
                className={classes.carousel}
                lightboxClassName={classes.lightboxCarousel}
                thumbnail={thumbnail.current}
                height="100%"
                media={color.media || (product && product.media)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={7}>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <Hidden implementation="css" xsDown>
                    <div style={{ paddingBottom: theme.spacing(1) }}>{header}</div>
                  </Hidden>
                  {product ? (
                    <>
                      <Hbox style={{ marginBottom: 10 }}>
                        <Label>COLOR: </Label>
                        <Typography>{color.text}</Typography>
                      </Hbox>
                      <ProductOptionSelector
                        options={product.colors}
                        value={color}
                        onChange={value =>
                          updateState({ ...state, pageData: { ...state.pageData, color: value } })
                        }
                        strikeThroughDisabled
                        optionProps={{
                          showLabel: false,
                        }}
                      />
                    </>
                  ) : (
                    <div>
                      <Skeleton style={{ height: 14, marginBottom: theme.spacing(2) }}></Skeleton>
                      <Hbox>
                        <Skeleton style={{ height: 48, width: 48, marginRight: 10 }}></Skeleton>
                        <Skeleton style={{ height: 48, width: 48, marginRight: 10 }}></Skeleton>
                        <Skeleton style={{ height: 48, width: 48, marginRight: 10 }}></Skeleton>
                      </Hbox>
                    </div>
                  )}
                </Grid>
                <Grid item xs={12}>
                  {product ? (
                    <>
                      <Hbox style={{ marginBottom: 10 }}>
                        <Label>SIZE: </Label>
                        <Typography>{size.text}</Typography>
                      </Hbox>
                      <ProductOptionSelector
                        options={product.sizes}
                        value={size}
                        strikeThroughDisabled
                        onChange={value =>
                          updateState({ ...state, pageData: { ...state.pageData, size: value } })
                        }
                      />
                    </>
                  ) : (
                    <div>
                      <Skeleton style={{ height: 14, marginBottom: theme.spacing(2) }}></Skeleton>
                      <Hbox>
                        <Skeleton style={{ height: 48, width: 48, marginRight: 10 }}></Skeleton>
                        <Skeleton style={{ height: 48, width: 48, marginRight: 10 }}></Skeleton>
                        <Skeleton style={{ height: 48, width: 48, marginRight: 10 }}></Skeleton>
                      </Hbox>
                    </div>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Hbox>
                    <Label>QTY:</Label>
                    <QuantitySelector
                      value={quantity}
                      onChange={value =>
                        updateState({ ...state, pageData: { ...state.pageData, quantity: value } })
                      }
                    />
                  </Hbox>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    key="button"
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    data-th="add-to-cart"
                    className={clsx(classes.docked, classes.noShadow)}
                    disabled={addToCartInProgress}
                  >
                    Add to Cart
                  </Button>
                  <AddToCartConfirmation
                    open={confirmationOpen}
                    setOpen={setConfirmationOpen}
                    product={product}
                    color={color}
                    size={size}
                    quantity={quantity}
                    price={product.priceText}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <TabPanel>
              <CmsSlot label="Description">{product.description}</CmsSlot>
              <CmsSlot label="Specs">{product.specs}</CmsSlot>
            </TabPanel>
          </Grid>
          <Grid item xs={12}>
            <Lazy style={{ minHeight: 285 }}>
              <SuggestedProducts product={product} />
            </Lazy>
          </Grid>
        </form>
      </Container>
    </>
  )
})

Product.getInitialProps = createLazyProps(fetchFromAPI)

export default Product
