/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL = 'https://nrtyavfilrmnflikyzed.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>קוד האימות שלכם</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="48" height="48" alt="ReviewWise Hub" style={logo} />
        <Heading style={h1}>אימות זהות</Heading>
        <Text style={text}>השתמשו בקוד הבא כדי לאשר את הזהות שלכם:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          הקוד יפוג בקרוב. אם לא ביקשתם את הקוד הזה, ניתן להתעלם מהמייל הזה בבטחה.
        </Text>
        <Text style={supportLink}>
          צריכים עזרה?{' '}
          <Link href="https://reviewshub.info/contact" style={link}>
            צרו קשר עם התמיכה
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Heebo, Arial, sans-serif' }
const container = { padding: '30px 25px', textAlign: 'right' as const }
const logo = { borderRadius: '12px', marginBottom: '20px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#808080',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#338a73',
  margin: '0 0 30px',
  letterSpacing: '4px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const link = { color: 'inherit', textDecoration: 'underline' }
const supportLink = { fontSize: '12px', color: '#999999', margin: '10px 0 0' }
