/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const LOGO_URL = 'https://nrtyavfilrmnflikyzed.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>אימות כתובת המייל שלכם ב-{siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="48" height="48" alt={siteName} style={logo} />
        <Heading style={h1}>ברוכים הבאים! 🎉</Heading>
        <Text style={text}>
          תודה שנרשמתם ל-
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          אנא אמתו את כתובת המייל שלכם (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) על ידי לחיצה על הכפתור:
        </Text>
        <Button style={button} href={confirmationUrl}>
          אימות כתובת מייל
        </Button>
        <Text style={footer}>
          אם לא יצרתם חשבון, ניתן להתעלם מהמייל הזה בבטחה.
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

export default SignupEmail

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
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: '#338a73',
  color: '#fafafa',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '14px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
