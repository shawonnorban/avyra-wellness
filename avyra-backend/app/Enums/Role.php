<?php

namespace App\Enums;

/**
 * Roles are hierarchical: an access check is `level(actual) >= level(required)`,
 * so a manager automatically satisfies anything an employee can do.
 */
enum Role: string
{
    case User = 'user';
    case Employee = 'employee';
    case Manager = 'manager';
    case Admin = 'admin';

    public function level(): int
    {
        return match ($this) {
            self::User => 0,
            self::Employee => 1,
            self::Manager => 2,
            self::Admin => 3,
        };
    }

    public function atLeast(self $required): bool
    {
        return $this->level() >= $required->level();
    }

    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }
}
