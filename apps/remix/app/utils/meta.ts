import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';

export const appMetaTags = (title?: string) => {
  const description =
    'Pathway Group - Document eSign is a secure and easy-to-use platform for signing documents electronically. Sign contracts, agreements, and more from anywhere, anytime.';
  return [
    {
      title: title ? `${title} - PG eSign` : 'Pathway Group - Document eSign Platform',
    },
    {
      name: 'description',
      content: description,
    },
    {
      name: 'keywords',
      content:
        'Pathway Group - Document eSign, Pathway Group, eSign, eSignature, Document Signing, Digital Signature, Online Signature, Electronic Signature, Sign Documents Online, Secure Document Signing, Legal Document Signing, Contract Signing, PDF Signing, Document Management, Workflow Automation, Remote Signing, Cloud-based eSignatures',
    },
    {
      name: 'author',
      content: 'Pathway First Limited',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      property: 'og:title',
      content: 'Pathway Group - Document eSign Platform',
    },
    {
      property: 'og:description',
      content: description,
    },
    {
      property: 'og:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:site',
      content: '@pathwaygroup',
    },
    {
      name: 'twitter:description',
      content: description,
    },
    {
      name: 'twitter:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
  ];
};
