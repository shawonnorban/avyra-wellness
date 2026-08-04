<?php

namespace Database\Seeders;

use App\Models\LandingPage;
use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * A representative campaign page covering every block type, so the landing
 * design can be checked end to end:
 *   php artisan db:seed --class=DemoLandingPageSeeder
 */
class DemoLandingPageSeeder extends Seeder
{
    public function run(): void
    {
        $product = Product::where('sku', 'AVY-VP-001')->first() ?? Product::first();

        if (! $product) {
            $this->command?->warn('No products found — run DemoDataSeeder first.');

            return;
        }

        LandingPage::updateOrCreate(
            ['slug' => 'vital-plus-offer'],
            [
                'title' => 'Vital Plus Campaign',
                'product_id' => $product->id,
                'headline' => 'ভাইটাল প্লাস — প্রাকৃতিক শক্তির উৎস',
                'sub_headline' => 'পাইন নাট, কাজু, আশ্বগন্ধা ও মাস্টিক গামের সমন্বয়ে তৈরি একটি দৈনন্দিন ওয়েলনেস স্প্রেড।',
                'cta_text' => 'অর্ডার করুন',
                'cta_type' => 'order_form',
                'countdown_end' => now()->addDays(3),
                'show_header' => false,
                'show_footer' => false,
                'is_active' => true,
                'meta_title' => 'ভাইটাল প্লাস অফার',
                'sections' => [
                    ['type' => 'countdown'],
                    [
                        'type' => 'features',
                        'heading' => 'কেন ভাইটাল প্লাস?',
                        'items' => [
                            ['title' => '১০০% প্রাকৃতিক', 'body' => 'কোনো কৃত্রিম রং, প্রিজারভেটিভ বা ফিলার নেই।'],
                            ['title' => 'প্রতিদিন এক চামচ', 'body' => 'সকালে খালি পেটে অথবা কুসুম গরম দুধের সাথে।'],
                            ['title' => 'সার্টিফায়েড ফ্যাসিলিটি', 'body' => 'নিয়ন্ত্রিত পরিবেশে প্রস্তুত ও প্যাকেটজাত।'],
                        ],
                    ],
                    [
                        'type' => 'richtext',
                        'heading' => 'উপাদান সম্পর্কে',
                        'html' => '<p>ভাইটাল প্লাস তৈরি হয়েছে পাইন নাট, কাজুবাদাম, খাঁটি মধু, আশ্বগন্ধা ও মাস্টিক গাম দিয়ে। '
                            . 'প্রতিটি উপাদান আলাদাভাবে বাছাই করা এবং কোনো সিনথেটিক সংযোজন ছাড়াই মেশানো হয়।</p>',
                    ],
                    [
                        'type' => 'faq',
                        'heading' => 'সাধারণ জিজ্ঞাসা',
                        'items' => [
                            ['q' => 'কীভাবে খাবো?', 'a' => 'প্রতিদিন সকালে এক টেবিল চামচ, খালি পেটে।'],
                            ['q' => 'কতদিনে ফল পাবো?', 'a' => 'নিয়মিত ব্যবহারে সাধারণত ৩–৪ সপ্তাহের মধ্যে।'],
                            ['q' => 'ডেলিভারিতে কতদিন লাগে?', 'a' => 'ঢাকায় ১–২ দিন, ঢাকার বাইরে ২–৩ কার্যদিবস।'],
                        ],
                    ],
                    ['type' => 'order_form'],
                ],
            ],
        );

        $this->command?->info('Landing page seeded at /lp/vital-plus-offer');
    }
}
