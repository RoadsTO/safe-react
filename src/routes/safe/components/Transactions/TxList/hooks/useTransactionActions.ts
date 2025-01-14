import { MultisigExecutionInfo } from '@gnosis.pm/safe-react-gateway-sdk'
import { useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { isCustomTxInfo, isMultisigExecutionInfo, Transaction } from 'src/logic/safe/store/models/types/gateway.d'
import { getTransactionsByNonce } from 'src/logic/safe/store/selectors/gatewayTransactions'
import { sameAddress } from 'src/logic/wallets/ethAddresses'
import { userAccountSelector } from 'src/logic/wallets/store/selectors'
import { extractSafeAddress } from 'src/routes/routes'
import { grantedSelector } from 'src/routes/safe/container/selector'
import { AppReduxState } from 'src/store'
import { TxLocationContext } from '../TxLocationProvider'

export const isThresholdReached = (executionInfo: MultisigExecutionInfo): boolean => {
  const { confirmationsSubmitted, confirmationsRequired } = executionInfo
  return confirmationsSubmitted >= confirmationsRequired
}

export type TransactionActions = {
  canConfirm: boolean
  canConfirmThenExecute: boolean
  canExecute: boolean
  canCancel: boolean
  isUserAnOwner: boolean
  oneToGo: boolean
}

export const useTransactionActions = (transaction: Transaction): TransactionActions => {
  const currentUser = useSelector(userAccountSelector)
  const safeAddress = extractSafeAddress()
  const isUserAnOwner = useSelector(grantedSelector)
  const { txLocation } = useContext(TxLocationContext)
  const transactionsByNonce = useSelector((state: AppReduxState) =>
    getTransactionsByNonce(state, (transaction.executionInfo as MultisigExecutionInfo)?.nonce ?? -1),
  )
  const canCancel = !transactionsByNonce.some(({ txInfo }) => isCustomTxInfo(txInfo) && txInfo.isCancellation)

  const [state, setState] = useState<TransactionActions>({
    canConfirm: false,
    canConfirmThenExecute: false,
    canExecute: false,
    canCancel: false,
    isUserAnOwner,
    oneToGo: false,
  })

  useEffect(() => {
    if (
      isUserAnOwner &&
      txLocation !== 'history' &&
      isMultisigExecutionInfo(transaction.executionInfo) &&
      transaction.executionInfo
    ) {
      const { missingSigners, confirmationsSubmitted = 0, confirmationsRequired = 0 } = transaction.executionInfo || {}

      const currentUserSigned = !missingSigners?.some((missingSigner) => sameAddress(missingSigner.value, currentUser))
      const oneToGo = confirmationsSubmitted === confirmationsRequired - 1
      const canConfirm = ['queued.next', 'queued.queued'].includes(txLocation) && !currentUserSigned
      const thresholdReached = confirmationsSubmitted >= confirmationsRequired

      setState({
        canConfirm,
        canConfirmThenExecute: txLocation === 'queued.next' && canConfirm && oneToGo,
        canExecute: txLocation === 'queued.next' && thresholdReached,
        canCancel,
        isUserAnOwner,
        oneToGo,
      })
    } else {
      setState((prev) => ({ ...prev, isUserAnOwner }))
    }
  }, [currentUser, isUserAnOwner, safeAddress, transaction, txLocation, canCancel])

  return state
}
