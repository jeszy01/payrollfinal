<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
  public function register(): void
{
    // On Render there is only one database: make "attendance" an alias of the default one.
    if (! config('database.connections.attendance')) {
        config([
            'database.connections.attendance' => config('database.connections.' . config('database.default')),
        ]);
    }
}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
