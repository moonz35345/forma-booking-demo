# Forma — salon booking demo

A polished, responsive appointment workspace for a fictional salon. Built with Next.js App Router, TypeScript, Tailwind CSS 4, and Lucide icons.

**[View the live demo →](https://forma-booking.netlify.app/)**

## Run locally

Requires Node.js 20.9+ and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3000. On Windows with PowerShell execution restrictions, use `npm.cmd` instead of `npm`.

```sh
npm test
npm run typecheck
npm run build
npm start
```

## Explore

- **Overview:** selected-day metrics, searchable appointments, team workload, and the most booked service over the last seven days.
- **Appointments:** today, rolling seven-day, or all-time views; client/service search; status and stylist filters; CSV export.
- **Calendar:** day view by stylist and seven-day view. Click any booking to manage it.
- **Booking page** (`/#book`): choose a service, stylist, date, and available time, then enter sample customer details. Confirmation includes a booking reference.
- **Manage appointments:** create, reschedule, mark completed, or cancel from appointment details. Cancelled slots become available again.
- **Customers:** fictional customer directory and visit history, including visits created through the public booking flow. This is a demo selector, not authentication.
- **Services:** add or edit services, prices, categories, duration, and booking visibility. Existing appointment prices and durations are retained.
- **Settings:** configure open days and business hours or reset all demo data. Reset requires confirmation.

## Demo data and booking rules

`lib/booking.ts` is an isolated, pure TypeScript domain layer. The UI initializes sample data around the current browser date, then stores a versioned dataset in browser localStorage under `forma-demo-v1`. Reset regenerates the original data around today. No database, external API, credentials, real emails, payment processing, or account authentication are used. Customer emails are sample labels only. Data is local to this browser; this is not a production or multi-user booking system.

Appointments reserve one stylist for a half-open time interval `[start, end)`. Overlapping non-cancelled appointments for that stylist and day are rejected; adjacent appointments and simultaneous appointments with different stylists are allowed. Availability is generated at 30-minute intervals beginning at opening time. A service's full duration must fit before closing, and closed weekdays and elapsed times are excluded. Saving rechecks availability, validates customer input, and snapshots current service price and duration. Rescheduling excludes only the booking being edited. Completed bookings still occupy their original time. Changing business hours preserves existing bookings and applies the new hours to new or rescheduled appointments.

Dates and times use the browser's local timezone as the fictional studio timezone. Prices are USD. The seed contains historical and upcoming visits; sample records are generated without real customer information. Demo state does not synchronize between browsers or provide transactional multi-tab concurrency guarantees.

## Verification

The 12 passing Node tests cover interval overlaps, adjacent bookings, stylist/day isolation, cancellation, rescheduling, business boundaries, closed days, custom hours, invalid dates/times, long appointments, service snapshots, hidden services, customer validation, and past times. `npm run build` and `npm run typecheck` have also passed.

The running production app was checked in headless Chrome: public booking and confirmation, local persistence, rescheduling, cancellation, adding a service, calendar week view, demo reset, navigation, and mobile overflow at 390px. No browser runtime errors were observed. Local QA screenshots are generated under the ignored `.qa/` directory.

Semantic controls, visible keyboard focus, native modal focus containment, labeled forms, live status messages, reduced-motion support, responsive navigation, and scrollable calendar/table views are included. DM Sans is bundled locally through `@fontsource-variable/dm-sans` and `next/font/local`; visitors make no requests to an external font service. No external image services are required.

## Interface motion

The original olive and ivory palette is paired with softer surfaces and a consistent motion system in `app/motion.css`. Navigation uses native View Transitions when available and falls back to regular React updates with CSS entrances. It includes a sliding navigation indicator, staggered content entry, animated metric updates, smoothly resizing booking steps, modal entry/exit, and hover/press feedback. `lib/motion.tsx` contains the small motion helpers; no animation library is required. The operating system’s reduced-motion preference disables these animations. Browser checks cover rapid navigation, back navigation, input focus, Escape dismissal, and reduced motion.

`app/interface.css` defines the updated typography, spacing, and menu surfaces. Workspace and profile menus expose real demo actions. Appointment filters use keyboard-operable comboboxes with listboxes, selection indicators, typeahead, Arrow/Home/End navigation, Escape dismissal, and outside-click handling. Popovers are rendered outside the table's clipping container and reposition within the viewport. Desktop and mobile browser checks verified font loading, menu focus and navigation, filter selection, outside dismissal, profile actions, and layout overflow.
