import { Disklet } from 'disklet'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'

export const approveTokenTerms = async (disklet: Disklet, currencyCode: string) => {
  const title = sprintf(lstrings.token_agreement_modal_title, currencyCode)
  const body = sprintf(lstrings.token_agreement_modal_message, currencyCode, config.appName)

  await Airship.show<boolean>(bridge => <ConfirmContinueModal bridge={bridge} title={title} body={body} />)
}
