<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Steadfast pushes most updates by webhook; this catches anything the webhook
// missed. withoutOverlapping so a slow run cannot stack up behind itself.
Schedule::command('courier:sync')
    ->everyFiveMinutes()
    ->withoutOverlapping();

// Conversions the Conversions API rejected or never received. Hourly is often
// enough: Facebook accepts events up to seven days old, so there is no rush,
// and a tighter loop would only hammer an outage.
Schedule::command('fb:retry-events')
    ->hourly()
    ->withoutOverlapping();
