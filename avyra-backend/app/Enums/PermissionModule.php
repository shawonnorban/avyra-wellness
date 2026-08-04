<?php

namespace App\Enums;

/**
 * Admin modules covered by the permission matrix. The HR / manufacturing /
 * accounting modules from the legacy ERP are intentionally not carried over —
 * this build is order management only.
 */
enum PermissionModule: string
{
    case Dashboard = 'dashboard';
    case Sales = 'sales';
    case Customers = 'customers';
    case Courier = 'courier';
    case Inventory = 'inventory';
    case Purchase = 'purchase';
    case Marketing = 'marketing';
    case Fraud = 'fraud';
    case Reports = 'reports';
    case Settings = 'settings';

    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }
}
