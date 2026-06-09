import Narvi from 'narvi'
import { generateKeyPairSync } from 'node:crypto'

const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })

const signature = Narvi.getNarviChallengeSignature({
  privateKey,
  challengePid: 'T83H6LH48MMYS497',
  target: 'example@example.com',
  privatePid: '68156984',
})

console.log('Challenge signature:', signature)
console.log('Length (base64):    ', signature.length)
