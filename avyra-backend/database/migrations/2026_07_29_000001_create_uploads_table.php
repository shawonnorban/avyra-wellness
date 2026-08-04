<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Registry of every file accepted through the upload endpoint. Image fields
        // elsewhere store a `path` from this table, and validation rejects anything
        // that is not registered here — so an arbitrary external URL can never be
        // saved as an image.
        Schema::create('uploads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('disk', 32)->default('public');
            $table->string('path')->unique();
            $table->string('thumbnail_path')->nullable();
            $table->string('folder', 64)->index();   // products, banners, landing, logos, avatars
            $table->string('original_name');
            $table->string('mime', 100);
            $table->unsignedInteger('size');          // bytes
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->foreignUuid('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uploads');
    }
};
