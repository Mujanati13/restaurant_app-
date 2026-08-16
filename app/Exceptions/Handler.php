<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function render($request, Throwable $exception)
    {
        $response = parent::render($request, $exception);
        $correlationId = $request->attributes->get('correlation_id');
        if ($correlationId) {
            $response->headers->set('X-Request-ID', (string)$correlationId);
        }

        return $response;
    }

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->renderable(function (Throwable $exception, Request $request) {
            if (!$request->expectsJson() || $exception instanceof HttpExceptionInterface || $exception instanceof ValidationException) {
                return null;
            }

            $status = method_exists($exception, 'getStatusCode') ? $exception->getStatusCode() : 500;
            if ($status < 500) {
                return null;
            }

            return response()->json([
                'message' => 'An unexpected server error occurred.',
                'request_id' => $request->attributes->get('correlation_id'),
            ], 500)->header('X-Request-ID', (string)$request->attributes->get('correlation_id'));
        });
    }
}
