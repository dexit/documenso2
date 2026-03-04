import type { I18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import * as ReactEmail from '@react-email/render';

import config from '@documenso/tailwind-config';

import { Tailwind } from './components';
import { BrandingProvider, type BrandingSettings } from './providers/branding';

export type RenderOptions = ReactEmail.Options & {
  branding?: BrandingSettings;
  i18n?: I18n;
  emailId?: string;
  globalDesign?: {
    headerHtml?: string;
    footerHtml?: string;
    accentColor?: string;
  };
};

import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const colors = (config.theme?.extend?.colors || {}) as Record<string, string>;

export const render = async (element: React.ReactNode, options?: RenderOptions) => {
  const { branding, emailId, globalDesign, ...otherOptions } = options ?? {};

  const trackingPixel = emailId ? (
    <img
      src={`${NEXT_PUBLIC_WEBAPP_URL()}/api/track/email-open/${emailId}`}
      width="1"
      height="1"
      style={{ display: 'none' }}
      alt=""
    />
  ) : null;

  return ReactEmail.render(
    <BrandingProvider branding={branding}>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                ...colors,
                ...(globalDesign?.accentColor ? { primary: globalDesign.accentColor } : {}),
              },
            },
          },
        }}
      >
        {globalDesign?.headerHtml && (
          <div dangerouslySetInnerHTML={{ __html: globalDesign.headerHtml }} />
        )}
        {element}
        {globalDesign?.footerHtml && (
          <div dangerouslySetInnerHTML={{ __html: globalDesign.footerHtml }} />
        )}
        {trackingPixel}
      </Tailwind>
    </BrandingProvider>,
    otherOptions,
  );
};

export const renderWithI18N = async (element: React.ReactNode, options?: RenderOptions) => {
  const { branding, i18n, emailId, globalDesign, ...otherOptions } = options ?? {};

  if (!i18n) {
    throw new Error('i18n is required');
  }

  const trackingPixel = emailId ? (
    <img
      src={`${NEXT_PUBLIC_WEBAPP_URL()}/api/track/email-open/${emailId}`}
      width="1"
      height="1"
      style={{ display: 'none' }}
      alt=""
    />
  ) : null;

  return ReactEmail.render(
    <I18nProvider i18n={i18n}>
      <BrandingProvider branding={branding}>
        <Tailwind
          config={{
            theme: {
              extend: {
                colors: {
                  ...colors,
                  ...(globalDesign?.accentColor ? { primary: globalDesign.accentColor } : {}),
                },
              },
            },
          }}
        >
          {globalDesign?.headerHtml && (
            <div dangerouslySetInnerHTML={{ __html: globalDesign.headerHtml }} />
          )}
          {element}
          {globalDesign?.footerHtml && (
            <div dangerouslySetInnerHTML={{ __html: globalDesign.footerHtml }} />
          )}
          {trackingPixel}
        </Tailwind>
      </BrandingProvider>
    </I18nProvider>,
    otherOptions,
  );
};
