import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as cors from 'cors'
import { SiweMessage, generateNonce } from 'siwe'

const app: express.Express = express()
app.use(cors({ origin: true }))

admin.initializeApp()

app.post('/nonce', async (req, res) => {
  res.set({ 'Access-Control-Allow-Origin': '*' })
  const { address } = req.body
  if (!address) {
    return res.status(422).send({
      message: 'Invalid address',
    })
  }

  const nonce = generateNonce()

  const user = await admin.firestore().doc(`/nonces/${address}`).get()
  if (user.exists) {
    return res.send({
      nonce: nonce,
    })
  }

  await admin.firestore().doc(`/nonces/${address}`).set({
    nonce: nonce,
  })

  return res.send({
    nonce: nonce,
  })
})

app.post('/verify', async (req, res) => {
  res.set({ 'Access-Control-Allow-Origin': '*' })
  try {
    const { address, message, signature } = req.body
    const siweMessage = new SiweMessage(message)
    const fields = await siweMessage.validate(signature)

    const userReference = admin.firestore().doc(`/nonces/${address}`)
    const user = await userReference.get()
    const nonce = user.data()?.nonce
  
    if (fields.nonce !== nonce) {
      return res.status(422).json({
        message: 'Invalid nonce',
      })
    }

    await userReference.set({
      nonce: generateNonce(),
    })

    const customToken = await admin.auth().createCustomToken(address)
    return res.status(200).send({
      token: customToken,
    })
  } catch (error) {
    return res.json({
      message: '',
    })
  }
})

exports.api = functions.region('asia-northeast1').https.onRequest(app)