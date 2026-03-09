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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

const LOGO_URL = 'https://nrtyavfilrmnflikyzed.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>אישור שינוי כתובת מייל ב-{siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="48" height="48" alt={siteName} style={logo} />
        <Heading style={h1}>אישור שינוי כתובת מייל</Heading>
        <Text style={text}>
          ביקשתם לשנות את כתובת המייל שלכם ב-{siteName} מ-
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>
          {' '}ל-
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          לחצו על הכפתור כדי לאשר את השינוי:
        </Text>
        <Button style={button} href={confirmationUrl}>
          אישור שינוי מייל
        </Button>
        <Text style={footer}>
          אם לא ביקשתם שינוי זה, אנא אבטחו את החשבון שלכם מיד.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
