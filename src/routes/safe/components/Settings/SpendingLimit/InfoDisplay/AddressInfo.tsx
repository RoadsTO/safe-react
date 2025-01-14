import { Text } from '@gnosis.pm/safe-react-components'
import { ReactElement } from 'react'
import { useSelector } from 'react-redux'

import PrefixedEthHashInfo from 'src/components/PrefixedEthHashInfo'
import { getExplorerInfo } from 'src/config'
import { addressBookEntryName } from 'src/logic/addressBook/store/selectors'
import { ADDRESS_BOOK_DEFAULT_NAME } from 'src/logic/addressBook/model/addressBook'
import { sameString } from 'src/utils/strings'

interface AddressInfoProps {
  address: string
  title?: string
}

const AddressInfo = ({ address, title }: AddressInfoProps): ReactElement => {
  const name = useSelector((state) => addressBookEntryName(state, { address }))

  return (
    <>
      {title && (
        <Text size="xl" strong>
          {title}
        </Text>
      )}
      <PrefixedEthHashInfo
        hash={address}
        name={sameString(name, ADDRESS_BOOK_DEFAULT_NAME) ? undefined : name}
        showCopyBtn
        showAvatar
        textSize="lg"
        explorerUrl={getExplorerInfo(address)}
      />
    </>
  )
}

export default AddressInfo
