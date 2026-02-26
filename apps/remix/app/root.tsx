import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  isRouteErrorResponse,
  useLoaderData,
} from 'react-router';
import { PreventFlashOnWrongTheme, ThemeProvider, useTheme } from 'remix-themes';

import { getOptionalSession } from '@documenso/auth/server/lib/utils/get-session';
import { SessionProvider } from '@documenso/lib/client-only/providers/session';
import { APP_I18N_OPTIONS, type SupportedLanguageCodes } from '@documenso/lib/constants/i18n';
import { createPublicEnv } from '@documenso/lib/utils/env';
import { extractLocaleData } from '@documenso/lib/utils/i18n';
import { TrpcProvider } from '@documenso/trpc/react';
import { getSiteSettings } from '@documenso/lib/server-only/site-settings/get-site-settings';
import { SITE_SETTINGS_404_ID } from '@documenso/lib/server-only/site-settings/schemas/404';
import { SITE_SETTINGS_ANALYTICS_ID } from '@documenso/lib/server-only/site-settings/schemas/analytics';
import { getOrganisationSession } from '@documenso/trpc/server/organisation-router/get-organisation-session';
import { Toaster } from '@documenso/ui/primitives/toaster';
import { TooltipProvider } from '@documenso/ui/primitives/tooltip';

import type { Route } from './+types/root';
import stylesheet from './app.css?url';
import { GenericErrorLayout } from './components/general/generic-error-layout';
import { langCookie } from './storage/lang-cookie.server';
import { themeSessionResolver } from './storage/theme-session.server';
import { appMetaTags } from './utils/meta';

const hexToHsl = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};


export const links: Route.LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }];

export function meta() {
  return appMetaTags();
}

/**
 * Don't revalidate (run the loader on sequential navigations) on the root layout
 *
 * Update values via providers.
 */
export const shouldRevalidate = () => false;

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getOptionalSession(request);

  const { getTheme } = await themeSessionResolver(request);

  const cookieHeader = request.headers.get('cookie') ?? '';

  let lang: SupportedLanguageCodes = await langCookie.parse(cookieHeader);

  if (!APP_I18N_OPTIONS.supportedLangs.includes(lang)) {
    lang = extractLocaleData({ headers: request.headers }).lang;
  }

  const disableAnimations = cookieHeader.includes('__disable_animations=true');

  let organisations = null;

  if (session.isAuthenticated) {
    organisations = await getOrganisationSession({ userId: session.user.id });
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  let accentColor = null;

  if (organisations) {
    let currentOrg = null;
    let currentTeam = null;

    if (pathParts[1] === 'o' && pathParts[2]) {
      currentOrg = organisations.find((o) => o.url === pathParts[2]);
    } else if (pathParts[1] === 't' && pathParts[2]) {
      for (const org of organisations) {
        const team = org.teams.find((t) => t.url === pathParts[2]);
        if (team) {
          currentTeam = team;
          currentOrg = org;
          break;
        }
      }
    }

    accentColor = currentTeam?.preferences.accentColor || currentOrg?.preferences.accentColor;
  }

  const siteSettings = await getSiteSettings();

  const analytics = siteSettings.find((s) => s.id === SITE_SETTINGS_ANALYTICS_ID);
  const custom404 = siteSettings.find((s) => s.id === SITE_SETTINGS_404_ID);

  return data(
    {
      lang,
      theme: getTheme(),
      disableAnimations,
      session: session.isAuthenticated
        ? {
            user: session.user,
            session: session.session,
            organisations: organisations || [],
          }
        : null,
      publicEnv: createPublicEnv(),
      analytics: analytics?.enabled ? (analytics.data as any) : null,
      custom404: custom404?.enabled ? (custom404.data as any) : null,
      accentColor,
    },
    {
      headers: {
        'Set-Cookie': await langCookie.serialize(lang),
      },
    },
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme } = useLoaderData<typeof loader>() || {};

  return (
    <ThemeProvider specifiedTheme={theme} themeAction="/api/theme">
      <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>
  );
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { publicEnv, session, lang, disableAnimations, analytics, accentColor, ...data } =
    useLoaderData<typeof loader>() || {};

  const [theme] = useTheme();

  const accentStyles = accentColor
    ? {
        '--primary': accentColor.startsWith('#') ? hexToHsl(accentColor) : accentColor,
        '--accent': accentColor.startsWith('#') ? hexToHsl(accentColor) : accentColor,
      } as React.CSSProperties
    : {};

  return (
    <html
      translate="no"
      lang={lang}
      data-theme={theme}
      className={theme ?? ''}
      style={accentStyles}
    >
      <head>
        <meta charSet="utf-8" />

        {analytics?.googleAnalyticsId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${analytics.googleAnalyticsId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${analytics.googleAnalyticsId}');
                `,
              }}
            />
          </>
        )}

        {analytics?.googleTagManagerId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${analytics.googleTagManagerId}');
              `,
            }}
          />
        )}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="google" content="notranslate" />
        <Meta />
        <Links />
        <meta name="google" content="notranslate" />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />

        {disableAnimations && (
          <style
            dangerouslySetInnerHTML={{
              __html: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
            }}
          />
        )}

        {/* Fix: https://stackoverflow.com/questions/21147149/flash-of-unstyled-content-fouc-in-firefox-only-is-ff-slow-renderer */}
        <script>0</script>
      </head>
      <body>
        {analytics?.googleTagManagerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${analytics.googleTagManagerId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        {/* Global license banner currently disabled. Need to wait until after a few releases. */}
        {/* {licenseStatus === '?' && (
          <div className="bg-destructive text-destructive-foreground">
            <div className="mx-auto flex h-auto max-w-screen-xl items-center justify-center px-4 py-3 text-sm font-medium">
              <div className="flex items-center">
                <AlertTriangleIcon className="mr-2 h-4 w-4" />
                <Trans>This is an expired license instance of Documenso</Trans>
              </div>
            </div>
          </div>
        )} */}

        <SessionProvider initialSession={session}>
          <TooltipProvider>
            <TrpcProvider>
              {children}

              <Toaster />
            </TrpcProvider>
          </TooltipProvider>
        </SessionProvider>

        <ScrollRestoration />
        <Scripts />

        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV__ = ${JSON.stringify(publicEnv)}`,
          }}
        />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const data = useLoaderData<typeof loader>() as any;
  const custom404 = data?.custom404;

  const errorCode = isRouteErrorResponse(error) ? error.status : 500;

  if (errorCode !== 404) {
    console.error('[RootErrorBoundary]', error);
  }

  return <GenericErrorLayout errorCode={errorCode} custom404={custom404} />;
}
