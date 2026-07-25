# PostHog setup report

PostHog browser analytics was added to the Next.js App Router application, with anonymous event capture, exception tracking, and a starter dashboard.

## Installed and initialized

- Declared and installed `posthog-js` (`^1.300.0` was declared; the installed manifest resolves to `^1.407.1`), with the lockfile updated.
- Added `instrumentation-client.ts` as the single initialization point.
- Initialization reads `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` from environment configuration, enables exception capture, and preserves PostHog default capture behavior. Development reports missing variables; production skips initialization when configuration is absent.
- Added `.env.example` documenting the required variable names and configured the real values in `.env` through the wizard environment tooling.
- No server-side SDK was added because no route handlers or evident server-side code were present.
- No CSP changes were needed because no CSP headers or meta policy were found.

## Instrumented events

| Event | What it measures | File |
|---|---|---|
| `explore_events_clicked` | Visitor selects the primary CTA to browse the event list. | `components/ExploreBtn.tsx` |
| `event_card_clicked` | Visitor opens an event from the featured-event listing. | `components/EventCard.tsx` |
| `home_navigation_clicked` | Visitor selects Home from primary navigation. | `components/Navbar.tsx` |
| `events_navigation_clicked` | Visitor selects Events from primary navigation. | `components/Navbar.tsx` |
| `create_events_navigation_clicked` | Visitor expresses intent to create an event from primary navigation. | `components/Navbar.tsx` |
| `error_recovery_attempted` | Visitor selects Retry after the global error screen appears. | `app/global-error.tsx` |

The event plan and source review recorded six planned custom events. The capture review also found the global `captureException` call, which is error tracking rather than a planned custom event. Event properties are non-PII catalog metadata; no placeholder distinct ID was added. The SDK supplies anonymous attribution.

## User identification

Identification was skipped. The inspected application has no authentication, login or registration flow, session state, logout path, or stable user identifier. Events therefore remain anonymous and are attributed to the SDK-managed anonymous distinct ID and session.

When authentication is introduced, wire `posthog.identify(stableUserId, personProperties)` after login/registration and when an authenticated user is restored on refresh. Use a stable non-PII ID, keep email/name in person properties, and call `posthog.reset()` on logout or account switch.

## Error tracking

Added `app/global-error.tsx` as a client global error boundary. It calls `posthog.captureException(error)` once for the boundary error and preserves the retry action through `reset()`. Initialization also enables exception capture. The run verified the source shape and that the production build compiles; it did not observe an exception arriving in PostHog.

## Dashboard

[Analytics basics (wizard)](https://us.posthog.com/project/525177/dashboard/1893970)

The dashboard was created in PostHog project 525177 with four wizard-tagged insights: event discovery activity, navigation intent, an explore-to-event engagement funnel, and recovery attempts. The run verified that the dashboard and all four insights were created and attached. It did not verify that event data has been ingested; the dashboard may initially be empty until the application emits events.

## Verification and conflicts

- Verified: `npm add posthog-js` completed, adding 11 packages and auditing 370 packages.
- Verified: `npm run build` succeeded with Next.js 16.2.11 and generated all four static pages. This proves the integration compiles; it does not prove network delivery or event flow.
- Not verified: runtime event delivery, event ordering, exception arrival, or populated dashboard results. No application runtime capture observation was recorded.
- `npm run lint` remains red on three pre-existing violations in untouched files: `react/no-unescaped-entities` at `app/page.tsx:9:53`, and `@typescript-eslint/no-explicit-any` at `components/LightRays.tsx:90:30` and `components/LightRays.tsx:95:26`. These were not introduced by the PostHog integration and were deliberately left unchanged.
- Tests were not run because the integration build workflow permitted install, build, typecheck, lint, and format commands only.

## Issues to follow up

- **No stable user attribution is available.** Authentication and a stable user identifier do not exist in the inspected app, so all current events remain anonymous. If left unresolved, user journeys cannot be tied to known accounts or reconciled across authenticated sessions. Add identification at the future authentication boundary as described above.
- **Runtime delivery is unconfirmed.** The run observed compilation and PostHog entity creation, but no event was observed arriving in PostHog. If left unresolved, the dashboard could remain empty despite compiling code.

## Next steps

1. Set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` in every deployment environment, using the exact names documented in `.env.example`; do not rely only on local `.env`.
2. Run the app in a deployed or local browser environment and trigger the six instrumented actions; confirm the events arrive in PostHog and populate the dashboard.
3. Exercise the global error boundary in a safe environment and confirm the exception appears in PostHog Error Tracking.
4. Resolve or explicitly accept the three unrelated lint violations before merging.
5. When authentication is implemented, add stable-ID identification, restoration-on-refresh handling, and logout/account-switch reset behavior.
6. Add future events for registration, filtering, event details, and completed event creation when those workflows exist.

## Before you merge

- [ ] Run a full production build and fix any lint or type errors introduced by generated or integration code.
- [ ] Run the test suite and update mocks or fixtures for the instrumented call sites if needed.
- [ ] Confirm `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` are configured in deployment environments, not only locally, using the names in `.env.example`.
- [ ] Trigger each instrumented action in a running application and confirm events arrive in PostHog; compilation alone does not verify delivery.
- [ ] Confirm the global error boundary reports an exception in PostHog Error Tracking.
