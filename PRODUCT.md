# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Slog is for an individual tracking their own health habits and weight.

## Product Purpose

Slog helps people keep a lightweight, private record of height, weight, waistline, and daily habits so they can notice patterns and maintain routines without depending on a service account.

## Positioning

Slog is local-first: health data is stored in the browser and only leaves the device when the user explicitly chooses to sync a backup to their own Google Drive.

## Operating Context

People open Slog for quick daily check-ins, to add a weight entry, review progress, update habits, or manage their profile. It should remain useful without an internet connection.

## Capabilities and Constraints

- First-run setup collects height and a weight goal, both saved locally for the user's profile.
- Progress logs capture weight and waistline together, can be edited or deleted, and can be charted as Weight, BMI, or Waistline trends.
- Users can create habits with 1–20 targets, choose daily/fortnightly/weekly/monthly frequency, tap daily cards to log progress, build daily streaks, undo same-day logs, and archive habits.
- Google Drive sync is optional and uses the hidden `appDataFolder`.
- An optional passphrase encrypts the Drive backup.
- There is no custom backend or telemetry.

## Brand Commitments

- The product name is Slog.
- The interface should be sleek, modern, minimal, spacious, and use green as its primary color.

## Evidence on Hand

- README.md documents the local-first architecture, features, privacy behavior, and Google OAuth setup.
- The application is a runnable Vite React web app in `src/`.

## Product Principles

- Keep health data private by default.
- Make daily actions quick and calm.
- Show progress clearly without judgment.
- Work offline whenever possible.
