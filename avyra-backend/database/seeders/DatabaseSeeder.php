<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use App\Models\UserRole;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            SettingSeeder::class,
        ]);

        $warehouse = Warehouse::firstOrCreate(
            ['code' => 'DHK-1'],
            ['name' => 'Dhaka WH-1', 'address' => 'Dhaka, Bangladesh', 'is_active' => true],
        );

        $admin = User::firstOrCreate(
            ['email' => 'admin@avyrabd.com'],
            [
                'name' => 'Avyra Admin',
                // Development credential. Change it before the first deploy.
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        UserRole::firstOrCreate(['user_id' => $admin->id, 'role' => Role::Admin]);

        $this->command->info("Admin: admin@avyrabd.com / password");
        $this->command->info("Warehouse: {$warehouse->name}");
    }
}
