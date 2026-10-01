<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeminiService
{
    public function ask(string $system, array $contents): string
    {
        $key = config('services.gemini.key');
        if (! $key) {
            throw new \RuntimeException('GEMINI_API_KEY is not set.');
        }
        $model = config('services.gemini.model');

        $res = Http::withHeaders(['x-goog-api-key' => $key])
            ->timeout(30)
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                'system_instruction' => ['parts' => [['text' => $system]]],
                'contents' => $contents,
                'generationConfig' => ['temperature' => 0.2, 'maxOutputTokens' => 1024],
            ]);

        if ($res->failed()) {
            throw new \RuntimeException('Gemini error ' . $res->status());
        }
        return trim((string) $res->json('candidates.0.content.parts.0.text'));
    }
}