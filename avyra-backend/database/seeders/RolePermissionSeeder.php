<?php

namespace Database\Seeders;

use App\Enums\PermissionModule;
use App\Enums\Role;
use App\Models\RolePermission;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seeds the default matrix. Admin is omitted on purpose: User::canModule()
     * short-circuits for admins, so there is nothing to store or accidentally revoke.
     */
    public function run(): void
    {
        $all = ['view' => true, 'create' => true, 'edit' => true, 'delete' => true, 'approve' => true];
        $readWrite = ['view' => true, 'create' => true, 'edit' => true, 'delete' => false, 'approve' => false];
        $readOnly = ['view' => true, 'create' => false, 'edit' => false, 'delete' => false, 'approve' => false];
        $none = ['view' => false, 'create' => false, 'edit' => false, 'delete' => false, 'approve' => false];

        $matrix = [
            Role::Manager->value => [
                PermissionModule::Dashboard->value => $readOnly,
                PermissionModule::Sales->value => $all,
                PermissionModule::Customers->value => $all,
                PermissionModule::Courier->value => $all,
                PermissionModule::Inventory->value => $all,
                PermissionModule::Purchase->value => $all,
                PermissionModule::Marketing->value => $all,
                PermissionModule::Fraud->value => $all,
                PermissionModule::Reports->value => $readOnly,
                PermissionModule::Settings->value => $none, // settings stay admin-only
            ],
            Role::Employee->value => [
                PermissionModule::Dashboard->value => $readOnly,
                PermissionModule::Sales->value => $readWrite,
                PermissionModule::Customers->value => $readWrite,
                PermissionModule::Courier->value => $readWrite,
                PermissionModule::Inventory->value => $readOnly,
                PermissionModule::Purchase->value => $readOnly,
                PermissionModule::Marketing->value => $readOnly,
                PermissionModule::Fraud->value => $readOnly,
                PermissionModule::Reports->value => $readOnly,
                PermissionModule::Settings->value => $none,
            ],
            // Customers get no admin module access at all.
            Role::User->value => array_fill_keys(PermissionModule::values(), $none),
        ];

        foreach ($matrix as $role => $modules) {
            foreach ($modules as $module => $flags) {
                RolePermission::updateOrCreate(
                    ['role' => $role, 'module' => $module],
                    [
                        'can_view' => $flags['view'],
                        'can_create' => $flags['create'],
                        'can_edit' => $flags['edit'],
                        'can_delete' => $flags['delete'],
                        'can_approve' => $flags['approve'],
                    ],
                );
            }
        }
    }
}
