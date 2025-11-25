import * as Sentry from "@sentry/vue";

const initSentry = (app) => {
    Sentry.init({
        app,
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.VITE_ENVIRONMENT || "production",
        release: import.meta.env.VITE_RELEASE || import.meta.env.VITE_APP_VERSION || "unknown",
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.browserProfilingIntegration(),
        ],
        tracePropagationTargets: ["localhost"],
        tracesSampleRate: 1.0,
        sendDefaultPii: true,
    });
};


export default initSentry;

export { Sentry };
