// @flow
import { div, toFixed } from 'biggystring'
import { type EdgeDataStore } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { formatNumber } from '../../locales/intl'
import s from '../../locales/strings'
import {
  type FiatProviderQuote,
  type FiatProviderQuoteError,
  type FiatProviderQuoteErrorTypes,
  type FiatProviderStore,
  FiatProviderError
} from './fiatProviderTypes'

export const createStore = (storeId: string, store: EdgeDataStore): FiatProviderStore => {
  return {
    deleteItem: (itemId: string) => store.deleteItem(storeId, itemId),
    listItemIds: () => store.listItemIds(storeId),
    getItem: (itemId: string) => store.getItem(storeId, itemId),
    setItem: (itemId: string, value: string) => store.setItem(storeId, itemId, value)
  }
}

const ERROR_PRIORITIES: { [errorType: FiatProviderQuoteErrorTypes]: number } = {
  underLimit: 1,
  overLimit: 2,
  paymentUnsupported: 3,
  regionRestricted: 4,
  assetUnsupported: 5
}

const ERROR_TEXT = {
  underLimit: s.strings.fiat_plugin_buy_amount_under_limit,
  overLimit: s.strings.fiat_plugin_buy_amount_over_limit,
  paymentUnsupported: s.strings.fiat_plugin_payment_unsupported,
  regionRestricted: s.strings.fiat_plugin_buy_region_restricted,
  assetUnsupported: s.strings.fiat_plugin_asset_unsupported
}

export const getRateFromQuote = (quote: FiatProviderQuote, fiatCode: string): string => {
  const bestRate = div(quote.fiatAmount, quote.cryptoAmount, 16)
  const localeRate = formatNumber(toFixed(bestRate, 0, 2))
  const exchangeRateText = `1 ${quote.tokenId?.tokenId ?? ''} = ${localeRate} ${fiatCode}`
  return exchangeRateText
}

export const getBestError = (errorQuotes: FiatProviderError[], currencyCode: string): string | void => {
  let bestError: FiatProviderQuoteError | void
  for (const eq of errorQuotes) {
    const errorQuote = eq.quoteError
    if (errorQuote == null) continue
    if (bestError == null) {
      bestError = errorQuote
      continue
    }
    if (ERROR_PRIORITIES[errorQuote.errorType] < ERROR_PRIORITIES[bestError.errorType]) {
      bestError = errorQuote
      continue
    }
    if (ERROR_PRIORITIES[errorQuote.errorType] === ERROR_PRIORITIES[bestError.errorType]) {
      if (errorQuote.errorType === 'overLimit' && bestError.errorType === 'overLimit') {
        if (errorQuote.errorAmount > bestError.errorAmount) {
          bestError = errorQuote
        }
      } else if (errorQuote.errorType === 'underLimit' && bestError.errorType === 'underLimit') {
        if (errorQuote.errorAmount < bestError.errorAmount) {
          bestError = errorQuote
        }
      }
    }
  }
  if (bestError == null) return
  let errorText = ERROR_TEXT[bestError.errorType]
  if (bestError.errorType === 'underLimit' || bestError.errorType === 'overLimit') {
    const localeAmount = formatNumber(bestError.errorAmount.toString())
    errorText = sprintf(errorText, localeAmount + ' ' + currencyCode)
  }
  return errorText
}

export const debugSpewStore = async (store: EdgeDataStore): Promise<void> => {
  const theStore = {}
  const storeIds = await store.listStoreIds()
  for (const storeId of storeIds) {
    theStore[storeId] = {}
    const keys = await store.listItemIds(storeId)
    for (const key of keys) {
      const data = await store.getItem(storeId, key)
      theStore[storeId][key] = data
    }
  }
  console.log('*** theStore ***')
  console.log(JSON.stringify(theStore, null, 2))
}
