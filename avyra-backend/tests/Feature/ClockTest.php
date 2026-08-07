<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserRole;
use App\Support\Clock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * The shop's trading day.
 *
 * Every case here fixes the clock inside the window where UTC and Dhaka disagree
 * about the date — between midnight and 06:00 local. Outside it the bug is
 * invisible, which is exactly why it survived.
 */
class ClockTest extends TestCase
{
    use RefreshDatabase;

    /** 02:00 on 7 August in Dhaka is still 20:00 on 6 August in UTC. */
    private function freezeJustAfterLocalMidnight(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-06 20:00:00', 'UTC'));
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\SettingSeeder::class);
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function order(array $attributes = []): Order
    {
        return Order::create(array_merge([
            'customer_name' => 'Test Buyer',
            'phone' => '01712345678',
            'address' => 'Dhaka',
            'total' => 1500,
            'status' => OrderStatus::Pending,
        ], $attributes));
    }

    private function admin(): User
    {
        $user = User::create([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => 'secret',
        ]);

        UserRole::create(['user_id' => $user->id, 'role' => Role::Admin]);

        return $user->load('roles');
    }

    public function test_the_local_date_is_ahead_of_the_utc_one_after_local_midnight(): void
    {
        $this->freezeJustAfterLocalMidnight();

        $this->assertSame('2026-08-06', now()->toDateString(), 'app.timezone must stay UTC');
        $this->assertSame('2026-08-07', Clock::today());
    }

    public function test_an_order_placed_after_local_midnight_belongs_to_that_morning(): void
    {
        $this->freezeJustAfterLocalMidnight();

        $order = $this->order();

        $this->assertSame('2026-08-07', $order->order_date->toDateString());
    }

    /**
     * The number and the date are read together on every invoice, so a mismatch
     * between them is worse than either being wrong alone.
     */
    public function test_the_order_number_carries_the_same_local_date(): void
    {
        $this->freezeJustAfterLocalMidnight();

        $order = $this->order();

        $this->assertStringStartsWith('AVY-20260807-', $order->order_number);
    }

    public function test_the_zone_comes_from_settings(): void
    {
        Setting::put('company', ['timezone' => 'Europe/London']);

        $this->assertSame('Europe/London', Clock::timezone());
    }

    /**
     * A bad zone must degrade to the fallback, not take the admin panel down —
     * every dashboard tile calls through here.
     */
    public function test_an_unrecognised_zone_falls_back_instead_of_throwing(): void
    {
        Setting::put('company', ['timezone' => 'Mars/Olympus_Mons']);

        $this->assertSame(Clock::FALLBACK, Clock::timezone());
    }

    public function test_the_sql_offsets_follow_the_configured_zone(): void
    {
        Setting::put('company', ['timezone' => 'Asia/Dhaka']);
        $this->assertSame('+06:00', Clock::offset());
        $this->assertSame('+360 minutes', Clock::sqliteModifier());

        Setting::put('company', ['timezone' => 'Asia/Kolkata']);
        $this->assertSame('+05:30', Clock::offset(), 'half-hour zones must survive the round trip');
        $this->assertSame('+330 minutes', Clock::sqliteModifier());
    }

    public function test_a_nonsense_timezone_is_rejected_when_saved(): void
    {
        $this->actingAs($this->admin())
            ->putJson('/api/admin/settings/company', ['value' => ['timezone' => 'Dhaka']])
            ->assertStatus(422)
            ->assertJsonValidationErrors('value.timezone');
    }

    public function test_a_real_timezone_is_accepted_and_takes_effect(): void
    {
        $this->actingAs($this->admin())
            ->putJson('/api/admin/settings/company', ['value' => ['timezone' => 'Asia/Kolkata']])
            ->assertOk();

        $this->assertSame('Asia/Kolkata', Clock::timezone());
    }
}
