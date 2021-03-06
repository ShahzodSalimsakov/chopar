import fetch from 'node-fetch'
import querystring from 'querystring'
import { COOKIES } from './constants'

const clientId = process.env.CLIENT_ID
const organizationId = process.env.ORGANIZATION_ID
// const shortCode = process.env.SHORT_CODE
const siteId = process.env.SITE_ID
const version = 'v1'

const host = `https://jsonplaceholder.typicode.com/users`

function createUrl(prePath, postPath, query) {
  return `${host}/${prePath}/${version}/organizations/${organizationId}/${postPath}?${querystring.stringify(
    {
      siteId,
      ...query,
    }
  )}`
}

function decodeUser(req) {
  try {
    const buff = new Buffer(req.cookies[COOKIES.USER], 'base64')
    const text = buff.toString('ascii')
    return JSON.parse(text)
  } catch {
    return {}
  }
}

export function encodeUser(user) {
  const buff = new Buffer(JSON.stringify(user))
  return buff.toString('base64')
}

async function login() {
  const url = createUrl('customer/shopper-customers', 'customers/actions/login', {
    clientId,
  })
  const res = await fetch(url, {
    method: 'post',
    body: JSON.stringify({
      type: 'guest',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const token = res.headers.get('authorization')
  const data = await res.json()
  return {
    token,
    ...data,
  }
}

export default function getClient(req) {
  let user = decodeUser(req)

  async function refreshAuth() {
    user = await login()
  }

  async function fetchWithToken(url, options) {
    if (!user.token) {
      await refreshAuth()
    }

    const opt = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: user.token,
      },
    }

    console.log('Fetching', url)

    let res = await fetch(url, opt)

    console.log('client status', res.statusText)

    if (res.statusText === 'Unauthorized') {
      // Token expired
      console.log('Token expired')
      await refreshAuth()
      return fetchWithToken(url, options)
    } else {
      if (res.statusText === 'OK') {
        return await res.json()
      } else {
        throw new Error(await res.text())
      }
    }
  }

  function api(prePath, postPath, query) {
    const url = createUrl(prePath, postPath, query)
    return fetchWithToken(url)
  }

  function getProduct(id, query = {}) {
    return api('product/shopper-products', `products/${id}`, query)
  }

  function getProducts(query = {}) {
    return api('product/shopper-products', `products`, query)
  }

  function getCategory(id, query = {}) {
    return api('product/shopper-products', `categories/${id}`, query)
  }

  function findProducts(query = {}) {
    return api('search/shopper-search', 'product-search', query)
  }

  // TODO: increase to 3 levels and update menu
  function getMenu(levels = 2) {
    return getCategory('root', { levels })
  }

  function getSuggestions(query = {}) {
    return api('search/shopper-search', 'search-suggestions', query)
  }

  async function session() {
    if (!user.token) {
      console.log('No token or cust id')
      await refreshAuth()
    }
  }

  async function getCart() {
    try {
      const carts = await api('customer/shopper-customers', `customers/${user.customerId}/baskets`)
      if (carts.total === 0) {
        return await createCart()
      } else {
        return carts.baskets[0]
      }
    } catch {
      // If something goes wrong, just make a new one
      return await createCart()
    }
  }

  function createCart() {
    const url = createUrl('checkout/shopper-baskets', 'baskets')
    console.log('Posting to', url)
    return fetchWithToken(url, {
      method: 'post',
      body: JSON.stringify({
        customerInfo: {
          customerId: user.customerId,
          email: 'test@test.com',
        },
      }),
    })
  }

  async function addToCart({ productId, quantity }) {
    const cart = await getCart()
    const url = createUrl('checkout/shopper-baskets', `baskets/${cart.basketId}/items`)
    return fetchWithToken(url, {
      method: 'post',
      body: JSON.stringify([{ productId, quantity }]),
    })
  }

  async function removeFromCart(itemId) {
    const cart = await getCart()
    const url = createUrl('checkout/shopper-baskets', `baskets/${cart.basketId}/items/${itemId}`)
    return fetchWithToken(url, {
      method: 'delete',
    })
  }

  async function updateCart(itemId, quantity) {
    const cart = await getCart()
    const url = createUrl('checkout/shopper-baskets', `baskets/${cart.basketId}/items/${itemId}`)
    return fetchWithToken(url, {
      method: 'patch',
      body: JSON.stringify({ quantity }),
    })
  }

  function signUp({ email, firstName, lastName, password, login }) {
    const url = createUrl('customer/shopper-customers', 'customers')
    return fetchWithToken(url, {
      method: 'post',
      body: JSON.stringify({
        customer: {
          email,
          firstName,
          lastName,
          login,
        },
        password,
      }),
    })
  }

  async function signIn(email, password) {
    const url = createUrl('customer/shopper-customers', 'customers/actions/login', { clientId })
    const buff = new Buffer(`${email}:${password}`)
    const opt = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${buff.toString('base64')}`,
      },
      body: JSON.stringify({
        type: 'credentials',
      }),
    }
    const res = await fetch(url, opt)
    if (res.statusText === 'Unauthorized') {
      throw new Error(await res.text())
    }
    const token = res.headers.get('authorization')
    const data = await res.json()
    user = {
      token,
      authType: data.authType,
      customerId: data.customerId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      login: data.login,
    }
    return user
  }

  return {
    getCategory,
    getCart
,
    session,
    getProduct,
    getProducts,
    getSuggestions,
    getMenu,
    findProducts,
    createCart,
    addToCart,
    removeFromCart,
    updateCart,
    signUp,
    signIn,
    get user() {
      return user
    },
  }
}