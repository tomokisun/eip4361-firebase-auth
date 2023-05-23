import { Inter } from 'next/font/google'
import { ConnectButton, useAccountModal } from '@rainbow-me/rainbowkit'
import { useAccount, useSignMessage } from 'wagmi'
import { useChainId } from 'wagmi'
import { SiweMessage } from 'siwe'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const { openAccountModal } = useAccountModal()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { signMessageAsync } = useSignMessage()

  const signIn = async () => {
    try {
      const response = await fetch('https://asia-northeast1-eip4361-firebase-auth.cloudfunctions.net/api/nonce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address,
        }),
      })
      const json = await response.json()
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: json.nonce,
      })
  
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      })
  
      const verifyResponse = await fetch('https://asia-northeast1-eip4361-firebase-auth.cloudfunctions.net/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address,
          message,
          signature,
        }),
      })
      const verify = await verifyResponse.json()
      console.log('verify', verify)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <button onClick={() => openAccountModal?.()}>Connect Button</button>
      <button onClick={() => signIn()}>Sign-In with Ethereum</button>
    </main>
  )
}
