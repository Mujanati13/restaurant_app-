<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class StorefrontSessionController extends Controller
{
    /** Revoke the bearer token used for the current storefront session. */
    public function destroy(Request $request): Response
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->noContent();
    }
}
