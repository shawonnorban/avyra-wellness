<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Collapses the fourteen order statuses onto the six the business works in.
 *
 * The shipping milestones this drops (Processing, Ready, In Courier, Shipped,
 * Ship Later, Returned, Lost) are still recorded per consignment by
 * `CourierStatus`, so no courier detail is lost — only the order-level summary
 * changes. `courier_returns.stock_restored` guards stock restoration off the
 * consignment, not the order status, so returns keep working unchanged.
 *
 * `down()` cannot restore the distinctions this merges away — Delivered and
 * Paid both become `delivered`, and there is no way to tell them apart
 * afterwards. It puts back the closest old value so the column is at least
 * readable by the previous code.
 */
return new class extends Migration
{
    /** old value => new value */
    private const FORWARD = [
        'Pending' => 'pending',
        'Processing' => 'confirm',
        'Confirmed' => 'confirm',
        'Ready' => 'confirm',
        'In Courier' => 'confirm',
        'Shipped' => 'confirm',
        'Delivered' => 'delivered',
        'Paid' => 'delivered',
        'Hold' => 'hold',
        'Ship Later' => 'hold',
        'Returned' => 'cancel',
        'Lost' => 'cancel',
        'Cancelled' => 'cancel',
        'Incomplete' => 'fake',
    ];

    private const BACKWARD = [
        'pending' => 'Pending',
        'hold' => 'Hold',
        'fake' => 'Incomplete',
        'confirm' => 'Confirmed',
        'cancel' => 'Cancelled',
        'delivered' => 'Delivered',
    ];

    public function up(): void
    {
        foreach (self::FORWARD as $old => $new) {
            DB::table('orders')->where('status', $old)->update(['status' => $new]);
        }

        // Anything written by a build we do not know about is parked in `hold`
        // rather than silently left as an unreadable value.
        DB::table('orders')
            ->whereNotIn('status', array_values(self::FORWARD))
            ->update(['status' => 'hold']);
    }

    public function down(): void
    {
        foreach (self::BACKWARD as $new => $old) {
            DB::table('orders')->where('status', $new)->update(['status' => $old]);
        }
    }
};
