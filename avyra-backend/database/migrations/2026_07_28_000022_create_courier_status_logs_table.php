<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Append-only audit trail of every status the courier reported, so a disputed
        // delivery can be reconstructed even after the consignment row moves on.
        Schema::create('courier_status_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('consignment_id')->constrained('courier_consignments')->cascadeOnDelete();
            $table->string('status', 30);
            $table->string('raw_status')->nullable(); // courier's own wording before mapping
            $table->string('source', 20)->default('sync'); // sync, webhook, manual
            $table->text('note')->nullable();
            $table->timestamp('logged_at')->useCurrent();

            $table->index(['consignment_id', 'logged_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courier_status_logs');
    }
};
